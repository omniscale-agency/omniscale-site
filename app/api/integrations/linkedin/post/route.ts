import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { publishTextPost } from '@/lib/social/linkedin';

/**
 * POST /api/integrations/linkedin/post
 * Body : { text: string, visibility?: 'PUBLIC' | 'CONNECTIONS' }
 * Publie un post text-only sur le compte LinkedIn connecté.
 */
export async function POST(req: NextRequest) {
  // Vérif admin
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: callerProfile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  // Body
  let text: string | undefined;
  let visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC';
  try {
    const body = await req.json();
    text = body?.text?.toString().trim();
    if (body?.visibility === 'CONNECTIONS') visibility = 'CONNECTIONS';
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: 'text manquant' }, { status: 400 });
  if (text.length > 3000) return NextResponse.json({ error: 'Post trop long (max 3000 caractères)' }, { status: 400 });

  // Service-role pour lire le token + écrire l'historique (bypass RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Service role key manquant côté serveur' }, { status: 500 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: account, error: accErr } = await admin
    .from('linkedin_account')
    .select('access_token, linkedin_id, expires_at')
    .eq('id', 1)
    .single();
  if (accErr || !account) {
    return NextResponse.json({ error: 'Aucun compte LinkedIn connecté. Connecte LinkedIn d\'abord.' }, { status: 400 });
  }
  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
    return NextResponse.json({
      error: 'Le token LinkedIn a expiré. Reconnecte-toi à LinkedIn.',
    }, { status: 401 });
  }

  // Insert d'un draft pour traçabilité avant l'appel API
  const { data: draft } = await admin.from('linkedin_posts').insert({
    text_content: text,
    status: 'draft',
    created_by: user.id,
  }).select('id').single();

  // Publication
  try {
    const { postId } = await publishTextPost({
      accessToken: account.access_token,
      userSub: account.linkedin_id!,
      text,
      visibility,
    });
    if (draft?.id) {
      await admin.from('linkedin_posts').update({
        status: 'published',
        linkedin_post_id: postId,
        published_at: new Date().toISOString(),
      }).eq('id', draft.id);
    }
    return NextResponse.json({ ok: true, postId });
  } catch (e: any) {
    if (draft?.id) {
      await admin.from('linkedin_posts').update({
        status: 'failed',
        error_message: (e?.message || 'unknown').slice(0, 500),
      }).eq('id', draft.id);
    }
    return NextResponse.json({ error: e?.message || 'Erreur publication' }, { status: 500 });
  }
}
