import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { buildAuthUrl, generateCodeVerifier, deriveCodeChallenge } from '@/lib/social/x';

/**
 * GET /api/integrations/x/auth
 * Démarre le flow OAuth 2.0 PKCE — génère state + code_verifier (cookies
 * httpOnly), renvoie l'URL d'autorisation X. PKCE est obligatoire chez X.
 */
export async function GET(_req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  try {
    const state = crypto.randomUUID();
    const verifier = generateCodeVerifier();
    const challenge = deriveCodeChallenge(verifier);
    const url = buildAuthUrl({ state, codeChallenge: challenge });
    const res = NextResponse.json({ url });

    // Cookies httpOnly courte durée pour vérifier le callback
    const baseCookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 600, // 10 min
      path: '/',
    };
    res.cookies.set('x_oauth_state', state, baseCookieOpts);
    res.cookies.set('x_oauth_verifier', verifier, baseCookieOpts);
    return res;
  } catch (e: any) {
    return NextResponse.json({
      error: e?.message || 'Erreur de configuration',
      hint: "Vérifie que X_CLIENT_ID, X_CLIENT_SECRET et X_REDIRECT_URI sont bien définis dans Vercel.",
    }, { status: 500 });
  }
}
