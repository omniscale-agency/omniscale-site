'use client';
import { supabaseBrowser } from './supabase/client';
import { CLIENTS, ClientData } from './mockData';

export interface AdminClientRow {
  /** Identifiant URL-safe pour /admin/clients/[slug]. Pour mock = slug hardcodé, pour real = email */
  slug: string;
  brand: string;
  sector: string;
  city: string;
  monthlyRevenue: string;
  status: 'actif' | 'pause' | 'onboarding';
  /** Vrais profils n'ont pas encore de stats — on retourne les stats mockData uniquement pour les démos */
  hasMockStats: boolean;
  /** Données mockData complètes si dispo */
  mockData?: ClientData;
  /** Données du profil DB si dispo */
  profile?: {
    userId: string;
    email: string;
    name: string;
    phone?: string;
    website?: string;
    createdAt: string;
  };
  closer: string;
  /** Stats agrégées (depuis mock pour démos, ou 0 / placeholder pour les réels) */
  views: number;
  roas: number;
}

function emailToSlug(email: string): string {
  return encodeURIComponent(email);
}

export function slugToEmail(slug: string): string {
  return decodeURIComponent(slug);
}

/** Liste unifiée : 3 démos mockData + vrais clients DB (profiles.role = 'client') */
export async function listAllAdminClients(): Promise<AdminClientRow[]> {
  const sb = supabaseBrowser();
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, email, name, brand, sector, city, phone, website, monthly_revenue, client_slug, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  const fromDB: AdminClientRow[] = (profiles || []).map((p) => {
    // Si le profil a un client_slug pointant vers un mockData → on enrichit avec les stats mock
    const mock = p.client_slug ? CLIENTS.find((c) => c.slug === p.client_slug) : undefined;
    const views = mock ? mock.stats.instagramViews + mock.stats.tiktokViews : 0;
    const roas = mock ? mock.stats.adRevenue / Math.max(1, mock.stats.adSpend) : 0;
    return {
      slug: emailToSlug(p.email),
      brand: p.brand || p.name || p.email,
      sector: p.sector || '—',
      city: p.city || '—',
      monthlyRevenue: p.monthly_revenue || '—',
      status: 'actif',
      hasMockStats: !!mock,
      mockData: mock,
      profile: {
        userId: p.id,
        email: p.email,
        name: p.name,
        phone: p.phone || undefined,
        website: p.website || undefined,
        createdAt: p.created_at,
      },
      closer: 'Antoine',
      views,
      roas,
    };
  });

  // Démos mockData (Maison Léa, Trattoria Sole, Glow Cosmetics) — toujours affichées
  const fromMock: AdminClientRow[] = CLIENTS.map((c) => ({
    slug: c.slug,
    brand: c.brand,
    sector: c.sector,
    city: c.city,
    monthlyRevenue: c.monthlyRevenue,
    status: c.status,
    hasMockStats: true,
    mockData: c,
    closer: c.closer,
    views: c.stats.instagramViews + c.stats.tiktokViews,
    roas: c.stats.adRevenue / Math.max(1, c.stats.adSpend),
  }));

  // Dédoublonnage : si un profil DB pointe vers le même mockData (via client_slug),
  // ne pas afficher 2 fois la même marque. On garde la version "fromDB" qui a les vraies infos profil.
  const dbBoundSlugs = new Set(
    (profiles || []).filter((p) => p.client_slug).map((p) => p.client_slug),
  );
  const fromMockDeduped = fromMock.filter((m) => !dbBoundSlugs.has(m.slug));

  return [...fromDB, ...fromMockDeduped];
}

/** Trouve un client par son slug (URL) — peut être un slug mockData ou un email URL-encoded */
export async function findAdminClient(slug: string): Promise<AdminClientRow | null> {
  // 1. Mock match direct
  const mock = CLIENTS.find((c) => c.slug === slug);
  if (mock) {
    return {
      slug: mock.slug,
      brand: mock.brand,
      sector: mock.sector,
      city: mock.city,
      monthlyRevenue: mock.monthlyRevenue,
      status: mock.status,
      hasMockStats: true,
      mockData: mock,
      closer: mock.closer,
      views: mock.stats.instagramViews + mock.stats.tiktokViews,
      roas: mock.stats.adRevenue / Math.max(1, mock.stats.adSpend),
    };
  }

  // 2. Sinon, c'est un email → fetch profile
  const email = slugToEmail(slug);
  const sb = supabaseBrowser();
  const { data: p } = await sb
    .from('profiles')
    .select('id, email, name, brand, sector, city, phone, website, monthly_revenue, client_slug, created_at')
    .eq('email', email)
    .single();
  if (!p) return null;

  const mockBound = p.client_slug ? CLIENTS.find((c) => c.slug === p.client_slug) : undefined;
  const views = mockBound ? mockBound.stats.instagramViews + mockBound.stats.tiktokViews : 0;
  const roas = mockBound ? mockBound.stats.adRevenue / Math.max(1, mockBound.stats.adSpend) : 0;
  return {
    slug,
    brand: p.brand || p.name || p.email,
    sector: p.sector || '—',
    city: p.city || '—',
    monthlyRevenue: p.monthly_revenue || '—',
    status: 'actif',
    hasMockStats: !!mockBound,
    mockData: mockBound,
    profile: {
      userId: p.id,
      email: p.email,
      name: p.name,
      phone: p.phone || undefined,
      website: p.website || undefined,
      createdAt: p.created_at,
    },
    closer: 'Antoine',
    views,
    roas,
  };
}
