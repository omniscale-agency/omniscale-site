'use client';

// Auth mock pour MVP. À remplacer par Supabase / NextAuth en phase 2.
// Les credentials sont hard-codés ici — visibles dans le bundle JS, donc PAS pour la prod réelle.

export type Role = 'admin' | 'client';

export interface Session {
  email: string;
  role: Role;
  name: string;
  clientSlug?: string; // pour les clients
}

const STORAGE_KEY = 'omniscale_session';

// Comptes démo — à remplacer par une vraie DB
const ACCOUNTS: Array<{ email: string; password: string; role: Role; name: string; clientSlug?: string }> = [
  { email: 'admin@omniscale.fr', password: 'admin2026', role: 'admin', name: 'Équipe Omniscale' },
  { email: 'lea@maisonlea.fr', password: 'demo2026', role: 'client', name: 'Léa M.', clientSlug: 'maison-lea' },
  { email: 'marco@trattoriasole.fr', password: 'demo2026', role: 'client', name: 'Marco D.', clientSlug: 'trattoria-sole' },
  { email: 'camille@glowcosmetics.com', password: 'demo2026', role: 'client', name: 'Camille R.', clientSlug: 'glow-cosmetics' },
];

export function login(email: string, password: string, asAdmin: boolean): Session | null {
  const account = ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
  );
  if (!account) return null;
  // Si la case "je suis un admin" est cochée mais le compte n'est pas admin → fail
  if (asAdmin && account.role !== 'admin') return null;
  if (!asAdmin && account.role === 'admin') return null;

  const session: Session = {
    email: account.email,
    role: account.role,
    name: account.name,
    clientSlug: account.clientSlug,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
