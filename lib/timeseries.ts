// Génère des séries temporelles mock réalistes pour les charts.
// À remplacer par des vraies API (Instagram Graph, TikTok Business, etc.) en phase 2.

export type RangeKey = '24h' | '7d' | '30d' | '60d' | '90d';

export interface RangeConfig {
  label: string;
  shortLabel: string;
  points: number;
  granularity: 'hour' | 'day';
  hoursBack?: number;
  daysBack?: number;
}

export const RANGES: Record<RangeKey, RangeConfig> = {
  '24h': { label: '24 dernières heures', shortLabel: '24h', points: 24, granularity: 'hour', hoursBack: 24 },
  '7d': { label: '7 derniers jours', shortLabel: '7j', points: 7, granularity: 'day', daysBack: 7 },
  '30d': { label: '30 derniers jours', shortLabel: '30j', points: 30, granularity: 'day', daysBack: 30 },
  '60d': { label: '60 derniers jours', shortLabel: '60j', points: 60, granularity: 'day', daysBack: 60 },
  '90d': { label: '90 derniers jours', shortLabel: '90j', points: 90, granularity: 'day', daysBack: 90 },
};

export interface SeriesPoint {
  date: string;          // ISO
  label: string;         // affichable
  views: number;
  followers: number;
  engagement: number;    // %
  adSpend: number;
  adRevenue: number;
}

// PRNG simple (mulberry32) seedé pour stabilité
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
}

export function generateSeries(clientSlug: string, range: RangeKey): SeriesPoint[] {
  const cfg = RANGES[range];
  const rand = rng(hashSeed(clientSlug + range));
  const now = new Date();

  // Bases différentes selon le client (pour avoir des courbes distinctes)
  const seedBase = hashSeed(clientSlug) >>> 0;
  const baseViews = 5000 + (seedBase % 25000);
  const baseFollowers = 8000 + (seedBase % 40000);
  const baseEngagement = 4 + (seedBase % 5);
  const baseAdSpend = 80 + (seedBase % 300);

  const points: SeriesPoint[] = [];
  for (let i = cfg.points - 1; i >= 0; i--) {
    const d = new Date(now);
    if (cfg.granularity === 'hour') {
      d.setHours(d.getHours() - i);
      d.setMinutes(0, 0, 0);
    } else {
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
    }

    // Tendance haussière + saisonnalité hebdo + bruit
    const idx = cfg.points - 1 - i;
    const trend = 1 + (idx / cfg.points) * 0.4;
    const wave = 1 + Math.sin((idx / cfg.points) * Math.PI * 4) * 0.15;
    const noise = 0.85 + rand() * 0.3;
    const factor = trend * wave * noise;

    const views = Math.round(baseViews * factor * (cfg.granularity === 'hour' ? 0.3 : 1));
    const adSpend = Math.round(baseAdSpend * factor);
    const adRevenue = Math.round(adSpend * (4 + rand() * 3));
    const followersGained = Math.round(15 + rand() * 80);
    const followers = baseFollowers + idx * Math.round(20 + rand() * 30);
    const engagement = +(baseEngagement + (rand() * 2 - 1)).toFixed(1);

    points.push({
      date: d.toISOString(),
      label:
        cfg.granularity === 'hour'
          ? d.toLocaleTimeString('fr-FR', { hour: '2-digit' })
          : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      views,
      followers,
      engagement,
      adSpend,
      adRevenue,
    });
    void followersGained; // utilisé éventuellement plus tard
  }

  return points;
}

export function sumSeries(points: SeriesPoint[], key: keyof Omit<SeriesPoint, 'date' | 'label'>): number {
  return points.reduce((s, p) => s + (p[key] as number), 0);
}

export function avgSeries(points: SeriesPoint[], key: keyof Omit<SeriesPoint, 'date' | 'label'>): number {
  if (!points.length) return 0;
  return sumSeries(points, key) / points.length;
}

export function deltaPct(points: SeriesPoint[], key: keyof Omit<SeriesPoint, 'date' | 'label'>): number {
  if (points.length < 4) return 0;
  const half = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, half);
  const secondHalf = points.slice(half);
  const a = sumSeries(firstHalf, key);
  const b = sumSeries(secondHalf, key);
  if (a === 0) return 0;
  return Math.round(((b - a) / a) * 100);
}
