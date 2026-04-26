'use client';
import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import Card from './Card';
import { ClientMetric, METRIC_CATALOG, METRIC_BY_KEY, MetricKey, monthlySeries } from '@/lib/metricsStore';

interface Props {
  metrics: ClientMetric[];
  monthsBack?: number;
  /** Sous-set de KPIs à proposer dans le sélecteur (par défaut: revenue, ad_spend, ad_revenue, roas, engagement_rate, followers_gained). */
  availableKeys?: MetricKey[];
  className?: string;
}

const DEFAULT_KEYS: MetricKey[] = [
  'revenue', 'ad_spend', 'ad_revenue', 'roas', 'engagement_rate', 'followers_gained', 'views', 'conversions',
];

const COLORS: Record<string, string> = {
  revenue: '#22c55e',
  ad_spend: '#f87171',
  ad_revenue: '#fbbf24',
  roas: '#a855f7',
  engagement_rate: '#ec4899',
  followers_total: '#22d3ee',
  followers_gained: '#22d3ee',
  views: '#B794E8',
  posts: '#94a3b8',
  conversions: '#06b6d4',
  avg_order: '#84cc16',
  leads: '#f59e0b',
};

export default function MonthlyMetricsCard({
  metrics, monthsBack = 12, availableKeys = DEFAULT_KEYS, className = '',
}: Props) {
  const keysWithData = availableKeys.filter((k) => metrics.some((m) => m.metric === k));
  const initialKey: MetricKey = (keysWithData[0] || availableKeys[0]);
  const [activeKey, setActiveKey] = useState<MetricKey>(initialKey);

  const def = METRIC_BY_KEY[activeKey];
  const data = monthlySeries(metrics, activeKey, monthsBack);
  const total = data.reduce((s, d) => s + d.value, 0);
  const avg = data.length > 0 ? total / data.length : 0;

  if (metrics.length === 0) {
    return null; // pas de KPIs définis → on n'affiche rien (les charts seedés font le job pour les démos)
  }

  const fmt = (v: number) => {
    if (def.unit === '€') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    if (def.unit === '%') return `${v}%`;
    if (def.unit === 'x') return `×${v.toFixed(1)}`;
    return new Intl.NumberFormat('fr-FR').format(v);
  };

  return (
    <Card
      title="Évolution mensuelle"
      icon={TrendingUp}
      subtitle={`${def.label} — ${monthsBack} derniers mois`}
      className={className}
      action={
        <div className="text-right">
          <div className="text-xs text-white/50">Moyenne</div>
          <div className="font-mono text-sm text-white">{fmt(avg)}</div>
        </div>
      }
    >
      {/* Sélecteur de KPI */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {availableKeys.map((k) => {
          const d = METRIC_BY_KEY[k];
          if (!d) return null;
          const has = metrics.some((m) => m.metric === k);
          const active = k === activeKey;
          return (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              disabled={!has}
              className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-semibold border transition-colors ${
                active
                  ? 'bg-lilac/20 text-lilac border-lilac/40'
                  : has
                  ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  : 'bg-white/[0.02] text-white/20 border-white/5 cursor-not-allowed'
              }`}
              title={d.description || d.label}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.4)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => def.unit === '€' ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: 'white',
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}
              formatter={(v: number) => [fmt(v), def.label]}
            />
            <Bar
              dataKey="value"
              fill={COLORS[activeKey] || '#B794E8'}
              radius={[6, 6, 0, 0]}
              maxBarSize={42}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
