'use client';
import { RangeKey, RANGES } from '@/lib/timeseries';

const ORDER: RangeKey[] = ['24h', '7d', '30d', '60d', '90d'];

export default function RangePicker({ value, onChange }: { value: RangeKey; onChange: (k: RangeKey) => void }) {
  return (
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
  );
}
