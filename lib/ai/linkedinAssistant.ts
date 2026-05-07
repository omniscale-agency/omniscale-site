/**
 * Assistant IA pour la rédaction + programmation de posts LinkedIn.
 * Utilise Groq + Llama 3.3 70B Versatile (free tier 30 req/min, 14 400 req/jour)
 * avec function calling natif format OpenAI-compatible.
 *
 * Architecture :
 *  - Le client envoie un historique de chat → /api/integrations/linkedin/ai-chat
 *  - Le serveur stream la réponse via SSE
 *  - Pendant le stream, si le model appelle un outil, on l'exécute server-side
 *    et on renvoie le résultat au model (boucle agentique manuelle)
 *  - Le client affiche le texte au fil de l'eau + une notification quand
 *    un outil est utilisé
 *
 * Historique provider :
 *  - v1: Anthropic Claude (crédits épuisés)
 *  - v2: Google Gemini 2.5 Flash (compte flag PERMISSION_DENIED même après trial $300)
 *  - v3: Groq Llama 3.3 70B ← actuel, free tier ouvert sans bullshit
 *
 * L'interface publique (StreamEvent, executeTool, streamAssistant, ChatMessage)
 * est inchangée — l'API route et l'UI n'ont pas bougé.
 */

import Groq from 'groq-sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const MODEL = 'llama-3.3-70b-versatile';

