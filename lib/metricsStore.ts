'use client';
import { supabaseBrowser } from './supabase/client';

// ============================================================
// Catalogue des KPIs supportés
// ============================================================
// Pour ajouter un nouveau KPI : ajoute une entrée ici. Aucun changement
// de schéma DB nécessaire (la table accepte n'importe quelle clé).

export type MetricKey =
  | 'revenue'
  | 'ad_spend'
  | 'ad_revenue'
  | 'roas'
  | 'engagement_rate'
  | 'followers_total'
  | 'followers_gained'
  | 'views'
  | 'posts'
  | 'conversions'
  | 'avg_order'
  | 'leads';

export interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string;          // '€', '%', 'x', '' (count)
  description?: string;
  category: 'revenue' | 'ads' | 'social' | 'business';
}

export const METRIC_CATALOG: MetricDef[] = [
  { key: 'revenue',          label: 'CA total',          unit: '€', category: 'revenue', description: 'Chiffre d\'affaires généré ce mois (toutes sources)' },
  { key: 'ad_spend',         label: 'Dépense pub',       unit: '€', category: 'ads',     description: 'Budget total investi en publicité Meta / TikTok' },
  { key: 'ad_revenue',       label: 'CA pub',            unit: '€', category: 'ads',     description: 'Revenus directement attribués aux campagnes pub' },
  { key: 'roas',             label: 'ROAS',              unit: 'x', category: 'ads',     description: 'Retour sur investissement publicitaire (CA pub / Dépense pub)' },
  { key: 'engagement_rate',  label: 'Engagement moyen',  unit: '%', category: 'social',  description: 'Taux d\'engagement moyen sur les contenus publiés' },
  { key: 'followers_total',  label: 'Abonnés (total)',   unit: '',  category: 'social',  description: 'Nombre total d\'abonnés toutes plateformes' },
  { key: 'followers_gained', label: 'Abonnés gagnés',    unit: '',  category: 'social',  description: 'Nouveaux abonnés gagnés sur le mois' },
  { key: 'views',            label: 'Vues',              unit: '',  category: 'social',  description: 'Vues totales du mois (toutes plateformes)' },
  { key: 'posts',            label: 'Publications',      unit: '',  category: 'social',  description: 'Nombre de posts / vidéos publiés' },
  { key: 'conversions',      label: 'Conversions',       unit: '',  category: 'business', description: 'Nombre de ventes / commandes / inscriptions' },
  { key: 'avg_order',        label: 'Panier moyen',      unit: '€', category: 'business', description: 'Valeur moyenne d\'une commande / vente' },
  { key: 'leads',            label: 'Leads générés',     unit: '',  category: 'business', description: 'Prospects qualifiés acquis ce mois' },
];

export const METRIC_BY_KEY: Record<string, MetricDef> = Object.fromEntries(
  METRIC_CATALOG.map((m) => [m.key, m]),
);

// ============================================================
// KPIs CALCULÉS automatiquement à partir d'autres KPIs
// ============================================================
// Pour ajouter une formule : ajoute une entrée. Le moteur recalcule
// automatiquement la valeur dérivée chaque fois qu'un input change.
// La cellule du KPI dérivé devient en lecture seule dans l'admin.

export interface DerivedRule {
  key: MetricKey;
  inputs: MetricKey[];
  /** Renvoie la valeur calculée, ou null si manquant / non calculable. */
  compute: (vals: Record<string, number>) => number | null;
  hint: string;
}

export const DERIVED_RULES: DerivedRule[] = [
  {
    key: 'roas',
    inputs: ['ad_revenue', 'ad_spend'],
    compute: (v) => (v.ad_spend > 0 ? Math.round((v.ad_revenue / v.ad_spend) * 100) / 100 : null),
    hint: 'ROAS = CA pub ÷ Dépense pub',
  },
  {
    key: 'avg_order',
    inputs: ['revenue', 'conversions'],
    compute: (v) => (v.conversions > 0 ? Math.round(v.revenue / v.conversions) : null),
    hint: 'Panier moyen = CA total ÷ Conversions',
  },
];

export function isDerivedKey(key: MetricKey): boolean {
  return DERIVED_RULES.some((r) => r.key === key);
}

export function getDerivedRule(key: MetricKey): DerivedRule | undefined {
  return DERIVED_RULES.find((r) => r.key === key);
}

