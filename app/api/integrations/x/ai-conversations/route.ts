import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function checkAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { sb, user, error: NextResponse.json({ error: 'Admin requis' }, { status: 403 }) };
  return { sb, user, error: null };
}

export async function GET() {
  const { sb, user, error } = await checkAdmin();
  if (error) return error;
  const { data, error: fetchErr } = await sb
    .from('x_ai_conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  return NextResponse.json({ conversations: data || [] });
}

export async function POST(req: NextRequest) {
  const { sb, user, error } = await checkAdmin();
  if (error) return error;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const firstUser = messages.find((m: any) => m.role === 'user');
  const autoTitle = firstUser?.content
    ? String(firstUser.content).slice(0, 60).replace(/\n/g, ' ')
    : 'Nouvelle conversation';
  const title = (typeof body?.title === 'string' && body.title.trim())
    ? body.title.trim().slice(0, 100)
    : autoTitle;
  const { data, error: insErr } = await sb
    .from('x_ai_conversations')
    .insert({ user_id: user!.id, title, messages })
    .select('id, title, created_at, updated_at')
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