/** System prompt — gardé stable. */
export const SYSTEM_PROMPT = `Tu es l'assistant marketing d'Omniscale, une agence française qui scale les business via social media, ads, sites internet, marketing d'influence et production de contenu.

Ton job : aider l'admin (Rayan, fondateur) à rédiger et programmer des posts LinkedIn percutants pour le compte Omniscale.

# Style des posts LinkedIn Omniscale

- **Ton** : direct, "tu", sans bullshit, en français
- **Format** : phrases courtes, retours à la ligne fréquents, listes à puces autorisées (utilise – ou •), max 1500 caractères pour la lisibilité
- **Structure** : Hook accrocheur (1ère ligne) → Développement (problème, insight, story) → Conclusion ou CTA
- **Hashtags** : 3-5 max, en fin de post, pertinents (ex: #marketing #scaling #commerce #IA)
- **Emojis** : avec parcimonie, pour ponctuer pas pour décorer (1-3 max)
- **Pas de** : "🚀 Excited to announce", buzzwords creux, langage corporate, "j'ai le plaisir de"
- **Sujets pertinents** : scaling commerces/business, social media stratégique, ads Meta/TikTok rentables, contenu qui convertit, cas clients réels, anti-bullshit marketing

# Capacités

Tu as accès à 4 outils :

1. **create_draft** : crée un brouillon de post (status="draft", non publié, non programmé). Utilise-le pour proposer des versions à valider.
2. **schedule_post** : programme un post pour publication automatique à une date/heure précise (status="scheduled"). Le format de date attendu est ISO 8601 avec timezone Paris (ex: "2026-05-15T09:00:00+02:00").
3. **list_scheduled** : liste les posts programmés à venir.
4. **cancel_scheduled** : annule un post programmé via son ID.

# Comportement attendu

- Quand l'admin te demande "écris un post sur X" → crée 1 draft via create_draft, puis demande s'il veut le programmer
- Quand il te demande "programme N posts cette semaine sur Y" → crée chaque draft puis programme-les via schedule_post (matin = 9h, midi = 12h30, soir = 18h heure de Paris)
- Quand il te dit "voir les posts programmés" → list_scheduled
- Quand il te dit "annule le post du X" → list_scheduled puis cancel_scheduled avec l'ID
- Sois proactif : si l'admin propose un sujet vague, propose 2-3 angles différents avant d'écrire
- Toujours montrer le texte du post en clair dans ta réponse, même quand tu utilises create_draft (l'admin doit voir ce qu'il a créé)
- Conversation en français, même si l'admin t'écrit en anglais.

Aujourd'hui c'est ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;

// ────────────────────────────────────────────────────────
// Tool definitions (OpenAI-compatible format used by Groq)
// ────────────────────────────────────────────────────────
const TOOLS: Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}> = [
  {
    type: 'function',
    function: {
      name: 'create_draft',
      description: 'Crée un brouillon de post LinkedIn (non publié). À utiliser quand tu rédiges un post pour validation.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Le contenu textuel du post (max 3000 caractères, supporte les retours à la ligne, hashtags, emojis).',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_post',
      description: 'Programme un post LinkedIn pour publication automatique à une date/heure précise. Le post sera publié par un cron tous les 5 minutes une fois la date atteinte.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Le contenu du post à programmer.',
          },
          scheduled_at: {
            type: 'string',
            description: 'Date et heure de publication ISO 8601 avec timezone Europe/Paris, ex: "2026-05-15T09:00:00+02:00". Doit être dans le futur.',
          },
        },
        required: ['text', 'scheduled_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_scheduled',
      description: 'Liste les posts LinkedIn actuellement programmés (status=scheduled), triés par date de publication ascendante.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_scheduled',
      description: "Annule un post programmé via son ID. Le post passe de status=scheduled à status=draft (non supprimé, l'admin peut le réutiliser).",
      parameters: {
        type: 'object',
        properties: {
          post_id: {
            type: 'string',
            description: "L'UUID du post à annuler (obtenu via list_scheduled).",
          },
        },
        required: ['post_id'],
      },
    },
  },
];

// ────────────────────────────────────────────────────────
// Tool executors (server-side, hit Supabase) — INCHANGÉ
// ────────────────────────────────────────────────────────
function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function executeTool(name: string, input: any, userId: string): Promise<string> {
  const sb = adminClient();
  try {
    switch (name) {
      case 'create_draft': {
        const text = String(input?.text || '').trim();
        if (!text) return JSON.stringify({ error: 'text manquant' });
        if (text.length > 3000) return JSON.stringify({ error: 'Post trop long (max 3000 caractères)' });
        const { data, error } = await sb.from('linkedin_posts').insert({
          text_content: text,
          status: 'draft',
          created_by: userId,
        }).select('id, created_at').single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          ok: true,
          post_id: data.id,
          status: 'draft',
          message: `Brouillon créé. ID: ${data.id}. L'admin peut le publier ou le programmer manuellement depuis l'UI, ou te demander de le programmer.`,
        });
      }
      case 'schedule_post': {
        const text = String(input?.text || '').trim();
        const when = String(input?.scheduled_at || '').trim();
        if (!text) return JSON.stringify({ error: 'text manquant' });
        if (text.length > 3000) return JSON.stringify({ error: 'Post trop long (max 3000 caractères)' });
        const dt = new Date(when);
        if (isNaN(dt.getTime())) return JSON.stringify({ error: `scheduled_at invalide : "${when}". Format attendu : ISO 8601 (ex: "2026-05-15T09:00:00+02:00")` });
        if (dt.getTime() < Date.now()) return JSON.stringify({ error: `scheduled_at est dans le passé (${dt.toISOString()})` });
        const { data, error } = await sb.from('linkedin_posts').insert({
          text_content: text,
          status: 'scheduled',
          scheduled_at: dt.toISOString(),
          created_by: userId,
        }).select('id, scheduled_at').single();
        if (error) return JSON.stringify({ error: error.message });
        const fr = dt.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
        return JSON.stringify({
          ok: true,
          post_id: data.id,
          scheduled_at: data.scheduled_at,
          scheduled_at_fr: fr,
          message: `Post programmé pour ${fr} (heure de Paris). Sera publié automatiquement par notre cron.`,
        });
      }
      case 'list_scheduled': {
        const { data, error } = await sb
          .from('linkedin_posts')
          .select('id, text_content, scheduled_at, status, created_at')
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          ok: true,
          count: data?.length || 0,
          posts: (data || []).map((p) => ({
            id: p.id,
            preview: p.text_content.slice(0, 120),
            scheduled_at: p.scheduled_at,
            scheduled_at_fr: new Date(p.scheduled_at).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
          })),
        });
      }
      case 'cancel_scheduled': {
        const id = String(input?.post_id || '').trim();
        if (!id) return JSON.stringify({ error: 'post_id manquant' });
        const { data: existing } = await sb.from('linkedin_posts').select('status, text_content').eq('id', id).maybeSingle();
        if (!existing) return JSON.stringify({ error: `Post ${id} introuvable` });
        if (existing.status !== 'scheduled') return JSON.stringify({ error: `Post ${id} n'est pas programmé (status=${existing.status})` });
        const { error } = await sb.from('linkedin_posts').update({
          status: 'draft',
          scheduled_at: null,
        }).eq('id', id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          ok: true,
          message: `Post ${id} annulé (repassé en brouillon, pas supprimé). Preview: "${existing.text_content.slice(0, 80)}..."`,
        });
      }
      default:
        return JSON.stringify({ error: `Outil inconnu : ${name}` });
    }
  } catch (e: any) {
    return JSON.stringify({ error: e?.message || 'Erreur exécution outil' });
  }
}