// ============================================================
// Types DB
// ============================================================
export interface ClientMetric {
  id: string;
  clientSlug: string;
  period: string;        // ISO date 'YYYY-MM-01'
  metric: MetricKey;
  value: number;
  unit: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

function fromDB(r: any): ClientMetric {
  return {
    id: r.id,
    clientSlug: r.client_slug,
    period: r.period,
    metric: r.metric as MetricKey,
    value: Number(r.value),
    unit: r.unit || '',
    notes: r.notes || undefined,
    createdAt: r.created_at || undefined,
    updatedAt: r.updated_at || undefined,
  };
}

/** Normalise un objet Date au 1er du mois en ISO 'YYYY-MM-01'. */
export function monthKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

// ============================================================
// Fetch
// ============================================================
/** Récupère TOUTES les métriques d'un client (triées par période desc). */
export async function fetchMetrics(clientSlug: string): Promise<ClientMetric[]> {
  const sb = supabaseBrowser();
  const { data } = await sb
    .from('client_metrics')
    .select('*')
    .eq('client_slug', clientSlug)
    .order('period', { ascending: false })
    .order('metric', { ascending: true });
  return (data || []).map(fromDB);
}

/** Récupère uniquement les N derniers mois pour un client. */
export async function fetchRecentMetrics(clientSlug: string, monthsBack = 12): Promise<ClientMetric[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceKey = monthKey(since);
  const sb = supabaseBrowser();
  const { data } = await sb
    .from('client_metrics')
    .select('*')
    .eq('client_slug', clientSlug)
    .gte('period', sinceKey)
    .order('period', { ascending: true });
  return (data || []).map(fromDB);
}

// ============================================================
// Mutations
// ============================================================
/** Upsert (insert OR update si la clé (slug,period,metric) existe). */
export async function upsertMetric(opts: {
  clientSlug: string;
  period: string;        // 'YYYY-MM-01'
  metric: MetricKey;
  value: number;
  unit?: string;
  notes?: string;
}): Promise<ClientMetric | null> {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  const def = METRIC_BY_KEY[opts.metric];
  const { data } = await sb
    .from('client_metrics')
    .upsert({
      client_slug: opts.clientSlug,
      period: opts.period,
      metric: opts.metric,
      value: opts.value,
      unit: opts.unit ?? def?.unit ?? '',
      notes: opts.notes ?? null,
      created_by: user?.id,
    }, { onConflict: 'client_slug,period,metric' })
    .select()
    .single();
  return data ? fromDB(data) : null;
}

export async function deleteMetric(id: string) {
  const sb = supabaseBrowser();
  await sb.from('client_metrics').delete().eq('id', id);
}

/**
 * Recalcule TOUS les KPIs dérivés (ROAS, panier moyen, etc.) pour une période donnée.
 *
 * À appeler après chaque save d'un KPI brut côté admin : si tous les inputs d'une
 * règle sont présents pour cette période, on upsert la valeur calculée. Si un input
 * vient à manquer (admin a supprimé la cellule), on supprime aussi le dérivé pour
 * éviter d'afficher une valeur stale.
 *
 * `metricsForPeriod` est optionnel — si fourni, on s'épargne un fetch.
 */
export async function recomputeDerivedForPeriod(
  clientSlug: string,
  period: string,
  metricsForPeriod?: ClientMetric[],
): Promise<void> {
  let metrics = metricsForPeriod;
  if (!metrics) {
    const sb = supabaseBrowser();
    const { data } = await sb
      .from('client_metrics')
      .select('*')
      .eq('client_slug', clientSlug)
      .eq('period', period);
    metrics = (data || []).map(fromDB);
  }

  const byKey: Record<string, number> = {};
  metrics.forEach((m) => { byKey[m.metric] = m.value; });

  for (const rule of DERIVED_RULES) {
    const allInputsPresent = rule.inputs.every((k) => k in byKey);
    if (!allInputsPresent) {
      // Inputs manquants → on supprime l'éventuelle valeur dérivée stale
      const stale = metrics.find((m) => m.metric === rule.key);
      if (stale) await deleteMetric(stale.id);
      continue;
    }
    const computed = rule.compute(byKey);
    if (computed === null) continue;
    const existing = metrics.find((m) => m.metric === rule.key);
    if (existing && existing.value === computed) continue; // no-op
    await upsertMetric({
      clientSlug,
      period,
      metric: rule.key,
      value: computed,
      unit: METRIC_BY_KEY[rule.key]?.unit ?? '',
    });
  }
}

// ============================================================
// Helpers d'agrégation (pour le dashboard client)
// ============================================================

/** Convertit un tableau de métriques en map { metricKey -> latestPoint }. */
export function latestByMetric(metrics: ClientMetric[]): Record<string, ClientMetric> {
  const out: Record<string, ClientMetric> = {};
  for (const m of metrics) {
    if (!out[m.metric] || new Date(m.period) > new Date(out[m.metric].period)) {
      out[m.metric] = m;
    }
  }
  return out;
}

/** Calcule la variation % entre la dernière et l'avant-dernière période d'un KPI. */
export function trendForMetric(metrics: ClientMetric[], key: MetricKey): { current: number | null; previous: number | null; deltaPct: number | null } {
  const filtered = metrics.filter((m) => m.metric === key)
    .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
  const current = filtered[0]?.value ?? null;
  const previous = filtered[1]?.value ?? null;
  if (current === null || previous === null || previous === 0) {
    return { current, previous, deltaPct: null };
  }
  const deltaPct = Math.round(((current - previous) / previous) * 100);
  return { current, previous, deltaPct };
}

/** Renvoie la série des valeurs d'un KPI sur les N derniers mois (asc, padded à 0 si manquant). */
export function monthlySeries(metrics: ClientMetric[], key: MetricKey, monthsBack = 12): Array<{ month: string; value: number }> {
  const series: Array<{ month: string; value: number }> = [];
  const today = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const period = monthKey(d);
    const found = metrics.find((m) => m.metric === key && m.period === period);
    series.push({
      month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      value: found?.value || 0,
    });
  }
  return series;
}

// ============================================================
// Realtime
// ============================================================
export function subscribeMetrics(clientSlug: string, cb: () => void): () => void {
  const sb = supabaseBrowser();
  const uniq = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const ch = sb
    .channel(`metrics-${clientSlug}-${uniq}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'client_metrics', filter: `client_slug=eq.${clientSlug}` },
      () => cb(),
    )
    .subscribe();
  return () => { sb.removeChannel(ch); };
}
