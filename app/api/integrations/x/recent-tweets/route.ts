import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { getRecentTweets, refreshAccessToken } from '@/lib/social/x';

export const runtime = 'nodejs';

/**
 * GET /api/integrations/x/recent-tweets
 * Fetche les derniers tweets du compte connecté via l'API X.
 * Free tier : 1 req / 15min / user, 500 reads / mois.
 */
export async function GET(req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Service role manquant' }, { status: 500 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: account } = await admin
    .from('x_account')
    .select('access_token, refresh_token, x_user_id, username, expires_at')
    .eq('id', 1)
    .single();
  if (!account) return NextResponse.json({ error: 'Aucun compte X connecté' }, { status: 400 });

  // Refresh si expiré
  let accessToken = account.access_token;
  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now() && account.refresh_token) {
    try {
      const refreshed = await refreshAccessToken(account.refresh_token);
      accessToken = refreshed.access_token;
      await admin.from('x_account').update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || account.refresh_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq('id', 1);
    } catch (e: any) {
      return NextResponse.json({ error: `Refresh token échoué : ${e?.message}` }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const countParam = url.searchParams.get('count');
  const count = countParam ? Math.min(100, Math.max(1, parseInt(countParam, 10) || 20)) : 20;

  try {
    const tweets = await getRecentTweets({
      accessToken,
      userId: account.x_user_id!,
      username: account.username!,
      count,
    });
    return NextResponse.json({ ok: true, tweets });
  } catch (e: any) {
    const msg = e?.message || 'Erreur API X';
    if (/429|rate/i.test(msg)) {
      return NextResponse.json({
        error: 'rate_limit',
        message: 'Limite X atteinte (free tier : 1 req/15min). Réessaie dans 15 min.',
        detail: msg,
      }, { status: 429 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
