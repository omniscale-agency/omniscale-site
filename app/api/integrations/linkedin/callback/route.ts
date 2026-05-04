import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/social/linkedin';

/**
 * GET /api/integrations/linkedin/callback?code=...&state=...
 * LinkedIn redirige ici après login. On valide le state, échange le code,
 * stocke le token (en passant par la service_role pour bypasser RLS lors
 * du upsert), puis redirige vers la page admin.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const linkedinError = searchParams.get('error');

  const redirect = (params: Record<string, string>) => {
    const u = new URL('/admin/integrations/linkedin', req.url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    return NextResponse.redirect(u);
  };

  if (linkedinError) {
    return redirect({ error: linkedinError, error_description: searchParams.get('error_description') || '' });
  }
  if (!code || !state) {
    return redirect({ error: 'missing_code_or_state' });
  }

  // Vérif state (CSRF)
  const cookieState = req.cookies.get('linkedin_oauth_state')?.value;
  if (!cookieState || cookieState !== state) {
    return redirect({ error: 'invalid_state' });
  }

  // Vérif que le caller est admin
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return redirect({ error: 'not_authenticated' });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return redirect({ error: 'not_admin' });

  // Échange code → token + récupération profil
  let token: Awaited<ReturnType<typeof exchangeCodeForToken>>;
  let info: Awaited<ReturnType<typeof getUserInfo>>;
  try {
    token = await exchangeCodeForToken(code);
    info = await getUserInfo(token.access_token);
  } catch (e: any) {
    return redirect({ error: 'token_exchange_failed', error_description: e?.message?.slice(0, 200) || '' });
  }

  // Upsert via service-role (singleton id=1)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return redirect({ error: 'missing_service_role_key' });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const { error: upsertErr } = await admin.from('linkedin_account').upsert({
    id: 1,
    linkedin_id: info.sub,
    name: info.name,
    email: info.email || null,
    picture_url: info.picture || null,
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    expires_at: expiresAt,
    scope: token.scope,
    connected_by: user.id,
  });
  if (upsertErr) {
    return redirect({ error: 'db_upsert_failed', error_description: upsertErr.message.slice(0, 200) });
  }

  // Clear state cookie + redirect succès
  const res = redirect({ connected: 'true' });
  res.cookies.set('linkedin_oauth_state', '', { maxAge: 0, path: '/' });
  return res;
}
