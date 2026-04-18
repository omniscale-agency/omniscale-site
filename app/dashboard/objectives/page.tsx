'use client';
import { useEffect, useState } from 'react';
import { Target, Trophy } from 'lucide-react';
import { getSession, Session } from '@/lib/auth';
import { CLIENTS, ClientData, getClientBySlug, formatCurrency } from '@/lib/mockData';
import RoleGate from '@/components/RoleGate';

export default function ObjectivesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  useEffect(() => {
    const s = getSession();
    if (!s) return;
    setSession(s);
    setClient((s.clientSlug && getClientBySlug(s.clientSlug)) || CLIENTS[0]);
  }, []);

  if (!client) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session?.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Objectifs trimestriels"><></></RoleGate>;
  }

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Objectifs</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Tes objectifs trimestriels</h1>
        <p className="text-white/60 mt-2">Définis avec ton closer · Mis à jour en temps réel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {client.objectives.map((o) => {
          const pct = Math.min(100, Math.round((o.current / o.target) * 100));
          const reached = pct >= 100;
          return (
            <div key={o.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center">
                  {reached ? <Trophy className="text-lilac" size={18} /> : <Target className="text-lilac" size={18} />}
                </div>
                <div className={`text-sm font-semibold ${reached ? 'text-green-400' : 'text-lilac'}`}>{pct}%</div>
              </div>
              <div className="font-display font-bold text-lg mb-1">{o.label}</div>
              <div className="text-sm text-white/60 mb-4">
                <span className="text-white">{o.unit === '€' ? formatCurrency(o.current) : `${o.current}${o.unit}`}</span>
                <span className="text-white/40"> / {o.unit === '€' ? formatCurrency(o.target) : `${o.target}${o.unit}`}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${reached ? 'bg-green-400' : 'bg-gradient-to-r from-lilac to-omni-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
