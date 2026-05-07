/**
 * Assistant IA pour la rédaction + programmation de posts LinkedIn.
 * Utilise Google Gemini 2.5 Flash (free tier généreux : 15 req/min, 1M tokens/jour)
 * avec custom tools en function calling natif.
 *
 * Architecture :
 *  - Le client envoie un historique de chat → /api/integrations/linkedin/ai-chat
 *  - Le serveur stream la réponse Gemini via SSE
 *  - Pendant le stream, si Gemini appelle un outil, on l'exécute server-side
 *    et on renvoie le résultat à Gemini (boucle agentique manuelle)
 *  - Le client affiche le texte au fil de l'eau + une notification quand
 *    un outil est utilisé
 *
 * Migration : on est passés d'Anthropic Claude à Gemini parce que les credits
 * Anthropic étaient épuisés. Gemini free tier suffit largement pour cet usage
 * (quelques posts par jour). L'interface publique (StreamEvent, executeTool,
 * streamAssistant) est inchangée — l'API route et l'UI n'ont pas bougé.
 */

import { GoogleGenAI, Type, Content, Part, FunctionDeclaration } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const MODEL = 'gemini-2.5-flash';

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
// Tool definitions (Gemini function declaration format)
// ────────────────────────────────────────────────────────
const TOOLS: FunctionDeclaration[] = [
  {
    name: 'create_draft',
    description: 'Crée un brouillon de post LinkedIn (non publié). À utiliser quand tu rédiges un post pour validation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: 'Le contenu textuel du post (max 3000 caractères, supporte les retours à la ligne, hashtags, emojis).',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'schedule_post',
    description: 'Programme un post LinkedIn pour publication automatique à une date/heure précise. Le post sera publié par un cron tous les 5 minutes une fois la date atteinte.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: 'Le contenu du post à programmer.',
        },
        scheduled_at: {
          type: Type.STRING,
          description: 'Date et heure de publication ISO 8601 avec timezone Europe/Paris, ex: "2026-05-15T09:00:00+02:00". Doit être dans le futur.',
        },
      },
      required: ['text', 'scheduled_at'],
    },
  },
  {
    name: 'list_scheduled',
    description: 'Liste les posts LinkedIn actuellement programmés (status=scheduled), triés par date de publication ascendante.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'cancel_scheduled',
    description: 'Annule un post programmé via son ID. Le post passe de status=scheduled à status=draft (non supprimé, l\'admin peut le réutiliser).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        post_id: {
          type: Type.STRING,
          description: 'L\'UUID du post à annuler (obtenu via list_scheduled).',
        },
      },
      required: ['post_id'],
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
// Streaming chat with manual tool loop (Gemini)
// ────────────────────────────────────────────────────────
/**
 * Streame la réponse de l'assistant en exécutant les function calls server-side.
 * Yield des StreamEvents qu'on peut sérialiser en SSE côté API route.
 *
 * Usage : `for await (const ev of streamAssistant(messages, userId)) { ... }`
 */
export async function* streamAssistant(
  messages: ChatMessage[],
  userId: string,
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    yield { type: 'error', error: 'GEMINI_API_KEY non configuré côté serveur (à ajouter dans Vercel env vars).' };
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convertit l'historique chat en format Gemini Content[]
  // (user → 'user', assistant → 'model')
  const conversation: Content[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Boucle agentique : on continue tant que le model retourne des function calls
  let iter = 0;
  const MAX_ITER = 8;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (iter < MAX_ITER) {
    iter++;
    let collectedText = '';
    let collectedFunctionCalls: Array<{ name: string; args: Record<string, any> }> = [];

    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL,
        contents: conversation,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: TOOLS }],
          temperature: 0.7,
        },
      });

      for await (const chunk of stream) {
        // Stream text delta
        const txt = chunk.text;
        if (txt) {
          collectedText += txt;
          yield { type: 'text', text: txt };
        }
        // Function calls (peuvent arriver dans le même chunk ou les suivants)
        const calls = chunk.functionCalls;
        if (calls && calls.length > 0) {
          for (const c of calls) {
            collectedFunctionCalls.push({
              name: c.name || '',
              args: (c.args || {}) as Record<string, any>,
            });
          }
        }
        // Track usage si dispo dans le dernier chunk
        const usage = chunk.usageMetadata;
        if (usage) {
          totalInputTokens = usage.promptTokenCount || totalInputTokens;
          totalOutputTokens = usage.candidatesTokenCount || totalOutputTokens;
        }
      }
    } catch (e: any) {
      yield { type: 'error', error: e?.message || 'Erreur Gemini API' };
      return;
    }

    // Construit le message assistant à pousser dans l'historique
    const assistantParts: Part[] = [];
    if (collectedText) {
      assistantParts.push({ text: collectedText });
    }
    for (const fc of collectedFunctionCalls) {
      assistantParts.push({ functionCall: { name: fc.name, args: fc.args } });
    }
    if (assistantParts.length > 0) {
      conversation.push({ role: 'model', parts: assistantParts });
    }

    // Pas de function calls → fin du tour
    if (collectedFunctionCalls.length === 0) {
      yield {
        type: 'done',
        usage: {
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
        },
      };
      return;
    }

    // Exécute chaque function call et accumule les responses
    const responseParts: Part[] = [];
    for (const fc of collectedFunctionCalls) {
      yield {
        type: 'tool_use',
        tool_name: fc.name,
        tool_input: fc.args,
      };
      const resultJson = await executeTool(fc.name, fc.args, userId);
      yield {
        type: 'tool_result',
        tool_name: fc.name,
        tool_result: resultJson,
      };
      // Gemini attend un objet, pas une string — on parse pour donner un response structuré
      let parsed: any;
      try { parsed = JSON.parse(resultJson); } catch { parsed = { result: resultJson }; }
      responseParts.push({
        functionResponse: {
          name: fc.name,
          response: parsed,
        },
      });
    }

    // Ajoute les function responses comme tour 'user' (convention Gemini)
    conversation.push({ role: 'user', parts: responseParts });
    // Loop continue
  }

  yield { type: 'error', error: `Limite de ${MAX_ITER} tours atteinte.` };
}
