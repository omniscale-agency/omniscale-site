'use client';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  delta?: number; // %
  icon: LucideIcon;
  accent?: 'lilac' | 'green' | 'pink' | 'amber';
}

const ACCENTS = {
  lilac: 'bg-lilac/10 border-lilac/30 text-lilac',
  green: 'bg-green-500/10 border-green-500/30 text-green-400',
  pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
};

export default function StatCard({ label, value, delta, icon: Icon, accent = 'lilac' }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${ACCENTS[accent]}`}>
          <Icon size={18} />
        </div>
        {typeof delta === 'number' && (
          <div
            className={`text-xs font-semibold inline-flex items-center gap-0.5 px-2 py-1 rounded-full ${
              delta >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            }`}
          >
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta >= 0 ? '+' : ''}{delta}%
          </div>
        )}
      </div>
      <div className="text-xs uppercase tracking-widest text-white/40 mb-1">{label}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
