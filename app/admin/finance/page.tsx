'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Wallet, TrendingUp, FileText, AlertCircle, CheckCircle2,
  Clock, DollarSign, Receipt, ArrowUp, ArrowDown, Plus, Send, Download,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { CLIENTS, formatCurrency } from '@/lib/mockData';
import { listInvoices, subscribeInvoices, computeTotals, updateInvoice, InvoiceDoc } from '@/lib/invoicesStore';
import { downloadPDF } from '@/lib/pdfGenerator';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';
import InvoiceCreator from '@/components/admin/InvoiceCreator';

interface MockInvoice {
  id: string;
  client: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
}

const SEED_INVOICES: MockInvoice[] = [
  { id: 'F-2026-042', client: 'Maison Léa', amount: 2500, issuedAt: '2026-04-01', dueAt: '2026-04-30', status: 'pending' },
  { id: 'F-2026-041', client: 'Trattoria Sole', amount: 1800, issuedAt: '2026-04-01', dueAt: '2026-04-30', status: 'paid' },
  { id: 'F-2026-040', client: 'Glow Cosmetics', amount: 4500, issuedAt: '2026-04-01', dueAt: '2026-04-15', status: 'paid' },
  { id: 'F-2026-039', client: 'Atelier Brut', amount: 2200, issuedAt: '2026-03-15', dueAt: '2026-04-14', status: 'overdue' },
  { id: 'F-2026-038', client: 'Maison Léa', amount: 2500, issuedAt: '2026-03-01', dueAt: '2026-03-31', status: 'paid' },
  { id: 'F-2026-037', client: 'Trattoria Sole', amount: 1800, issuedAt: '2026-03-01', dueAt: '2026-03-31', status: 'paid' },
  { id: 'F-2026-036', client: 'Glow Cosmetics', amount: 4500, issuedAt: '2026-03-01', dueAt: '2026-03-15', status: 'paid' },
];

const UPCOMING_PAYMENTS = [
  { id: 'p1', client: 'Maison Léa', amount: 2500, expectedAt: '2026-04-30', type: 'monthly' as const },
  { id: 'p2', client: 'Glow Cosmetics', amount: 4500, expectedAt: '2026-05-01', type: 'monthly' as const },
  { id: 'p3', client: 'Trattoria Sole', amount: 1800, expectedAt: '2026-05-01', type: 'monthly' as const },
  { id: 'p4', client: 'Atelier Brut', amount: 2200, expectedAt: '2026-04-14', type: 'monthly' as const },
  { id: 'p5', client: 'Glow Cosmetics', amount: 6000, expectedAt: '2026-05-15', type: 'project' as const },
];

const MONTHLY = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (11 - i));
  const base = 8000 + i * 800 + Math.round((Math.sin(i) + 1) * 1500);
  return {
    month: d.toLocaleDateString('fr-FR', { month: 'short' }),
    monthFull: d.toISOString().slice(0, 7),
    revenue: base,
    expenses: Math.round(base * 0.42),
    profit: Math.round(base * 0.58),
  };
});

