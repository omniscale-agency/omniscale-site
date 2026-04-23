'use client';
import { useEffect, useState } from 'react';
import { Target, Trophy } from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { ClientData, getClientBySlug, formatCurrency } from '@/lib/mockData';
import { fetchObjectives, subscribeObjectives, Objective } from '@/lib/objectivesStore';
import RoleGate from '@/components/RoleGate';
import EmptyState from '@/components/dashboard/EmptyState';

interface UnifiedObjective {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
}

export default function ObjectivesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [dbObjectives, setDbObjectives] = useState<Objective[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (!s) return;
      setSession(s);
      setClient((s.clientSlug && getClientBySlug(s.clientSlug)) || null);
      setLoaded(true);
    });
  }, []);

  const slug = client?.slug || (session?.userId ? `user-${session.userId}` : '');

  useEffect(() => {
    if (!slug) return;
    const refresh = async () => setDbObjectives(await fetchObjectives(slug));
    refresh();
    return subscribeObjectives(slug, refresh);
  }, [slug]);

  if (!loaded || !session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Objectifs trimestriels"><></></RoleGate>;
  }

  // Les objectifs DB (envoyés par admin) ont la priorité. Le mock n'apparaît
  // que si AUCUN objectif n'a encore été défini en DB pour les clients avec mock binding.
  const unified: UnifiedObjective[] = dbObjectives.length > 0
    ? dbObjectives.map((o) => ({ id: o.id, label: o.label, current: o.current, target: o.target, unit: o.unit }))
    : (client?.objectives || []).map((o, i) => ({ id: `mock-${i}`, ...o }));

  if (unified.length === 0) {
    return (
      <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Objectifs</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Tes objectifs trimestriels</h1>
          <p className="text-white/60 mt-2">Co-construits avec ton account manager.</p>
        </div>
        <EmptyState
          icon={Target}
          title="Pas encore d'objectifs définis"
          description="Tes objectifs (CA, abonnés, ROAS, nombre de RDV…) seront fixés ensemble avec ton account manager Omniscale lors du premier appel d'onboarding. Ils apparaîtront ici en temps réel."
          cta={{ label: 'Réserver mon onboarding', href: '/dashboard/calendar' }}
        />
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2 inline-flex items-center gap-2">
          Objectifs
          {dbObjectives.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Tes objectifs trimestriels</h1>
        <p className="text-white/60 mt-2">Définis avec ton closer · Mis à jour en temps réel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {unified.map((o) => {
          const pct = Math.min(100, Math.round((o.current / Math.max(1, o.target)) * 100));
          const reached = pct >= 100;
          const fmt = (n: number) => o.unit === '€'
            ? formatCurrency(n)
            : `${n}${o.unit ? ' ' + o.unit : ''}`;
          return (
            <div key={o.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center">
                  {reached ? <Trophy className="text-lilac" size={18} /> : <Target className="text-lilac" size={18} />}
                </div>
                <div className={`text-sm font-semibold ${reached ? 'text-green-400' : 'text-lilac'}`}>{pct}%</div>
              </div>
              <div className="font-display font-bold text-lg mb-1">{o.label}</div>
              <div className="text-sm text-white/60 mb-4">
                <span className="text-white">{fmt(o.current)}</span>
                <span className="text-white/40"> / {fmt(o.target)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${reached ? 'bg-green-400' : 'bg-gradient-to-r from-lilac to-omni-400'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
