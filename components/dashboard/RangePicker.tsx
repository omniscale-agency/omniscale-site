'use client';
import { GitCompareArrows } from 'lucide-react';
import { RangeKey, RANGES } from '@/lib/timeseries';

const ORDER: Array<Exclude<RangeKey, 'custom'>> = ['24h', '7d', '30d', '60d', '90d'];

interface Props {
  value: Exclude<RangeKey, 'custom'>;
  onChange: (k: Exclude<RangeKey, 'custom'>) => void;
  compare?: boolean;
  onCompareToggle?: (v: boolean) => void;
}

export default function RangePicker({ value, onChange, compare, onCompareToggle }: Props) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
        {ORDER.map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === k ? 'bg-lilac text-ink' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {RANGES[k].shortLabel}
          </button>
        ))}
      </div>
      {onCompareToggle && (
        <button
          onClick={() => onCompareToggle(!compare)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
            compare
              ? 'bg-lilac/15 border-lilac text-lilac'
              : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <GitCompareArrows size={14} /> Comparer
        </button>
      )}
    </div>
  );
}
