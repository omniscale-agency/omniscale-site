import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { streamAssistant, ChatMessage } from '@/lib/ai/xAssistant';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/integrations/x/ai-chat
 * Body: { messages: ChatMessage[] }
 * Stream SSE de la réponse assistant.
 */
export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admin requis' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = body?.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages vide ou invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamAssistant(messages, user.id)) {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }
      } catch (e: any) {
        const err = `data: ${JSON.stringify({ type: 'error', error: e?.message || 'Erreur stream' })}\n\n`;
        controller.enqueue(encoder.encode(err));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
