import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Endpoint appelé par Supabase après un OAuth réussi (Google, etc.).
 * Échange le code contre une session, puis redirige vers le dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      // Récupérer le profil pour rediriger admin vs client
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    console.error('OAuth callback error:', error);
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
