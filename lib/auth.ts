'use client';
import { supabaseBrowser } from './supabase/client';

export type Role = 'admin' | 'client' | 'lead';

export interface Session {
  email: string;
  role: Role;
  name: string;
  brand?: string;
  sector?: string;
  city?: string;
  phone?: string;
  monthlyRevenue?: string;
  website?: string;
  clientSlug?: string;
  userId: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  brand?: string;
  sector?: string;
  city?: string;
  phone?: string;
  monthlyRevenue?: string;
  website?: string;
  role: Role;
  clientSlug?: string;
  createdAt: string;
}

export interface Profile extends User {}

// ============================================================
// Sessions cache (évite refetch à chaque appel synchrone)
// ============================================================
let _cachedSession: Session | null = null;
let _sessionLoadedAt = 0;
const CACHE_MS = 30_000;

function profileToSession(userId: string, p: any): Session {
  return {
    userId,
    email: p.email,
    name: p.name,
    brand: p.brand || undefined,
    sector: p.sector || undefined,
    city: p.city || undefined,
    phone: p.phone || undefined,
    monthlyRevenue: p.monthly_revenue || undefined,
    website: p.website || undefined,
    role: p.role as Role,
    clientSlug: p.client_slug || undefined,
    createdAt: p.created_at,
  };
}

async function loadSession(): Promise<Session | null> {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;
  return profileToSession(user.id, profile);
}

/** Récupère la session courante (async — préféré). */
export async function getSessionAsync(): Promise<Session | null> {
  if (_cachedSession && Date.now() - _sessionLoadedAt < CACHE_MS) return _cachedSession;
  const s = await loadSession();
  _cachedSession = s;
  _sessionLoadedAt = Date.now();
  return s;
}

/** Sync getter — retourne le cache, ou null si pas encore chargé. À utiliser après getSessionAsync. */
export function getSession(): Session | null {
  return _cachedSession;
}

export function clearSessionCache() {
  _cachedSession = null;
  _sessionLoadedAt = 0;
}

// ============================================================
// AUTH ACTIONS
// ============================================================

export async function login(
  email: string,
  password: string,
  asAdmin: boolean,
): Promise<Session | null> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  // Charger profil pour vérifier le rôle
  const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile) { await sb.auth.signOut(); return null; }

  // Cohérence du toggle admin
  if (asAdmin && profile.role !== 'admin') { await sb.auth.signOut(); return null; }
  if (!asAdmin && profile.role === 'admin') { await sb.auth.signOut(); return null; }

  const session = profileToSession(data.user.id, profile);
  _cachedSession = session;
  _sessionLoadedAt = Date.now();
  return session;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  brand?: string;
  sector?: string;
  city?: string;
  phone?: string;
  monthlyRevenue?: string;
  website?: string;
}

export async function register(input: RegisterInput): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        brand: input.brand,
        sector: input.sector,
        city: input.city,
        phone: input.phone,
        monthly_revenue: input.monthlyRevenue,
        website: input.website,
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: 'Erreur de création du compte.' };

  // Le trigger handle_new_user crée le profil auto. On le fetch (avec retry).
  const userId = data.user.id;
  let profile: any = null;
  for (let i = 0; i < 5 && !profile; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const res = await sb.from('profiles').select('*').eq('id', userId).single();
    profile = res.data;
  }
  if (!profile) return { ok: false, error: 'Profil non créé. Réessaie dans un instant.' };

  if (typeof window !== 'undefined') localStorage.setItem('omniscale_show_tour', '1');

  const session = profileToSession(data.user.id, profile);
  _cachedSession = session;
  _sessionLoadedAt = Date.now();
  return { ok: true, session };
}

export async function logout() {
  const sb = supabaseBrowser();
  await sb.auth.signOut();
  clearSessionCache();
}

/** Sign in with Google (OAuth via Supabase). Redirige vers Google puis revient sur /auth/callback. */
export async function signInWithGoogle() {
  const sb = supabaseBrowser();
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://omniscale.fr/auth/callback';
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
}

// ============================================================
// USERS MANAGEMENT (admin only — RLS gate)
// ============================================================

export async function listUsers(): Promise<User[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    brand: p.brand || undefined,
    sector: p.sector || undefined,
    city: p.city || undefined,
    phone: p.phone || undefined,
    monthlyRevenue: p.monthly_revenue || undefined,
    website: p.website || undefined,
    role: p.role as Role,
    clientSlug: p.client_slug || undefined,
    createdAt: p.created_at,
  }));
}

export async function updateUser(
  email: string,
  patch: Partial<{ role: Role; clientSlug?: string; name: string; brand: string; sector: string; city: string; phone: string; monthlyRevenue: string; website: string }>,
) {
  const sb = supabaseBrowser();
  const dbPatch: Record<string, unknown> = {};
  if ('monthlyRevenue' in patch) dbPatch.monthly_revenue = patch.monthlyRevenue || null;
  if ('sector' in patch) dbPatch.sector = patch.sector || null;
  if ('city' in patch) dbPatch.city = patch.city || null;
  if ('phone' in patch) dbPatch.phone = patch.phone || null;
  if ('website' in patch) dbPatch.website = patch.website || null;
  if (patch.role) dbPatch.role = patch.role;
  if ('clientSlug' in patch) dbPatch.client_slug = patch.clientSlug || null;
  if (patch.name) dbPatch.name = patch.name;
  if (patch.brand) dbPatch.brand = patch.brand;
  await sb.from('profiles').update(dbPatch).eq('email', email);
  // Si l'utilisateur courant est modifié, refresh cache
  const cur = getSession();
  if (cur && cur.email === email) await getSessionAsync();
}

export async function deleteUser(email: string) {
  const sb = supabaseBrowser();
  // Supprime juste le profil (l'auth user est conservé en BDD Supabase Auth — pour le purger faut la service_role key)
  await sb.from('profiles').delete().eq('email', email);
}

export function subscribeUsers(cb: () => void): () => void {
  const sb = supabaseBrowser();
  const uniq = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const channel = sb
    .channel(`profiles-changes-${uniq}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => cb())
    .subscribe();
  return () => { sb.removeChannel(channel); };
}

// Helper pour les pages
export function requireRole(session: Session | null, allowed: Role[]): boolean {
  if (!session) return false;
  return allowed.includes(session.role);
}
