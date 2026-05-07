import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/integrations/linkedin/ai-conversations/:id
 *   → fetch une conversation complète (avec messages).
 *
 * PATCH /api/integrations/linkedin/ai-conversations/:id
 *   body { title?: string, messages?: [...] }
 *   → update partial. updated_at est mis à jour automatiquement par trigger.
 *
 * DELETE /api/integrations/linkedin/ai-conversations/:id
 *   → supprime la conversation.
 */

async function checkAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { sb, user, error: NextResponse.json({ error: 'Admin requis' }, { status: 403 }) };
  return { sb, user, error: null };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { sb, user, error } = await checkAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const { data, error: fetchErr } = await sb
    .from('linkedin_ai_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  return NextResponse.json({ conversation: data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { sb, user, error } = await checkAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const update: Record<string, any> = {};
  if (typeof body.title === 'string') update.title = body.title.slice(0, 100);
  if (Array.isArray(body.messages)) update.messages = body.messages;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 });
  }

  const { data, error: upErr } = await sb
    .from('linkedin_ai_conversations')
    .update(update)
    .eq('id', id)
    .eq('user_id', user!.id)
    .select('id, title, updated_at')
    .single();

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { sb, user, error } = await checkAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const { error: delErr } = await sb
    .from('linkedin_ai_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
