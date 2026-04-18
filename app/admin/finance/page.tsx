'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Wallet, TrendingUp, FileText, AlertCircle, CheckCircle2,
  Clock, DollarSign, Receipt, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { CLIENTS, formatCurrency } from '@/lib/mockData';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
}

interface Payment {
  id: string;
  client: string;
  amount: number;
  expectedAt: string;
  type: 'monthly' | 'project' | 'commission';
}

const INVOICES: Invoice[] = [
  { id: 'F-2026-042', client: 'Maison Léa', amount: 2500, issuedAt: '2026-04-01', dueAt: '2026-04-30', status: 'pending' },
  { id: 'F-2026-041', client: 'Trattoria Sole', amount: 1800, issuedAt: '2026-04-01', dueAt: '2026-04-30', status: 'paid' },
  { id: 'F-2026-040', client: 'Glow Cosmetics', amount: 4500, issuedAt: '2026-04-01', dueAt: '2026-04-15', status: 'paid' },
  { id: 'F-2026-039', client: 'Atelier Brut', amount: 2200, issuedAt: '2026-03-15', dueAt: '2026-04-14', status: 'overdue' },
  { id: 'F-2026-038', client: 'Maison Léa', amount: 2500, issuedAt: '2026-03-01', dueAt: '2026-03-31', status: 'paid' },
  { id: 'F-2026-037', client: 'Trattoria Sole', amount: 1800, issuedAt: '2026-03-01', dueAt: '2026-03-31', status: 'paid' },
  { id: 'F-2026-036', client: 'Glow Cosmetics', amount: 4500, issuedAt: '2026-03-01', dueAt: '2026-03-15', status: 'paid' },
];

const UPCOMING_PAYMENTS: Payment[] = [
  { id: 'p1', client: 'Maison Léa', amount: 2500, expectedAt: '2026-04-30', type: 'monthly' },
  { id: 'p2', client: 'Glow Cosmetics', amount: 4500, expectedAt: '2026-05-01', type: 'monthly' },
  { id: 'p3', client: 'Trattoria Sole', amount: 1800, expectedAt: '2026-05-01', type: 'monthly' },
  { id: 'p4', client: 'Atelier Brut', amount: 2200, expectedAt: '2026-04-14', type: 'monthly' },
  { id: 'p5', client: 'Glow Cosmetics', amount: 6000, expectedAt: '2026-05-15', type: 'project' },
];

const NEXT_INVOICES_TO_SEND = [
  { client: 'Maison Léa', amount: 2500, dueOn: '2026-05-01' },
  { client: 'Trattoria Sole', amount: 1800, dueOn: '2026-05-01' },
  { client: 'Glow Cosmetics', amount: 4500, dueOn: '2026-05-01' },
];

// Historique mensuel mock (12 mois)
const MONTHLY = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (11 - i));
  const base = 8000 + i * 800 + Math.round((Math.sin(i) + 1) * 1500);
  return {
    month: d.toLocaleDateString('fr-FR', { month: 'short' }),
    revenue: base,
    expenses: Math.round(base * 0.42),
    profit: Math.round(base * 0.58),
  };
});

const MRR = CLIENTS.length * 2933; // moyenne facturation mensuelle
const cashPosition = 47820;
const outstandingAmount = INVOICES.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
const overdueAmount = INVOICES.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

export default function AdminFinancePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const lastMonth = MONTHLY[MONTHLY.length - 2];
  const thisMonth = MONTHLY[MONTHLY.length - 1];
  const monthDelta = Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin · Finance</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Trésorerie & <span className="text-gradient">facturation</span>
        </h1>
        <p className="text-white/60 mt-2">Vue d'ensemble cash flow, factures et paiements à venir.</p>
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
              <DollarSign size={18} className="text-lilac" /> Revenus 12 derniers mois
            </h3>
            <p className="text-sm text-white/50 mt-1">Revenus vs charges, par mois</p>
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
            <BarChart data={MONTHLY} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
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
              <Bar dataKey="revenue" fill="url(#rev-grad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="url(#exp-grad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Paiements à venir */}
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
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
            <span className="text-white/60">Total attendu</span>
            <span className="font-mono font-bold text-lilac">{formatCurrency(UPCOMING_PAYMENTS.reduce((s, p) => s + p.amount, 0))}</span>
          </div>
        </Card>

        {/* Factures à émettre */}
        <Card title="Factures à émettre" icon={Receipt} subtitle={`${NEXT_INVOICES_TO_SEND.length} en préparation`}>
          <ul className="space-y-2">
            {NEXT_INVOICES_TO_SEND.map((inv, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div>
                  <div className="font-medium text-sm">{inv.client}</div>
                  <div className="text-xs text-white/50">À émettre le {new Date(inv.dueOn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{formatCurrency(inv.amount)}</span>
                  <button className="bg-lilac text-ink text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
                    Émettre
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
            <span className="text-white/60">Total à émettre</span>
            <span className="font-mono font-bold text-lilac">{formatCurrency(NEXT_INVOICES_TO_SEND.reduce((s, p) => s + p.amount, 0))}</span>
          </div>
        </Card>
      </div>

      {/* Factures détaillées */}
      <Card title="Historique factures" icon={FileText}>
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
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/50 text-center">
        🔌 Connexion Stripe / banque (Bridge / Tink) à brancher en phase 2 pour la trésorerie temps réel.
      </div>
    </main>
  );
}
