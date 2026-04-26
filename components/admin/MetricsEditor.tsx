'use client';
import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Plus, Trash2, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import {
  fetchMetrics, upsertMetric, deleteMetric, subscribeMetrics, recomputeDerivedForPeriod,
  ClientMetric, MetricKey, METRIC_CATALOG, METRIC_BY_KEY, monthKey,
  isDerivedKey, getDerivedRule,
} from '@/lib/metricsStore';
import Card from '@/components/dashboard/Card';

interface Props {
  slug: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  revenue: 'Chiffre d\'affaires',
  ads: 'Publicité',
  social: 'Réseaux sociaux',
  business: 'Business',
};

export default function MetricsEditor({ slug }: Props) {
  const [metrics, setMetrics] = useState<ClientMetric[]>([]);
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [editingCell, setEditingCell] = useState<string | null>(null); // `${metricKey}-${period}`
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    if (!slug) return;
    const refresh = async () => setMetrics(await fetchMetrics(slug));
    refresh();
    return subscribeMetrics(slug, refresh);
  }, [slug]);

  // Génère la liste des 6 derniers mois à partir du cursor (inclus)
  const months = useMemo(() => {
    const out: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - i, 1);
      out.push(d);
    }
    return out;
  }, [monthCursor]);

  // Map { metricKey -> { period -> ClientMetric } } pour O(1) lookup
  const byMetricByPeriod = useMemo(() => {
    const map: Record<string, Record<string, ClientMetric>> = {};
    for (const m of metrics) {
      if (!map[m.metric]) map[m.metric] = {};
      map[m.metric][m.period] = m;
    }
    return map;
  }, [metrics]);

  const startEdit = (metric: MetricKey, period: string, currentValue?: number) => {
    if (isDerivedKey(metric)) return; // verrouillé
    setEditingCell(`${metric}-${period}`);
    setDraftValue(currentValue !== undefined ? String(currentValue) : '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setDraftValue('');
  };

  const saveEdit = async (metric: MetricKey, period: string) => {
    const v = parseFloat(draftValue);
    if (isNaN(v)) {
      cancelEdit();
      return;
    }
    await upsertMetric({ clientSlug: slug, period, metric, value: v });
    // Recalcule les dérivés (ROAS, panier moyen…) pour ce mois
    await recomputeDerivedForPeriod(slug, period);
    cancelEdit();
  };

  const removeCell = async (id: string, period: string) => {
    if (!confirm('Supprimer cette valeur ?')) return;
    await deleteMetric(id);
    // Si on supprime un input d'une formule, le dérivé devient stale → on nettoie
    await recomputeDerivedForPeriod(slug, period);
  };

  const groupedKeys = useMemo(() => {
    const out: Record<string, MetricKey[]> = {};
    for (const m of METRIC_CATALOG) {
      if (!out[m.category]) out[m.category] = [];
      out[m.category].push(m.key);
    }
    return out;
  }, []);

  const fmt = (v: number, unit: string) => {
    if (unit === '€') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    if (unit === '%') return `${v}%`;
    if (unit === 'x') return `×${v.toFixed(1)}`;
    return new Intl.NumberFormat('fr-FR').format(v);
  };

  return (
    <Card title="KPIs mensuels" icon={TrendingUp} subtitle="Visibles côté client en temps réel · clique sur une cellule pour saisir">
      {/* Navigation mois */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const d = new Date(monthCursor);
            d.setMonth(d.getMonth() - 1);
            setMonthCursor(d);
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"
          title="Mois précédents"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-xs text-white/50 uppercase tracking-widest font-mono">
          {months[0].toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
          {' → '}
          {months[months.length - 1].toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
        </div>
        <button
          onClick={() => {
            const d = new Date(monthCursor);
            d.setMonth(d.getMonth() + 1);
            const today = new Date();
            today.setDate(1);
            if (d > today) return;
            setMonthCursor(d);
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 disabled:opacity-30"
          title="Mois suivants"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tableau scrollable */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-widest text-white/40 sticky left-0 bg-black z-10 min-w-[180px]">KPI</th>
              {months.map((m) => {
                const key = monthKey(m);
                return (
                  <th key={key} className="px-3 py-2 font-medium text-xs uppercase tracking-widest text-white/40 text-center min-w-[100px]">
                    {m.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedKeys).map(([cat, keys]) => (
              <>
                <tr key={`cat-${cat}`}>
                  <td colSpan={months.length + 1} className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-lilac/60 font-bold">
                    {CATEGORY_LABELS[cat] || cat}
                  </td>
                </tr>
                {keys.map((mk) => {
                  const def = METRIC_BY_KEY[mk]!;
                  const derivedRule = getDerivedRule(mk);
                  const isDerived = !!derivedRule;
                  return (
                    <tr key={mk} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2 sticky left-0 bg-black z-10 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDerived ? 'text-lilac/80' : 'text-white/90'}`}>{def.label}</span>
                          <span className="text-[10px] text-white/30">{def.unit}</span>
                          {isDerived && (
                            <span
                              title={derivedRule.hint}
                              className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-lilac/15 text-lilac border border-lilac/30"
                            >
                              <Calculator size={9} /> auto
                            </span>
                          )}
                        </div>
                        {isDerived && (
                          <div className="text-[10px] text-white/30 mt-0.5">{derivedRule.hint}</div>
                        )}
                      </td>
                      {months.map((m) => {
                        const period = monthKey(m);
                        const cellId = `${mk}-${period}`;
                        const found = byMetricByPeriod[mk]?.[period];
                        const editing = editingCell === cellId;
                        return (
                          <td
                            key={period}
                            className={`px-2 py-1 text-center border-t border-white/5 group ${isDerived ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => !editing && !isDerived && startEdit(mk, period, found?.value)}
                            title={isDerived ? `${derivedRule.hint} — calculé automatiquement` : undefined}
                          >
                            {editing ? (
                              <div className="flex items-center gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  type="number"
                                  step="any"
                                  value={draftValue}
                                  onChange={(e) => setDraftValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(mk, period);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  onBlur={() => saveEdit(mk, period)}
                                  className="w-20 bg-white/5 border border-lilac/40 rounded px-1.5 py-1 text-sm font-mono outline-none text-center"
                                />
                              </div>
                            ) : found ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`font-mono text-sm ${isDerived ? 'text-lilac' : 'text-white'}`}>
                                  {fmt(found.value, def.unit)}
                                </span>
                                {!isDerived && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeCell(found.id, period); }}
                                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/40 hover:text-red-400"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            ) : isDerived ? (
                              <span className="text-white/20 inline-flex items-center gap-1 text-[10px]" title="Saisis les KPIs d'entrée pour calculer automatiquement">
                                <Calculator size={10} /> —
                              </span>
                            ) : (
                              <span className="text-white/20 group-hover:text-lilac inline-flex items-center gap-1 text-xs">
                                <Plus size={11} /> ajouter
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-white/40 mt-4 leading-relaxed space-y-1">
        <div>💡 Clique sur une cellule pour saisir. Entrée = sauvegarde, Échap = annule.</div>
        <div>🧮 Les KPIs <span className="text-lilac">marqués "auto"</span> (ROAS, panier moyen…) se calculent tout seuls dès que tu saisis leurs entrées (CA pub + Dépense pub → ROAS).</div>
        <div>⚡ Les valeurs apparaissent instantanément sur le dashboard du client (StatCards, bar chart, badge "live").</div>
      </div>
    </Card>
  );
}
