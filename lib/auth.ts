'use client';

// Auth mock pour MVP. À remplacer par Supabase / NextAuth en phase 2.
// Les credentials sont en localStorage — visibles, donc PAS pour la prod réelle.

export type Role = 'admin' | 'client' | 'lead';

export interface User {
  email: string;
  password: string;     // mock — never store plaintext in prod
  name: string;
  role: Role;
  brand?: string;       // pour les leads/clients
  clientSlug?: string;  // pour les clients (lié à un dossier de mockData)
  createdAt: string;
}

export interface Session {
  email: string;
  role: Role;
  name: string;
  brand?: string;
  clientSlug?: string;
}

const SESSION_KEY = 'omniscale_session';
const USERS_KEY = 'omniscale_users_v2';

const SEED_USERS: User[] = [
  { email: 'admin@omniscale.fr', password: 'admin2026', role: 'admin', name: 'Équipe Omniscale', createdAt: '2025-01-01T00:00:00.000Z' },
  { email: 'lea@maisonlea.fr', password: 'demo2026', role: 'client', name: 'Léa Martin', clientSlug: 'maison-lea', brand: 'Maison Léa', createdAt: '2025-10-15T00:00:00.000Z' },
  { email: 'marco@trattoriasole.fr', password: 'demo2026', role: 'client', name: 'Marco De Luca', clientSlug: 'trattoria-sole', brand: 'Trattoria Sole', createdAt: '2025-12-01T00:00:00.000Z' },
  { email: 'camille@glowcosmetics.com', password: 'demo2026', role: 'client', name: 'Camille Roux', clientSlug: 'glow-cosmetics', brand: 'Glow Cosmetics', createdAt: '2026-01-20T00:00:00.000Z' },
  { email: 'lead@example.com', password: 'lead2026', role: 'lead', name: 'Visiteur Démo', brand: 'Mon projet', createdAt: '2026-04-10T00:00:00.000Z' },
];

function readUsers(): User[] {
  if (typeof window === 'undefined') return SEED_USERS;
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try { return JSON.parse(raw) as User[]; } catch { return SEED_USERS; }
}

function writeUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent('omniscale-users-change'));
}

export function listUsers(): User[] {
  return readUsers();
}

export function login(email: string, password: string, asAdmin: boolean): Session | null {
  const users = readUsers();
  const u = users.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
  if (!u) return null;
  if (asAdmin && u.role !== 'admin') return null;
  if (!asAdmin && u.role === 'admin') return null;

  const session: Session = {
    email: u.email,
    role: u.role,
    name: u.name,
    brand: u.brand,
    clientSlug: u.clientSlug,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function register(input: { email: string; password: string; name: string; brand?: string }): { ok: true; session: Session } | { ok: false; error: string } {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    return { ok: false, error: 'Un compte existe déjà avec cet email.' };
  }
  const newUser: User = {
    email: input.email.trim(),
    password: input.password,
    name: input.name.trim(),
    brand: input.brand?.trim() || undefined,
    role: 'lead',  // tous les nouveaux comptes sont des leads jusqu'à ce qu'un admin les promeuve
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, newUser]);
  const session: Session = {
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
    brand: newUser.brand,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // marquer le nouveau user pour le tour d'onboarding
    localStorage.setItem('omniscale_show_tour', '1');
  }
  return { ok: true, session };
}

/** Update role / clientSlug (admin only). */
export function updateUser(email: string, patch: Partial<Omit<User, 'email' | 'createdAt'>>) {
  const users = readUsers();
  writeUsers(users.map((u) => (u.email === email ? { ...u, ...patch } : u)));
  // si l'utilisateur changé est l'utilisateur courant, refresh session
  const s = getSession();
  if (s && s.email === email) {
    const updated = readUsers().find((u) => u.email === email);
    if (updated) {
      const newSession: Session = {
        email: updated.email,
        role: updated.role,
        name: updated.name,
        brand: updated.brand,
        clientSlug: updated.clientSlug,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    }
  }
}

export function deleteUser(email: string) {
  const users = readUsers();
  writeUsers(users.filter((u) => u.email !== email));
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}

export function subscribeUsers(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const h = () => cb();
  window.addEventListener('omniscale-users-change', h);
  window.addEventListener('storage', h);
  return () => {
    window.removeEventListener('omniscale-users-change', h);
    window.removeEventListener('storage', h);
  };
}

// Helper pour gates sur les pages
export function requireRole(session: Session | null, allowed: Role[]): boolean {
  if (!session) return false;
  return allowed.includes(session.role);
}
