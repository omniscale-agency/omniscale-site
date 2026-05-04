import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * POST /api/integrations/linkedin/disconnect
 * Supprime le token + infos du compte LinkedIn connecté.
 * (Ne révoque pas le token côté LinkedIn — l'admin peut révoquer
 *  manuellement dans son LinkedIn → Settings → Permitted services.)
 */
export async function POST(_req: NextRequest) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Service role key manquant' }, { status: 500 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  await admin.from('linkedin_account').delete().eq('id', 1);
  return NextResponse.json({ ok: true });
}
