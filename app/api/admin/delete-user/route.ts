import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Supprime DÉFINITIVEMENT un utilisateur, à la fois :
 *  - sa ligne `auth.users` (Supabase Auth) → libère l'email pour une
 *    nouvelle inscription
 *  - sa ligne `public.profiles` (cascade automatique via on delete cascade)
 *  - tous ses todos / events / objectives / connections (cascades aussi)
 *
 * Avant ce route, l'admin supprimait juste le profil via la clé anon →
 * l'auth.users restait, l'email était bloqué ("déjà inscrit") et le user
 * tombait en limbo (login OK mais pas de profil).
 *
 * Sécurité :
 *  - Vérifie que le caller est bien un admin via cookie-session côté serveur
 *  - Utilise SUPABASE_SERVICE_ROLE_KEY (jamais exposée au browser)
 *
 * Body : { email: string }
 */
export async function POST(req: NextRequest) {
  // 1. Vérifier que le caller est admin
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { data: callerProfile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 });
  }

  // 2. Lire l'email cible
  let email: string | undefined;
  try {
    const body = await req.json();
    email = body?.email?.toString().trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: 'Email manquant' }, { status: 400 });
  }

  // 3. Anti-self-delete
  if (user.email?.toLowerCase() === email) {
    return NextResponse.json({ error: 'Tu ne peux pas te supprimer toi-même' }, { status: 400 });
  }

  // 4. Service-role client (bypass RLS, accès admin auth)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur (Vercel env var). ' +
             'Le profil a été supprimé mais l\'email reste bloqué.',
    }, { status: 500 });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 5. Trouver l'auth.users par email (paginé : on parcourt jusqu'à le trouver)
  let targetUserId: string | null = null;
  let page = 1;
  const perPage = 1000;
  while (page <= 10) {
    const res = await admin.auth.admin.listUsers({ page, perPage });
    if (res.error) {
      return NextResponse.json({ error: `Erreur listUsers : ${res.error.message}` }, { status: 500 });
    }
    const users = (res.data?.users || []) as Array<{ id: string; email?: string | null }>;
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      targetUserId = found.id;
      break;
    }
    if (users.length < perPage) break; // dernière page
    page++;
  }

  // 6. Supprimer (cascade vers profiles + tout le reste via on delete cascade)
  if (!targetUserId) {
    // Auth user déjà absent — au cas où, on tente quand même de purger un éventuel profil orphelin
    await admin.from('profiles').delete().eq('email', email);
    return NextResponse.json({
      ok: true,
      message: 'Aucun compte auth correspondant trouvé. Profil orphelin éventuel purgé.',
    });
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId);
  if (delErr) {
    return NextResponse.json({ error: `Erreur deleteUser : ${delErr.message}` }, { status: 500 });
  }

  // Sécurité : si la cascade DB n'est pas en place, on supprime aussi le profil à la main
  await admin.from('profiles').delete().eq('id', targetUserId);

  return NextResponse.json({ ok: true, deletedUserId: targetUserId, email });
}
