'use client';
import { useEffect, useState } from 'react';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import { listAllAdminClients, AdminClientRow } from '@/lib/adminClients';
import { formatNumber } from '@/lib/mockData';

export default function ClientsListPage() {
  const [clients, setClients] = useState<AdminClientRow[]>([]);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listAllAdminClients().then((rows) => {
      setClients(rows);
      setLoaded(true);
    });
  }, []);

  const filtered = clients.filter((c) =>
    `${c.brand} ${c.sector} ${c.city} ${c.profile?.email || ''} ${c.profile?.name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Clients</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Tous les clients</h1>
        <p className="text-white/60 mt-2">
          {loaded ? `${clients.length} compte${clients.length > 1 ? 's' : ''} au total` : 'Chargement…'}
        </p>
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
        {filtered.map((c) => (
          <a
            key={c.slug}
            href={`/admin/clients/${c.slug}`}
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-lilac/40 transition-colors flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-lilac/20 border border-lilac/30 flex items-center justify-center font-display font-bold text-lilac shrink-0">
              {c.brand.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-display font-bold group-hover:text-lilac transition-colors truncate">{c.brand}</div>
                {!c.hasMockStats && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-lilac/15 text-lilac uppercase font-semibold inline-flex items-center gap-1 shrink-0">
                    <Sparkles size={10} /> Nouveau
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50 mb-2">
                {c.sector} {c.city !== '—' && `· ${c.city}`}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-white/60">
                {c.hasMockStats ? (
                  <>
                    <span>👀 {formatNumber(c.views)}</span>
                    <span>💸 x{c.roas.toFixed(1)}</span>
                    <span>💰 {c.monthlyRevenue}</span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400">⏳ Onboarding</span>
                    {c.monthlyRevenue !== '—' && <span>💰 {c.monthlyRevenue}</span>}
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="text-white/30 group-hover:text-lilac transition-colors shrink-0" size={20} />
          </a>
        ))}
      </div>

      {loaded && filtered.length === 0 && (
        <div className="text-center py-16 text-white/40">Aucun client trouvé.</div>
      )}
    </main>
  );
}
