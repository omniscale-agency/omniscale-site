/**
 * Assistant IA pour la rédaction + programmation de tweets X (Twitter).
 * Mirror exact de lib/ai/linkedinAssistant.ts, adapté à X :
 *  - 280 caractères max au lieu de 3000
 *  - Style direct, punchy, moins corporate (≠ LinkedIn)
 *  - Pas de tool publish_now séparé : `publishTweet` au lieu de `publishTextPost`
 *  - Tables `x_posts` au lieu de `linkedin_posts`
 *
 * Provider : Groq + openai/gpt-oss-120b (même que LinkedIn).
 */

import Groq from 'groq-sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { publishTweet, refreshAccessToken } from '@/lib/social/x';

export const MODEL = 'openai/gpt-oss-120b';

export const SYSTEM_PROMPT = `Tu es l'assistant marketing d'Omniscale, une agence française qui scale les business via social media, ads, sites internet, marketing d'influence et production de contenu.

Ton job : aider l'admin (Rayan, fondateur) à rédiger et programmer des tweets percutants pour le compte X d'Omniscale.

# Style des tweets Omniscale

- **Format** : 280 caractères MAX absolu, idéalement entre 100 et 230 pour la lisibilité
- **Ton** : très direct, "tu", punchy, opinionné, sans bullshit, en français
- **Structure** : un hook qui claque, une vérité gênante / contre-intuitive / utile, parfois une chute
- **Tweets virables** : threads d'opinion, takes contrarian, observations terrain, insights chiffrés courts
- **Emojis** : très peu, 0-1 max par tweet, jamais en début
- **Hashtags** : **0 hashtag** la plupart du temps. À la limite 1-2 si pertinent (#DTC, #Ads). Pas de "#marketing #scaling" en chapelet
- **Pas de** : "🚀 Big news", "Excited to share", "PSA :", "Hot take:", "Thread 👇", "1/", langage corporate
- **Sujets pertinents** : scaling commerces/business, social media stratégique, ads Meta/TikTok rentables, contenu qui convertit, cas clients réels, anti-bullshit marketing, IA en marketing, retours d'expérience

Exemple de bon tweet :
"95% des commerces font les mêmes 3 posts Insta : produit, équipe, citation Pinterest. Aucun storytelling. Aucun hook. Aucune raison de te suivre.
Le pire ? Ils s'étonnent que ça scale pas."

# Capacités

Tu as accès à 5 outils :

1. **create_draft** : crée un brouillon de tweet (status="draft", non publié, non programmé). Pour proposer des versions à valider.
2. **publish_now** : publie IMMÉDIATEMENT sur X (status="published"). À utiliser sur "publie", "tweet", "envoie", "go", "post-le", etc.
3. **schedule_post** : programme un tweet pour publication automatique à une date/heure (status="scheduled"). Format ISO 8601 timezone Paris (ex: "2026-05-15T09:00:00+02:00").
4. **list_scheduled** : liste les tweets programmés à venir.
5. **cancel_scheduled** : annule un tweet programmé via son ID.

# Comportement attendu

- "Écris un tweet sur X" → crée 1 draft via create_draft, demande s'il veut le publier ou programmer
- "Publie-le" / "Tweet ça" / "Go" → publish_now avec le texte du dernier draft
- "Programme N tweets cette semaine sur Y" → schedule_post chacun (matin = 9h, midi = 12h30, fin de journée = 18h Paris)
- "Voir mes tweets programmés" → list_scheduled
- "Annule le tweet de X" → list_scheduled puis cancel_scheduled avec l'ID
- Sois proactif : si l'admin demande un sujet vague, propose 2-3 angles courts (1 ligne chacun) avant d'écrire
- Toujours montrer le texte EXACT du tweet en clair dans ta réponse (avec le compteur de caractères entre parenthèses ex: "243/280")
- VÉRIFIE TOUJOURS que ton tweet fait ≤ 280 caractères. Si ça dépasse → reformule plus court
- Conversation en français.

Aujourd'hui c'est ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;

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
      description: 'Crée un brouillon de tweet (non publié). Pour proposer une version à valider. Max 280 caractères.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Le contenu du tweet (max 280 caractères).' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'publish_now',
      description: 'Publie IMMÉDIATEMENT un tweet sur X. À utiliser quand l\'admin valide un draft et veut le poster ("publie", "tweet ça", "envoie", "go").',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Le contenu du tweet à publier (max 280 caractères).' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_post',
      description: 'Programme un tweet pour publication automatique à une date/heure précise. Cron tous les 5 min.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Le contenu du tweet à programmer (max 280 caractères).' },
          scheduled_at: { type: 'string', description: 'ISO 8601 timezone Europe/Paris, ex: "2026-05-15T09:00:00+02:00". Doit être futur.' },
        },
        required: ['text', 'scheduled_at'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_scheduled',
      description: 'Liste les tweets actuellement programmés (status=scheduled), triés par date ascendante.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_scheduled',
      description: 'Annule un tweet programmé via son ID (passe status=scheduled → draft).',
      parameters: {
        type: 'object',
        properties: {
          post_id: { type: 'string', description: 'L\'UUID du tweet à annuler (obtenu via list_scheduled).' },
        },
        required: ['post_id'],
      },
    },
  },
];

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
        if (text.length > 280) return JSON.stringify({ error: `Tweet trop long (${text.length}/280 caractères). Reformule plus court.` });
        const { data, error } = await sb.from('x_posts').insert({
          text_content: text,
          status: 'draft',
          created_by: userId,
        }).select('id, created_at').single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          ok: true,
          post_id: data.id,
          status: 'draft',
          chars: text.length,
          message: `Brouillon créé (${text.length}/280). ID: ${data.id}.`,
        });
      }
      case 'publish_now': {
        const text = String(input?.text || '').trim();
        if (!text) return JSON.stringify({ error: 'text manquant' });
        if (text.length > 280) return JSON.stringify({ error: `Tweet trop long (${text.length}/280)` });

        const { data: account } = await sb
          .from('x_account')
          .select('access_token, refresh_token, x_user_id, username, expires_at')
          .eq('id', 1)
          .maybeSingle();
        if (!account) return JSON.stringify({ error: 'Aucun compte X connecté.' });

        // Refresh si token expiré
        let accessToken = account.access_token;
        if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
          if (!account.refresh_token) return JSON.stringify({ error: 'Token X expiré, reconnexion requise.' });
          try {
            const refreshed = await refreshAccessToken(account.refresh_token);
            accessToken = refreshed.access_token;
            await sb.from('x_account').update({
              access_token: refreshed.access_token,
              refresh_token: refreshed.refresh_token || account.refresh_token,
              expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            }).eq('id', 1);
          } catch (e: any) {
            return JSON.stringify({ error: `Refresh token X échoué : ${e?.message?.slice(0, 200)}` });
          }
        }

        const { data: draft } = await sb.from('x_posts').insert({
          text_content: text,
          status: 'draft',
          created_by: userId,
        }).select('id').single();

        try {
          const { tweetId } = await publishTweet({ accessToken, text });
          if (draft?.id) {
            await sb.from('x_posts').update({
              status: 'published',
              x_post_id: tweetId,
              published_at: new Date().toISOString(),
            }).eq('id', draft.id);
          }
          return JSON.stringify({
            ok: true,
            post_id: draft?.id,
            tweet_id: tweetId,
            url: `https://x.com/${account.username}/status/${tweetId}`,
            message: `Tweet publié ! https://x.com/${account.username}/status/${tweetId}`,
          });
        } catch (e: any) {
          if (draft?.id) {
            await sb.from('x_posts').update({
              status: 'failed',
              error_message: (e?.message || 'unknown').slice(0, 500),
            }).eq('id', draft.id);
          }
          return JSON.stringify({ error: `Échec publication X : ${e?.message || 'unknown'}` });
        }
      }
      case 'schedule_post': {
        const text = String(input?.text || '').trim();
        const when = String(input?.scheduled_at || '').trim();
        if (!text) return JSON.stringify({ error: 'text manquant' });
        if (text.length > 280) return JSON.stringify({ error: `Tweet trop long (${text.length}/280)` });
        const dt = new Date(when);
        if (isNaN(dt.getTime())) return JSON.stringify({ error: `scheduled_at invalide : "${when}". Format ISO 8601 attendu.` });
        if (dt.getTime() < Date.now()) return JSON.stringify({ error: `scheduled_at est dans le passé (${dt.toISOString()})` });
        const { data, error } = await sb.from('x_posts').insert({
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
          message: `Tweet programmé pour ${fr} (heure de Paris).`,
        });
      }
      case 'list_scheduled': {
        const { data, error } = await sb
          .from('x_posts')
          .select('id, text_content, scheduled_at, status, created_at')
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          ok: true,
          count: data?.length || 0,
          posts: (data || []).map((p) => ({
            id: p.id,
            preview: p.text_content,
            scheduled_at: p.scheduled_at,
            scheduled_at_fr: new Date(p.scheduled_at).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
          })),
        });
      }
      case 'cancel_scheduled': {
        const id = String(input?.post_id || '').trim();
        if (!id) return JSON.stringify({ error: 'post_id manquant' });
        const { data: existing } = await sb.from('x_posts').select('status, text_content').eq('id', id).maybeSingle();
        if (!existing) return JSON.stringify({ error: `Tweet ${id} introuvable` });
        if (existing.status !== 'scheduled') return JSON.stringify({ error: `Tweet ${id} n'est pas programmé (status=${existing.status})` });
        const { error } = await sb.from('x_posts').update({
          status: 'draft',
          scheduled_at: null,
        }).eq('id', id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          ok: true,
          message: `Tweet ${id} annulé (repassé en brouillon). Preview: "${existing.text_content.slice(0, 80)}"`,
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
// Public types
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

type ChatCompletionMessageParam = Groq.Chat.Completions.ChatCompletionMessageParam;

export async function* streamAssistant(
  messages: ChatMessage[],
  userId: string,
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    yield { type: 'error', error: 'GROQ_API_KEY non configuré côté serveur.' };
    return;
  }

  const groq = new Groq({ apiKey });

  const conversation: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  let iter = 0;
  const MAX_ITER = 8;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (iter < MAX_ITER) {
    iter++;
    let collectedText = '';
    const toolCalls: Array<{ id: string; name: string; argsJson: string }> = [];

    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages: conversation,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.6,
        max_tokens: 4096,
        stream: true,
        ...({ reasoning_effort: 'low' } as Record<string, unknown>),
      });

      for await (const chunk of stream) {
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta;

        if (delta?.content) {
          collectedText += delta.content;
          yield { type: 'text', text: delta.content };
        }

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

    if (toolCalls.length === 0) {
      yield {
        type: 'done',
        usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
      };
      return;
    }

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

      conversation.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: resultJson,
      });
    }
  }

  yield { type: 'error', error: `Limite de ${MAX_ITER} tours atteinte.` };
}