export default function AdminFinancePage() {
  const [mounted, setMounted] = useState(false);
  const [createdInvoices, setCreatedInvoices] = useState<InvoiceDoc[]>([]);
  const [creatorOpen, setCreatorOpen] = useState<{ type: 'invoice' | 'payment_request' } | null>(null);
  const [toast, setToast] = useState('');

  // Date range custom
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setMounted(true);
    const refresh = () => setCreatedInvoices(listInvoices());
    refresh();
    return subscribeInvoices(refresh);
  }, []);

  if (!mounted) return null;

  // Merge seed + créées dynamiquement
  const allInvoices: MockInvoice[] = [
    ...createdInvoices.map((i) => ({
      id: i.id,
      client: i.clientBrand,
      amount: computeTotals(i.lines, i.vatRate).total,
      issuedAt: i.issuedAt.slice(0, 10),
      dueAt: i.dueAt.slice(0, 10),
      status: i.status === 'sent' ? 'pending' as const : i.status,
    })),
    ...SEED_INVOICES,
  ];

  // Filter by date range
  const fromTs = new Date(dateFrom).getTime();
  const toTs = new Date(dateTo).getTime() + 86400000; // inclusive
  const filteredInvoices = allInvoices.filter((inv) => {
    const t = new Date(inv.issuedAt).getTime();
    return t >= fromTs && t <= toTs;
  });

  const filteredMonthly = MONTHLY.filter((m) => {
    const t = new Date(m.monthFull + '-15').getTime();
    return t >= fromTs && t <= toTs;
  });

  const lastMonth = filteredMonthly[filteredMonthly.length - 2] || MONTHLY[MONTHLY.length - 2];
  const thisMonth = filteredMonthly[filteredMonthly.length - 1] || MONTHLY[MONTHLY.length - 1];
  const monthDelta = lastMonth ? Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100) : 0;

  const cashPosition = 47820;
  const MRR = CLIENTS.length * 2933;
  const outstandingAmount = filteredInvoices.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const overdueAmount = filteredInvoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const setRangePreset = (key: 'this_month' | 'last_month' | 'last_3m' | 'last_6m' | 'ytd' | '12m') => {
    const now = new Date();
    let from: Date;
    let to = new Date(now);
    if (key === 'this_month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (key === 'last_month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (key === 'last_3m') {
      from = new Date(now); from.setMonth(from.getMonth() - 3);
    } else if (key === 'last_6m') {
      from = new Date(now); from.setMonth(from.getMonth() - 6);
    } else if (key === 'ytd') {
      from = new Date(now.getFullYear(), 0, 1);
    } else {
      from = new Date(now); from.setMonth(from.getMonth() - 12);
    }
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
  };

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin · Finance</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Trésorerie & <span className="text-gradient">facturation</span>
          </h1>
          <p className="text-white/60 mt-2">Vue d'ensemble cash flow, factures et paiements à venir.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCreatorOpen({ type: 'invoice' })}
            className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-white transition-colors"
          >
            <Plus size={16} /> Créer une facture
          </button>
          <button
            onClick={() => setCreatorOpen({ type: 'payment_request' })}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-lilac/40 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Send size={16} /> Demander un paiement
          </button>
        </div>
      </div>

      {/* Date range custom */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-white/50 shrink-0">Période</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-lilac/50" />
          <span className="text-white/40">→</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-lilac/50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { k: 'this_month', l: 'Ce mois' },
            { k: 'last_month', l: 'Mois dernier' },
            { k: 'last_3m', l: '3 derniers mois' },
            { k: 'last_6m', l: '6 derniers mois' },
            { k: 'ytd', l: 'Depuis janvier' },
            { k: '12m', l: '12 mois' },
          ] as const).map((p) => (
            <button
              key={p.k}
              onClick={() => setRangePreset(p.k)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] border border-white/10 hover:border-lilac/40 text-white/70 hover:text-white transition-colors"
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Trésorerie" value={formatCurrency(cashPosition)} delta={monthDelta} icon={Wallet} accent="green" />
        <StatCard label="MRR" value={formatCurrency(MRR)} delta={12} icon={TrendingUp} accent="lilac" />
        <StatCard label="À encaisser" value={formatCurrency(outstandingAmount)} icon={Clock} accent="amber" />
        <StatCard label="En retard" value={formatCurrency(overdueAmount)} icon={AlertCircle} accent="pink" />
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <DollarSign size={18} className="text-lilac" /> Revenus sur la période
            </h3>
            <p className="text-sm text-white/50 mt-1">{filteredMonthly.length} mois · revenus vs charges</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold">{formatCurrency(thisMonth.revenue)}</div>
            <div className={`text-xs font-semibold inline-flex items-center gap-0.5 ${monthDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthDelta >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {monthDelta >= 0 ? '+' : ''}{monthDelta}% vs mois -1
            </div>
          </div>
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={filteredMonthly.length > 0 ? filteredMonthly : MONTHLY} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B794E8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#B794E8" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="exp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(183,148,232,0.3)', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="revenue" name="Revenus" fill="url(#rev-grad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Charges" fill="url(#exp-grad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Paiements attendus" icon={Clock} subtitle={`${UPCOMING_PAYMENTS.length} échéances`}>
          <ul className="space-y-2">
            {UPCOMING_PAYMENTS.map((p) => {
              const days = Math.ceil((new Date(p.expectedAt).getTime() - Date.now()) / 86400000);
              return (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <div>
                    <div className="font-medium text-sm">{p.client}</div>
                    <div className="text-xs text-white/50">
                      {p.type === 'monthly' ? '🔁 Mensuel' : p.type === 'project' ? '📦 Projet' : '💼 Commission'}
                      {' · '}
                      {new Date(p.expectedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">{formatCurrency(p.amount)}</div>
                    <div className={`text-xs ${days < 0 ? 'text-red-400' : days < 7 ? 'text-amber-400' : 'text-white/50'}`}>
                      {days < 0 ? `Retard ${Math.abs(days)}j` : days === 0 ? "aujourd'hui" : `dans ${days}j`}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Actions rapides" icon={Receipt}>
          <div className="space-y-3">
            <button
              onClick={() => setCreatorOpen({ type: 'invoice' })}
              className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-lilac/40 bg-white/[0.02] hover:bg-lilac/5 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Créer une facture</span>
                <FileText size={16} className="text-lilac group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs text-white/50">Génère un PDF + envoie au client par email.</p>
            </button>
            <button
              onClick={() => setCreatorOpen({ type: 'payment_request' })}
              className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-lilac/40 bg-white/[0.02] hover:bg-lilac/5 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Demander un paiement</span>
                <Send size={16} className="text-lilac group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs text-white/50">Demande proforma avec date limite et lien de paiement.</p>
            </button>
          </div>
        </Card>
      </div>

      {/* Factures détaillées */}
      <Card title="Historique factures" icon={FileText} subtitle={`${filteredInvoices.length} sur la période`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-white/40">
              <tr className="border-b border-white/5">
                <th className="text-left p-3 font-normal">N°</th>
                <th className="text-left p-3 font-normal">Client</th>
                <th className="text-left p-3 font-normal">Émise le</th>
                <th className="text-left p-3 font-normal">Échéance</th>
                <th className="text-right p-3 font-normal">Montant</th>
                <th className="text-left p-3 font-normal">Statut</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const created = createdInvoices.find((c) => c.id === inv.id);
                return (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-xs">{inv.id}</td>
                    <td className="p-3 font-medium">{inv.client}</td>
                    <td className="p-3 text-white/60">{new Date(inv.issuedAt).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-white/60">{new Date(inv.dueAt).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                        inv.status === 'paid' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                        inv.status === 'overdue' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                        inv.status === 'pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                        'text-white/60 bg-white/5 border-white/10'
                      }`}>
                        {inv.status === 'paid' && <CheckCircle2 size={10} />}
                        {inv.status === 'overdue' && <AlertCircle size={10} />}
                        {inv.status === 'pending' && <Clock size={10} />}
                        {inv.status === 'paid' ? 'Payée' : inv.status === 'overdue' ? 'En retard' : inv.status === 'pending' ? 'En attente' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {created && (
                        <button
                          onClick={() => downloadPDF(created)}
                          className="text-xs text-lilac hover:underline inline-flex items-center gap-1"
                          title="Télécharger PDF"
                        >
                          <Download size={12} /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {creatorOpen && (
        <InvoiceCreator
          open={true}
          type={creatorOpen.type}
          onClose={() => setCreatorOpen(null)}
          onSent={() => showToast(`${creatorOpen.type === 'invoice' ? 'Facture' : 'Demande de paiement'} envoyée au client par email`)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500/15 border border-green-500/30 text-green-300 px-5 py-3 rounded-xl shadow-2xl text-sm inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}
    </main>
  );
}
