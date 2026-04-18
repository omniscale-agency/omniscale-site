// Données mock pour le tracking des leads (admin).
// À remplacer par GA4 + iClosed API + CRM en phase 2.

export interface Lead {
  id: string;
  name: string;
  email: string;
  source: 'instagram' | 'tiktok' | 'youtube' | 'google' | 'meta_ads' | 'referral' | 'direct' | 'linkedin';
  status: 'new' | 'qualified' | 'booked' | 'showed_up' | 'closed' | 'lost';
  createdAt: string;
  brand?: string;
  monthlyRevenue?: string;
  bookedAt?: string;
}

const SOURCES = ['instagram', 'tiktok', 'youtube', 'google', 'meta_ads', 'referral', 'direct', 'linkedin'] as const;
const FIRSTNAMES = ['Léa', 'Marc', 'Camille', 'Julien', 'Sophie', 'Antoine', 'Marie', 'Thomas', 'Élise', 'Nicolas', 'Clara', 'Hugo', 'Sarah', 'Maxime', 'Inès', 'Karim', 'Pauline', 'Yanis'];
const LASTNAMES = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Robert', 'Richard', 'Moreau', 'Lefevre', 'Roux', 'Chen', 'Garcia', 'Andrieu'];
const BRANDS = ['Boutique Mila', 'Café Lumière', 'Atelier Brut', 'Les Néréides', 'Studio Verde', 'La Petite Maison', 'Concept N°7', 'Glow Studio', 'Pasta Vera', 'Maison Pivoine'];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = rng(424242);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

// Génère 60 leads sur les 90 derniers jours
export const LEADS: Lead[] = Array.from({ length: 60 }, (_, i) => {
  const fn = pick(FIRSTNAMES);
  const ln = pick(LASTNAMES);
  const daysBack = Math.floor(r() * 90);
  const created = new Date(Date.now() - daysBack * 86400000);
  // Status weighted
  const sRand = r();
  let status: Lead['status'] = 'new';
  if (sRand < 0.55) status = 'new';
  else if (sRand < 0.75) status = 'qualified';
  else if (sRand < 0.85) status = 'booked';
  else if (sRand < 0.92) status = 'showed_up';
  else if (sRand < 0.97) status = 'closed';
  else status = 'lost';

  const lead: Lead = {
    id: `lead-${i + 1}`,
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${pick(['gmail.com', 'orange.fr', 'outlook.com', 'pro-mail.fr'])}`,
    source: pick(SOURCES),
    status,
    createdAt: created.toISOString(),
    brand: r() > 0.3 ? pick(BRANDS) : undefined,
    monthlyRevenue: r() > 0.5 ? pick(['< 5k€', '5-15k€', '15-50k€', '50-100k€', '100k€+']) : undefined,
    bookedAt: status === 'booked' || status === 'showed_up' || status === 'closed'
      ? new Date(created.getTime() + (1 + Math.floor(r() * 5)) * 86400000).toISOString()
      : undefined,
  };
  return lead;
});

export const SOURCE_LABELS: Record<Lead['source'], string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  google: 'Google (SEO)',
  meta_ads: 'Pub Meta',
  referral: 'Bouche à oreille',
  direct: 'Direct',
  linkedin: 'LinkedIn',
};

export const SOURCE_COLORS: Record<Lead['source'], string> = {
  instagram: '#ec4899',
  tiktok: '#22d3ee',
  youtube: '#ef4444',
  google: '#fbbf24',
  meta_ads: '#B794E8',
  referral: '#34d399',
  direct: '#94a3b8',
  linkedin: '#3b82f6',
};

export const STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'Nouveau',
  qualified: 'Qualifié',
  booked: 'RDV pris',
  showed_up: 'A montré',
  closed: 'Signé',
  lost: 'Perdu',
};
