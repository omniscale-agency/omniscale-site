'use client';
import { useEffect, useState } from 'react';
import { Search, ChevronRight, Users } from 'lucide-react';
import { CLIENTS, formatNumber } from '@/lib/mockData';

export default function ClientsListPage() {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const filtered = CLIENTS.filter((c) =>
    `${c.brand} ${c.name} ${c.sector} ${c.city}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Clients</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Tous les clients</h1>
        <p className="text-white/60 mt-2">{CLIENTS.length} comptes au total</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const views = c.stats.instagramViews + c.stats.tiktokViews;
          const roas = c.stats.adRevenue / Math.max(1, c.stats.adSpend);
          return (
            <a
              key={c.slug}
              href={`/admin/clients/${c.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-lilac/40 transition-colors flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-lilac/20 border border-lilac/30 flex items-center justify-center font-display font-bold text-lilac">
                {c.brand.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold group-hover:text-lilac transition-colors">{c.brand}</div>
                <div className="text-xs text-white/50 mb-2">{c.sector} · {c.city}</div>
                <div className="flex gap-3 text-xs text-white/60">
                  <span>👀 {formatNumber(views)}</span>
                  <span>💸 x{roas.toFixed(1)}</span>
                  <span>💰 {c.monthlyRevenue}</span>
                </div>
              </div>
              <ChevronRight className="text-white/30 group-hover:text-lilac transition-colors" size={20} />
            </a>
          );
        })}
      </div>
    </main>
  );
}
