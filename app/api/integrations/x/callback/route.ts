import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { exchangeCodeForToken, getMe } from '@/lib/social/x';

/**
 * GET /api/integrations/x/callback?code=...&state=...
 * X redirige ici après login. Vérifie state + code_verifier (cookies),
 * échange le code, stocke le token, redirige vers /admin/integrations/x.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const xError = searchParams.get('error');

  const redirect = (params: Record<string, string>) => {
    const u = new URL('/admin/integrations/x', req.url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    return NextResponse.redirect(u);
  };

  if (xError) {
    return redirect({ error: xError, error_description: searchParams.get('error_description') || '' });
  }
  if (!code || !state) {
    return redirect({ error: 'missing_code_or_state' });
  }

  const cookieState = req.cookies.get('x_oauth_state')?.value;
  const cookieVerifier = req.cookies.get('x_oauth_verifier')?.value;
  if (!cookieState || cookieState !== state) {
    return redirect({ error: 'invalid_state' });
  }
  if (!cookieVerifier) {
    return redirect({ error: 'missing_pkce_verifier' });
  }

  // Caller doit être admin
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return redirect({ error: 'not_authenticated' });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect({ error: 'not_admin' });

  // Échange code → token + récupération profil
  let token: Awaited<ReturnType<typeof exchangeCodeForToken>>;
  let me: Awaited<ReturnType<typeof getMe>>;
  try {
    token = await exchangeCodeForToken({ code, codeVerifier: cookieVerifier });
    me = await getMe(token.access_token);
  } catch (e: any) {
    return redirect({ error: 'token_exchange_failed', error_description: (e?.message || '').slice(0, 200) });
  }

  // Upsert via service-role (singleton id=1)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return redirect({ error: 'missing_service_role_key' });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const { error: upsertErr } = await admin.from('x_account').upsert({
    id: 1,
    x_user_id: me.id,
    username: me.username,
    name: me.name,
    picture_url: me.profile_image_url || null,
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    expires_at: expiresAt,
    scope: token.scope,
    connected_by: user.id,
  });
  if (upsertErr) {
    return redirect({ error: 'db_upsert_failed', error_description: upsertErr.message.slice(0, 200) });
  }

  const res = redirect({ connected: 'true' });
  res.cookies.set('x_oauth_state', '', { maxAge: 0, path: '/' });
  res.cookies.set('x_oauth_verifier', '', { maxAge: 0, path: '/' });
  return res;
}
