'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { SeriesPoint } from '@/lib/timeseries';
import { formatNumber } from '@/lib/mockData';

interface Series {
  key: keyof Omit<SeriesPoint, 'date' | 'label'>;
  label: string;
  color: string; // tailwind color hex
}

interface Props {
  title: string;
  icon?: LucideIcon;
  data: SeriesPoint[];
  series: Series[];
  total?: string;
  delta?: number;
  height?: number;
  formatY?: (v: number) => string;
  className?: string;
}

const numberFmt = (v: number) => formatNumber(v);

export default function AreaChartCard({
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
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
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
        <div className="flex flex-wrap gap-2 text-xs text-white/60">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
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
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
