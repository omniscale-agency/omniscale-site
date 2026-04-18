'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, Users, Eye, Target, Sparkles, MousePointerClick,
  CalendarCheck, CheckCircle2, XCircle, Filter, ExternalLink,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { LEADS, SOURCE_LABELS, SOURCE_COLORS, STATUS_LABELS, Lead } from '@/lib/leadsData';
import { generateSeries, RangeKey, sumSeries, deltaPct } from '@/lib/timeseries';
import { formatNumber } from '@/lib/mockData';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';
import RangePicker from '@/components/dashboard/RangePicker';
import AreaChartCard from '@/components/dashboard/AreaChartCard';

function leadsInRange(leads: Lead[], range: RangeKey): Lead[] {
  const days = range === '24h' ? 1 : parseInt(range.replace('d', ''));
  const since = Date.now() - days * 86400000;
  return leads.filter((l) => new Date(l.createdAt).getTime() >= since);
}

export default function AdminLeadsPage() {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<RangeKey>('30d');

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const leads = leadsInRange(LEADS, range);
  const sourceCounts = leads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const statusCounts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  const sourceData = Object.entries(sourceCounts)
    .map(([source, value]) => ({ name: SOURCE_LABELS[source as Lead['source']], value, color: SOURCE_COLORS[source as Lead['source']] }))
    .sort((a, b) => b.value - a.value);

  const funnel = [
    { stage: 'Visiteurs', count: leads.length * 18 + Math.round(Math.random() * 200) },
    { stage: 'Leads', count: leads.length },
    { stage: 'Qualifiés', count: (statusCounts.qualified || 0) + (statusCounts.booked || 0) + (statusCounts.showed_up || 0) + (statusCounts.closed || 0) },
    { stage: 'RDV pris', count: (statusCounts.booked || 0) + (statusCounts.showed_up || 0) + (statusCounts.closed || 0) },
    { stage: 'Présents', count: (statusCounts.showed_up || 0) + (statusCounts.closed || 0) },
    { stage: 'Signés', count: statusCounts.closed || 0 },
  ];

  const closeRate = leads.length > 0 ? Math.round(((statusCounts.closed || 0) / leads.length) * 100) : 0;
  const showUpRate = funnel[3].count > 0 ? Math.round((funnel[4].count / funnel[3].count) * 100) : 0;
  const cac = leads.length > 0 ? Math.round((4200 + Math.random() * 800) / Math.max(1, statusCounts.closed || 1)) : 0;

  // Series totale (vues site + leads)
  const series = generateSeries('omniscale-agency', range);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin · Acquisition</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Leads & <span className="text-gradient">acquisition</span>
          </h1>
          <p className="text-white/60 mt-2">D'où viennent nos clients, conversion rate, funnel complet.</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Visiteurs site" value={formatNumber(funnel[0].count)} delta={32} icon={Eye} accent="lilac" />
        <StatCard label="Leads générés" value={leads.length.toString()} delta={18} icon={Users} accent="green" />
        <StatCard label="Taux de signature" value={`${closeRate}%`} delta={4} icon={Target} accent="amber" />
        <StatCard label="CAC moyen" value={`${cac} €`} delta={-7} icon={MousePointerClick} accent="pink" />
      </div>

      {/* Vues + Leads chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AreaChartCard
          title="Trafic site"
          icon={Eye}
          data={series}
          series={[{ key: 'views', label: 'Visiteurs', color: '#B794E8' }]}
          total={formatNumber(sumSeries(series, 'views'))}
          delta={deltaPct(series, 'views')}
        />
        <AreaChartCard
          title="Followers cumulés (réseaux Omniscale)"
          icon={TrendingUp}
          data={series}
          series={[{ key: 'followers', label: 'Followers', color: '#34d399' }]}
          total={formatNumber(series[series.length - 1]?.followers || 0)}
          delta={deltaPct(series, 'followers')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sources des leads */}
        <Card title="D'où viennent nos leads" icon={Filter} subtitle={`${leads.length} leads sur la période`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} strokeWidth={0}>
                    {sourceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(183,148,232,0.3)', borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm">
              {sourceData.slice(0, 6).map((d) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-mono text-white/70">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Funnel */}
        <Card title="Funnel d'acquisition" icon={Target}>
          <div className="space-y-2">
            {funnel.map((f, i) => {
              const pct = Math.round((f.count / funnel[0].count) * 100);
              const dropPct = i > 0 && funnel[i - 1].count > 0
                ? Math.round((1 - f.count / funnel[i - 1].count) * 100)
                : 0;
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-white/80">{f.stage}</span>
                    <span className="font-mono text-white/60">
                      {f.count} <span className="text-white/30">· {pct}%</span>
                      {i > 0 && dropPct > 0 && (
                        <span className="ml-2 text-xs text-red-400">-{dropPct}%</span>
                      )}
                    </span>
                  </div>
                  <div className="h-7 rounded-md bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-lilac to-omni-400 flex items-center justify-end px-2 text-[10px] font-semibold text-ink"
                      style={{ width: `${pct}%` }}
                    >
                      {pct >= 8 && `${pct}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* iClosed integration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="iClosed" icon={CalendarCheck} subtitle="RDV qualifiés via formulaire" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">RDV pris (période)</div>
              <div className="font-display text-2xl font-bold text-lilac">{(statusCounts.booked || 0) + (statusCounts.showed_up || 0) + (statusCounts.closed || 0)}</div>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Show-up rate</div>
              <div className="font-display text-2xl font-bold text-green-400">{showUpRate}%</div>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Close rate</div>
              <div className="font-display text-2xl font-bold text-amber-400">{closeRate}%</div>
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest text-white/40 mb-3">RDV récents</div>
          <ul className="space-y-2">
            {leads.filter((l) => l.bookedAt).slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{l.name}</div>
                  <div className="text-xs text-white/50 truncate">{l.brand || l.email}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-xs text-white/60">
                    {new Date(l.bookedAt!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={`text-[10px] uppercase font-semibold tracking-widest mt-0.5 ${
                    l.status === 'closed' ? 'text-green-400' :
                    l.status === 'showed_up' ? 'text-amber-400' :
                    l.status === 'booked' ? 'text-lilac' : 'text-white/40'
                  }`}>
                    {STATUS_LABELS[l.status]}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <a
            href="https://app.iclosed.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-lilac hover:underline mt-4"
          >
            <ExternalLink size={12} /> Ouvrir iClosed (synchro API à brancher en phase 2)
          </a>
        </Card>

        {/* Source ROI bars */}
        <Card title="Top sources" icon={Sparkles}>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={sourceData.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(183,148,232,0.3)', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {sourceData.slice(0, 6).map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tableau leads détaillé */}
      <Card title="Tous les leads" icon={Users} subtitle={`${leads.length} sur la période sélectionnée`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-white/40">
              <tr className="border-b border-white/5">
                <th className="text-left p-3 font-normal">Nom</th>
                <th className="text-left p-3 font-normal">Marque</th>
                <th className="text-left p-3 font-normal">CA déclaré</th>
                <th className="text-left p-3 font-normal">Source</th>
                <th className="text-left p-3 font-normal">Statut</th>
                <th className="text-left p-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 15).map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-white/40">{l.email}</div>
                  </td>
                  <td className="p-3 text-white/70">{l.brand || '—'}</td>
                  <td className="p-3 text-white/70">{l.monthlyRevenue || '—'}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[l.source] }} />
                      {SOURCE_LABELS[l.source]}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      l.status === 'closed' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                      l.status === 'lost' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                      l.status === 'showed_up' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                      l.status === 'booked' ? 'text-lilac bg-lilac/10 border-lilac/30' :
                      'text-white/60 bg-white/5 border-white/10'
                    }`}>
                      {l.status === 'closed' ? <CheckCircle2 size={10} className="inline mr-0.5" /> :
                       l.status === 'lost' ? <XCircle size={10} className="inline mr-0.5" /> : null}
                      {STATUS_LABELS[l.status]}
                    </span>
                  </td>
                  <td className="p-3 text-white/60 text-xs">
                    {new Date(l.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length > 15 && (
          <div className="text-xs text-white/40 text-center mt-4">
            Affichage de 15 sur {leads.length} leads
          </div>
        )}
      </Card>
    </main>
  );
}
