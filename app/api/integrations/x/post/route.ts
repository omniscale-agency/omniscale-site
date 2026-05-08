import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { publishTweet, refreshAccessToken } from '@/lib/social/x';

/**
 * POST /api/integrations/x/post
 * Body : { text: string }
 * Publie un tweet sur le compte X connecté.
 * Free tier : 17 tweets / 24h max.
 */
export async function POST(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: callerProfile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  let text: string | undefined;
  try {
    const body = await req.json();
    text = body?.text?.toString().trim();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: 'text manquant' }, { status: 400 });
  if (text.length > 280) return NextResponse.json({ error: 'Tweet trop long (max 280 caractères)' }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Service role manquant' }, { status: 500 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: account, error: accErr } = await admin
    .from('x_account')
    .select('access_token, refresh_token, x_user_id, expires_at')
    .eq('id', 1)
    .single();
  if (accErr || !account) {
    return NextResponse.json({ error: 'Aucun compte X connecté.' }, { status: 400 });
  }

  // Si token expiré et qu'on a un refresh_token, on tente un refresh
  let accessToken = account.access_token;
  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
    if (!account.refresh_token) {
      return NextResponse.json({ error: 'Token X expiré. Reconnecte-toi.' }, { status: 401 });
    }
    try {
      const refreshed = await refreshAccessToken(account.refresh_token);
      accessToken = refreshed.access_token;
      await admin.from('x_account').update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || account.refresh_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq('id', 1);
    } catch (e: any) {
      return NextResponse.json({ error: `Refresh token X échoué : ${e?.message?.slice(0, 200)}` }, { status: 401 });
    }
  }

  // Insert d'un draft pour traçabilité
  const { data: draft } = await admin.from('x_posts').insert({
    text_content: text,
    status: 'draft',
    created_by: user.id,
  }).select('id').single();

  try {
    const { tweetId } = await publishTweet({ accessToken, text });
    if (draft?.id) {
      await admin.from('x_posts').update({
        status: 'published',
        x_post_id: tweetId,
        published_at: new Date().toISOString(),
      }).eq('id', draft.id);
    }
    return NextResponse.json({ ok: true, tweetId });
  } catch (e: any) {
    if (draft?.id) {
      await admin.from('x_posts').update({
        status: 'failed',
        error_message: (e?.message || 'unknown').slice(0, 500),
      }).eq('id', draft.id);
    }
    return NextResponse.json({ error: e?.message || 'Erreur publication' }, { status: 500 });
  }
}
