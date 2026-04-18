// Génère des séries temporelles mock réalistes pour les charts.
// À remplacer par des vraies API (Instagram Graph, TikTok Business, etc.) en phase 2.

export type RangeKey = '24h' | '7d' | '30d' | '60d' | '90d' | 'custom';

export interface RangeConfig {
  label: string;
  shortLabel: string;
  points: number;
  granularity: 'hour' | 'day';
  hoursBack?: number;
  daysBack?: number;
}

export const RANGES: Record<Exclude<RangeKey, 'custom'>, RangeConfig> = {
  '24h': { label: '24 dernières heures', shortLabel: '24h', points: 24, granularity: 'hour', hoursBack: 24 },
  '7d': { label: '7 derniers jours', shortLabel: '7j', points: 7, granularity: 'day', daysBack: 7 },
  '30d': { label: '30 derniers jours', shortLabel: '30j', points: 30, granularity: 'day', daysBack: 30 },
  '60d': { label: '60 derniers jours', shortLabel: '60j', points: 60, granularity: 'day', daysBack: 60 },
  '90d': { label: '90 derniers jours', shortLabel: '90j', points: 90, granularity: 'day', daysBack: 90 },
};

export interface SeriesPoint {
  date: string;
  label: string;
  views: number;
  followers: number;
  // Breakdown par plateforme (nouveau)
  followersInstagram: number;
  followersTiktok: number;
  followersYoutube: number;
  engagement: number;
  adSpend: number;
  adRevenue: number;
  // Champs comparaison (rempli si comparant)
  prevViews?: number;
  prevFollowers?: number;
  prevAdRevenue?: number;
  prevEngagement?: number;
}

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

interface GenOptions {
  /** Décalage temporel en jours/heures (pour générer la période précédente) */
  offset?: number;
}

function pointsForRange(range: Exclude<RangeKey, 'custom'>): RangeConfig {
  return RANGES[range];
}

export function generateSeries(
  clientSlug: string,
  range: Exclude<RangeKey, 'custom'>,
  opts: GenOptions = {},
): SeriesPoint[] {
  const cfg = pointsForRange(range);
  const offset = opts.offset || 0;
  const rand = rng(hashSeed(clientSlug + range + 'main' + offset));
  const now = new Date();

  const seedBase = hashSeed(clientSlug) >>> 0;
  const baseViews = 5000 + (seedBase % 25000);
  // Distribution typique : TikTok > Instagram > YouTube
  const baseIG = 8000 + (seedBase % 22000);
  const baseTT = 12000 + (seedBase % 35000);
  const baseYT = 1000 + (seedBase % 6000);
  const baseEngagement = 4 + (seedBase % 5);
  const baseAdSpend = 80 + (seedBase % 300);

  // Si on génère la période précédente : appliquer un facteur "moins bon"
  const prevFactor = offset > 0 ? 0.78 + (seedBase % 100) / 1000 : 1;

  const points: SeriesPoint[] = [];
  for (let i = cfg.points - 1; i >= 0; i--) {
    const d = new Date(now);
    if (cfg.granularity === 'hour') {
      d.setHours(d.getHours() - i - offset);
      d.setMinutes(0, 0, 0);
    } else {
      d.setDate(d.getDate() - i - offset);
      d.setHours(0, 0, 0, 0);
    }

    const idx = cfg.points - 1 - i;
    const trend = 1 + (idx / cfg.points) * 0.4;
    const wave = 1 + Math.sin((idx / cfg.points) * Math.PI * 4) * 0.15;
    const noise = 0.85 + rand() * 0.3;
    const factor = trend * wave * noise * prevFactor;

    const views = Math.round(baseViews * factor * (cfg.granularity === 'hour' ? 0.3 : 1));
    const adSpend = Math.round(baseAdSpend * factor);
    const adRevenue = Math.round(adSpend * (4 + rand() * 3));

    // Followers cumulés par plateforme (croissance progressive)
    const igGrowth = idx * Math.round(8 + rand() * 18);
    const ttGrowth = idx * Math.round(15 + rand() * 30);
    const ytGrowth = idx * Math.round(2 + rand() * 6);
    const followersInstagram = Math.round((baseIG + igGrowth) * prevFactor);
    const followersTiktok = Math.round((baseTT + ttGrowth) * prevFactor);
    const followersYoutube = Math.round((baseYT + ytGrowth) * prevFactor);
    const followers = followersInstagram + followersTiktok + followersYoutube;
    const engagement = +((baseEngagement + (rand() * 2 - 1)) * prevFactor).toFixed(1);

    points.push({
      date: d.toISOString(),
      label:
        cfg.granularity === 'hour'
          ? d.toLocaleTimeString('fr-FR', { hour: '2-digit' })
          : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      views,
      followers,
      followersInstagram,
      followersTiktok,
      followersYoutube,
      engagement,
      adSpend,
      adRevenue,
    });
  }

  return points;
}

/** Génère la série principale + une série de comparaison (période précédente alignée) */
export function generateWithCompare(
  clientSlug: string,
  range: Exclude<RangeKey, 'custom'>,
): SeriesPoint[] {
  const main = generateSeries(clientSlug, range);
  const cfg = pointsForRange(range);
  const offset = cfg.granularity === 'hour' ? cfg.points : cfg.points;
  const prev = generateSeries(clientSlug, range, { offset });
  return main.map((p, i) => ({
    ...p,
    prevViews: prev[i]?.views,
    prevFollowers: prev[i]?.followers,
    prevAdRevenue: prev[i]?.adRevenue,
    prevEngagement: prev[i]?.engagement,
  }));
}

export function sumSeries(points: SeriesPoint[], key: keyof SeriesPoint): number {
  return points.reduce((s, p) => s + ((p[key] as number) || 0), 0);
}

export function avgSeries(points: SeriesPoint[], key: keyof SeriesPoint): number {
  if (!points.length) return 0;
  return sumSeries(points, key) / points.length;
}

export function deltaPct(points: SeriesPoint[], key: keyof SeriesPoint): number {
  if (points.length < 4) return 0;
  const half = Math.floor(points.length / 2);
  const a = sumSeries(points.slice(0, half), key);
  const b = sumSeries(points.slice(half), key);
  if (a === 0) return 0;
  return Math.round(((b - a) / a) * 100);
}

/** Compare le total de la période principale vs la période précédente (sur la même série) */
export function compareDelta(points: SeriesPoint[], mainKey: keyof SeriesPoint, prevKey: keyof SeriesPoint): number {
  const main = sumSeries(points, mainKey);
  const prev = sumSeries(points, prevKey);
  if (prev === 0) return 0;
  return Math.round(((main - prev) / prev) * 100);
}
