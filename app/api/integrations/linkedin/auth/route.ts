import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { buildAuthUrl } from '@/lib/social/linkedin';

/**
 * GET /api/integrations/linkedin/auth
 * Démarre le flow OAuth — vérifie que le caller est admin, génère un state
 * CSRF (cookie httpOnly) et renvoie l'URL d'autorisation LinkedIn.
 */
export async function GET(_req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  let url: string;
  try {
    const state = crypto.randomUUID();
    url = buildAuthUrl(state);
    const res = NextResponse.json({ url });
    // State stocké en cookie httpOnly pour vérif au callback
    res.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 min
      path: '/',
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({
      error: e?.message || 'Erreur de configuration',
      hint: "Vérifie que LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET et LINKEDIN_REDIRECT_URI sont bien définis dans Vercel.",
    }, { status: 500 });
  }
}