// ────────────────────────────────────────────────────────
// Public types — INCHANGÉS pour ne pas casser l'API route
// ────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'done' | 'error';
  text?: string;
  tool_name?: string;
  tool_input?: any;
  tool_result?: string;
  error?: string;
  usage?: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number };
}

// ────────────────────────────────────────────────────────
// Streaming chat with manual tool loop (Groq)
// ────────────────────────────────────────────────────────
type ChatCompletionMessageParam = Groq.Chat.Completions.ChatCompletionMessageParam;

/**
 * Streame la réponse de l'assistant en exécutant les tool_calls server-side.
 * Yield des StreamEvents qu'on peut sérialiser en SSE côté API route.
 *
 * Usage : `for await (const ev of streamAssistant(messages, userId)) { ... }`
 */
export async function* streamAssistant(
  messages: ChatMessage[],
  userId: string,
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    yield { type: 'error', error: 'GROQ_API_KEY non configuré côté serveur (à ajouter dans Vercel env vars).' };
    return;
  }

  const groq = new Groq({ apiKey });

  // Convert ChatMessage[] → OpenAI format avec system prompt en tête
  const conversation: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // Boucle agentique
  let iter = 0;
  const MAX_ITER = 8;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (iter < MAX_ITER) {
    iter++;
    let collectedText = '';
    // Tool calls accumulés depuis les chunks (chaque chunk peut contenir des deltas partiels)
    const toolCalls: Array<{ id: string; name: string; argsJson: string }> = [];

    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages: conversation,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta;

        // Text delta
        if (delta?.content) {
          collectedText += delta.content;
          yield { type: 'text', text: delta.content };
        }

        // Tool call deltas (peuvent arriver fragmentés sur plusieurs chunks)
        if (delta?.tool_calls) {
          for (const tcDelta of delta.tool_calls) {
            const idx = tcDelta.index ?? 0;
            if (!toolCalls[idx]) {
              toolCalls[idx] = { id: '', name: '', argsJson: '' };
            }
            if (tcDelta.id) toolCalls[idx].id = tcDelta.id;
            if (tcDelta.function?.name) toolCalls[idx].name = tcDelta.function.name;
            if (tcDelta.function?.arguments) toolCalls[idx].argsJson += tcDelta.function.arguments;
          }
        }

        // Track usage si dispo (dernier chunk — Groq peut le mettre dans x_groq.usage)
        const usage = (chunk as any).usage || (chunk as any).x_groq?.usage;
        if (usage) {
          totalInputTokens = usage.prompt_tokens || totalInputTokens;
          totalOutputTokens = usage.completion_tokens || totalOutputTokens;
        }
      }
    } catch (e: any) {
      yield { type: 'error', error: e?.message || 'Erreur Groq API' };
      return;
    }

    // Assistant message à pousser dans l'historique
    if (toolCalls.length > 0) {
      conversation.push({
        role: 'assistant',
        content: collectedText || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.argsJson },
        })),
      });
    } else if (collectedText) {
      conversation.push({ role: 'assistant', content: collectedText });
    }

    // Pas de tool calls → fin du tour
    if (toolCalls.length === 0) {
      yield {
        type: 'done',
        usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
      };
      return;
    }

    // Exécute chaque tool call et accumule les responses
    for (const tc of toolCalls) {
      let parsedArgs: any = {};
      try { parsedArgs = JSON.parse(tc.argsJson); } catch {}

      yield {
        type: 'tool_use',
        tool_name: tc.name,
        tool_input: parsedArgs,
      };
      const resultJson = await executeTool(tc.name, parsedArgs, userId);
      yield {
        type: 'tool_result',
        tool_name: tc.name,
        tool_result: resultJson,
      };

      // Append tool message (Groq/OpenAI format)
      conversation.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: resultJson,
      });
    }
    // Loop continue
  }

  yield { type: 'error', error: `Limite de ${MAX_ITER} tours atteinte.` };
}
