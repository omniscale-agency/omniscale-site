import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishTweet, refreshAccessToken } from '@/lib/social/x';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/x-publish-due
 * Appelé par pg_cron toutes les 5 min. Cherche les tweets x_posts.status='scheduled'
 * et scheduled_at <= now(), les publie via l'API X. Auto-refresh du token si expiré.
 *
 * Sécurité : Bearer CRON_SECRET (même secret que le cron LinkedIn).
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: account } = await admin
    .from('x_account')
    .select('access_token, refresh_token, x_user_id, expires_at')
    .eq('id', 1)
    .single();
  if (!account) {
    return NextResponse.json({ error: 'Aucun compte X connecté' }, { status: 200 });
  }

  // Refresh token si expiré
  let accessToken = account.access_token;
  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
    if (!account.refresh_token) {
      return NextResponse.json({ warning: 'Token X expiré, pas de refresh — reconnexion nécessaire', published: 0 });
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
      return NextResponse.json({ error: `Refresh token X échoué : ${e?.message?.slice(0, 200)}` }, { status: 500 });
    }
  }

  const now = new Date().toISOString();
  const { data: due, error: dueErr } = await admin
    .from('x_posts')
    .select('id, text_content')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10);
  if (dueErr) return NextResponse.json({ error: dueErr.message }, { status: 500 });
  if (!due || due.length === 0) {
    return NextResponse.json({ published: 0, message: 'Aucun tweet dû' });
  }

  const results: Array<{ id: string; ok: boolean; tweetId?: string; error?: string }> = [];
  for (const post of due) {
    try {
      const { tweetId } = await publishTweet({ accessToken, text: post.text_content });
      await admin.from('x_posts').update({
        status: 'published',
        x_post_id: tweetId,
        published_at: new Date().toISOString(),
      }).eq('id', post.id);
      results.push({ id: post.id, ok: true, tweetId });
    } catch (e: any) {
      await admin.from('x_posts').update({
        status: 'failed',
        error_message: (e?.message || 'unknown').slice(0, 500),
      }).eq('id', post.id);
      results.push({ id: post.id, ok: false, error: e?.message });
    }
  }

  return NextResponse.json({
    published: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
