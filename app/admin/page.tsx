'use client';
import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, Eye, DollarSign, Activity,
  Search, ChevronRight, Sparkles,
} from 'lucide-react';
import { CLIENTS, formatNumber, formatCurrency } from '@/lib/mockData';
import { listAllAdminClients, AdminClientRow } from '@/lib/adminClients';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';

export default function AdminOverview() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<AdminClientRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listAllAdminClients().then((rows) => {
      setClients(rows);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return <div className="p-12 text-white/60">Chargement…</div>;
  }

  // Aggregate metrics — uniquement sur les clients qui ont des stats
  const withStats = clients.filter((c) => c.hasMockStats && c.mockData);
  const totalRevenue = withStats.reduce((s, c) => s + (c.mockData?.stats.adRevenue || 0), 0);
  const totalSpend = withStats.reduce((s, c) => s + (c.mockData?.stats.adSpend || 0), 0);
  const totalViews = withStats.reduce((s, c) => s + c.views, 0);
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const filtered = clients.filter((c) =>
    `${c.brand} ${c.sector} ${c.city} ${c.profile?.email || ''} ${c.profile?.name || ''}`
      .toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Vue <span className="text-gradient">d'ensemble</span>
        </h1>
        <p className="text-white/60 mt-2">{clients.length} client{clients.length > 1 ? 's' : ''} actif{clients.length > 1 ? 's' : ''} · données 30 derniers jours</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Clients actifs" value={clients.length.toString()} delta={50} icon={Users} accent="lilac" />
        <StatCard label="Vues cumulées 30j" value={formatNumber(totalViews)} delta={32} icon={Eye} accent="green" />
        <StatCard label="CA pub généré" value={formatCurrency(totalRevenue)} delta={28} icon={DollarSign} accent="amber" />
        <StatCard label="ROAS moyen" value={`x${overallRoas.toFixed(1)}`} delta={9} icon={TrendingUp} accent="pink" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden mb-10">
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Users size={18} className="text-lilac" /> Tous les clients
          </h2>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-lilac/50" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-white/40 border-b border-white/5">
                <th className="text-left p-4 font-normal">Client</th>
                <th className="text-left p-4 font-normal">Secteur · Ville</th>
                <th className="text-left p-4 font-normal">Vues 30j</th>
                <th className="text-left p-4 font-normal">ROAS</th>
                <th className="text-left p-4 font-normal">CA mensuel</th>
                <th className="text-left p-4 font-normal">Statut</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.slug} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <a href={`/admin/clients/${c.slug}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-lilac/20 border border-lilac/30 flex items-center justify-center font-semibold text-xs text-lilac shrink-0">
                        {c.brand.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium group-hover:text-lilac transition-colors flex items-center gap-2">
                          <span className="truncate">{c.brand}</span>
                          {!c.hasMockStats && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-lilac/15 text-lilac uppercase font-semibold inline-flex items-center gap-0.5 shrink-0">
                              <Sparkles size={9} /> Nouveau
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 truncate">{c.profile?.email || c.mockData?.contact.email || ''}</div>
                      </div>
                    </a>
                  </td>
                  <td className="p-4 text-white/70">
                    {c.sector}
                    {c.city !== '—' && <div className="text-xs text-white/40">{c.city}</div>}
                  </td>
                  <td className="p-4 font-medium">{c.hasMockStats ? formatNumber(c.views) : <span className="text-white/30">—</span>}</td>
                  <td className="p-4 font-medium text-amber-400">{c.hasMockStats ? `x${c.roas.toFixed(1)}` : <span className="text-white/30">—</span>}</td>
                  <td className="p-4 font-medium">{c.monthlyRevenue}</td>
                  <td className="p-4">
                    {c.hasMockStats ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">● actif</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">● onboarding</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <a href={`/admin/clients/${c.slug}`} className="inline-flex items-center text-white/40 hover:text-lilac">
                      <ChevronRight size={18} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Card title="Activité récente sur tous les clients" icon={Activity}>
        <ol className="relative space-y-4 ml-3 border-l border-white/10 pl-5">
          {CLIENTS.flatMap((c) =>
            c.activity.map((a) => ({ ...a, brand: c.brand, slug: c.slug })),
          )
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .slice(0, 10)
            .map((a) => (
              <li key={`${a.slug}-${a.id}`} className="relative">
                <span className="absolute -left-[1.7rem] top-1 w-3 h-3 rounded-full bg-lilac ring-4 ring-black" />
                <div className="text-sm">
                  <a href={`/admin/clients/${a.slug}`} className="text-lilac hover:underline">{a.brand}</a>
                  <span className="text-white/80"> · {a.label}</span>
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  {new Date(a.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
        </ol>
      </Card>
    </main>
  );
}
