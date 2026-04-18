'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { SeriesPoint } from '@/lib/timeseries';
import { formatNumber } from '@/lib/mockData';

interface Series {
  key: keyof SeriesPoint;
  label: string;
  color: string;
}

interface Props {
  title: string;
  icon?: LucideIcon;
  data: SeriesPoint[];
  series: Series[]; // empilées
  total?: string;
  delta?: number;
  height?: number;
  formatY?: (v: number) => string;
  className?: string;
}

const numberFmt = (v: number) => formatNumber(v);

export default function StackedAreaChartCard({
  title,
  icon: Icon,
  data,
  series,
  total,
  delta,
  height = 240,
  formatY = numberFmt,
  className = '',
}: Props) {
  // Compute share % per platform (last point)
  const last = data[data.length - 1];
  const totalLast = series.reduce((s, sr) => s + ((last?.[sr.key] as number) || 0), 0);
  const shares = series.map((sr) => ({
    ...sr,
    value: (last?.[sr.key] as number) || 0,
    pct: totalLast > 0 ? Math.round((((last?.[sr.key] as number) || 0) / totalLast) * 100) : 0,
  }));

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${className}`}>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-lilac/10 border border-lilac/30 flex items-center justify-center">
                <Icon size={16} className="text-lilac" />
              </div>
            )}
            <h3 className="font-display font-bold text-lg">{title}</h3>
          </div>
          {total && (
            <div className="flex items-baseline gap-3 ml-10">
              <div className="font-display text-3xl font-bold">{total}</div>
              {typeof delta === 'number' && (
                <div className={`text-xs font-semibold inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                  delta >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {delta >= 0 ? '+' : ''}{delta}%
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs justify-end">
          {shares.map((s) => (
            <span key={s.key as string} className="inline-flex items-center gap-1.5 text-white/70">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label} <span className="text-white/40">·</span> <span className="font-mono text-white/90">{s.pct}%</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key as string} id={`stk-${title}-${s.key as string}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatY} />
            <Tooltip
              cursor={{ stroke: 'rgba(183,148,232,0.4)', strokeWidth: 1 }}
              contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(183,148,232,0.3)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: '#B794E8', fontWeight: 600 }}
              itemStyle={{ color: '#fff' }}
              formatter={(v: number) => formatY(v)}
            />
            {series.map((s) => (
              <Area
                key={s.key as string}
                type="monotone"
                dataKey={s.key as string}
                name={s.label}
                stackId="stack"
                stroke={s.color}
                strokeWidth={1.5}
                fill={`url(#stk-${title}-${s.key as string})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini bars % en bas */}
      <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
        {shares.map((s) => (
          <div key={s.key as string}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-white/80">{s.label}</span>
              </span>
              <span className="font-mono text-white/60">{formatNumber(s.value)} · <span className="text-white">{s.pct}%</span></span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
