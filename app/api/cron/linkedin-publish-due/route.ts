import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishTextPost } from '@/lib/social/linkedin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/linkedin-publish-due
 *
 * Vercel Cron handler — appelé toutes les 5 minutes (cf. vercel.json).
 * Cherche les posts LinkedIn dont status='scheduled' et scheduled_at <= now(),
 * et les publie via l'API LinkedIn.
 *
 * Sécurité : protégé par CRON_SECRET (Vercel injecte automatiquement
 * Authorization: Bearer ${CRON_SECRET} sur les requêtes Cron).
 * Cf. https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
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

  // 1. Récupère le compte LinkedIn connecté
  const { data: account } = await admin
    .from('linkedin_account')
    .select('access_token, linkedin_id, expires_at')
    .eq('id', 1)
    .single();
  if (!account) {
    return NextResponse.json({ error: 'Aucun compte LinkedIn connecté' }, { status: 200 });
  }
  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
    return NextResponse.json({
      warning: 'Token LinkedIn expiré — reconnexion nécessaire',
      published: 0,
    }, { status: 200 });
  }

  // 2. Récupère les posts dus
  const now = new Date().toISOString();
  const { data: due, error: dueErr } = await admin
    .from('linkedin_posts')
    .select('id, text_content')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10);
  if (dueErr) {
    return NextResponse.json({ error: dueErr.message }, { status: 500 });
  }
  if (!due || due.length === 0) {
    return NextResponse.json({ published: 0, message: 'Aucun post dû' });
  }

  // 3. Publie chaque post
  const results: Array<{ id: string; ok: boolean; postId?: string; error?: string }> = [];
  for (const post of due) {
    try {
      const { postId } = await publishTextPost({
        accessToken: account.access_token,
        userSub: account.linkedin_id!,
        text: post.text_content,
        visibility: 'PUBLIC',
      });
      await admin.from('linkedin_posts').update({
        status: 'published',
        linkedin_post_id: postId,
        published_at: new Date().toISOString(),
      }).eq('id', post.id);
      results.push({ id: post.id, ok: true, postId });
    } catch (e: any) {
      await admin.from('linkedin_posts').update({
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
