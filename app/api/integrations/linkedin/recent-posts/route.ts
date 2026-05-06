import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { getRecentPosts } from '@/lib/social/linkedin';

export const runtime = 'nodejs';

/**
 * GET /api/integrations/linkedin/recent-posts
 * Fetche en live les derniers posts publiés sur LinkedIn par le compte connecté.
 * Nécessite le scope `r_member_social` (ajouté en mai 2026 — reconnexion requise).
 */
export async function GET(req: NextRequest) {
  // Vérif admin
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  // Lecture du compte LinkedIn (service-role pour bypass RLS sur le token)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Service role key manquant' }, { status: 500 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: account } = await admin
    .from('linkedin_account')
    .select('access_token, linkedin_id, expires_at, scope')
    .eq('id', 1)
    .single();

  if (!account) {
    return NextResponse.json({ error: 'Aucun compte LinkedIn connecté' }, { status: 400 });
  }
  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Token LinkedIn expiré — reconnexion nécessaire' }, { status: 401 });
  }
  // Heuristique : si le scope stocké ne contient pas r_member_social → reconnexion nécessaire
  if (account.scope && !account.scope.includes('r_member_social')) {
    return NextResponse.json({
      error: 'scope_missing',
      message: 'Le scope r_member_social manque. Reconnecte ton compte LinkedIn pour autoriser la lecture de tes posts.',
    }, { status: 403 });
  }

  // Param ?count=20
  const url = new URL(req.url);
  const countParam = url.searchParams.get('count');
  const count = countParam ? Math.min(50, Math.max(1, parseInt(countParam, 10) || 20)) : 20;

  try {
    const posts = await getRecentPosts({
      accessToken: account.access_token,
      userSub: account.linkedin_id!,
      count,
    });
    return NextResponse.json({ ok: true, posts });
  } catch (e: any) {
    const msg: string = e?.message || 'Erreur LinkedIn';
    // Détecte 403 / scope manquant
    if (/403|scope|permission|insufficient/i.test(msg)) {
      return NextResponse.json({
        error: 'scope_missing',
        message: 'Permission insuffisante côté LinkedIn. Reconnecte ton compte pour autoriser la lecture des posts (scope r_member_social).',
        detail: msg,
      }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
