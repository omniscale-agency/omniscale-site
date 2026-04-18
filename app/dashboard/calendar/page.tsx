'use client';
import { useEffect, useState } from 'react';
import { Calendar, Video, Users, Sparkles, ExternalLink } from 'lucide-react';
import { getSession, Session } from '@/lib/auth';
import { CLIENTS, ClientData, getClientBySlug } from '@/lib/mockData';
import { getExtraEvents, subscribe } from '@/lib/sharedStore';
import RoleGate from '@/components/RoleGate';

const TYPE_ICONS = {
  call: Video,
  shooting: Sparkles,
  review: Calendar,
  workshop: Users,
};

const TYPE_LABELS = {
  call: 'Appel visio',
  shooting: 'Shooting',
  review: 'Revue',
  workshop: 'Atelier',
};

export default function CalendarPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [extras, setExtras] = useState<ClientData['upcomingEvents']>([]);

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    setSession(s);
    setClient((s.clientSlug && getClientBySlug(s.clientSlug)) || CLIENTS[0]);
  }, []);

  useEffect(() => {
    if (!client) return;
    const refresh = () => setExtras(getExtraEvents(client.slug));
    refresh();
    return subscribe(refresh);
  }, [client]);

  if (!client) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session?.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Agenda et rendez-vous"><></></RoleGate>;
  }

  const allEvents = [...extras, ...client.upcomingEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Agenda</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Prochains rendez-vous</h1>
          <p className="text-white/60 mt-2">Synchronisé avec Google Calendar</p>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-lilac border border-white/15 hover:border-lilac/40 px-4 py-2 rounded-lg transition-colors"
        >
          <ExternalLink size={14} /> Ouvrir Google Calendar
        </a>
      </div>

      <div className="space-y-3">
        {allEvents.map((e) => {
          const Icon = TYPE_ICONS[e.type];
          const d = new Date(e.startsAt);
          return (
            <div
              key={e.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-5 hover:border-lilac/30 transition-colors"
            >
              <div className="text-center w-16 shrink-0 rounded-xl bg-lilac/10 border border-lilac/30 py-2">
                <div className="font-display font-bold text-2xl leading-none text-lilac">
                  {d.toLocaleDateString('fr-FR', { day: '2-digit' })}
                </div>
                <div className="text-[10px] uppercase text-white/60 mt-1">
                  {d.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-widest text-lilac inline-flex items-center gap-1">
                    <Icon size={12} /> {TYPE_LABELS[e.type]}
                  </span>
                </div>
                <div className="font-display font-bold text-lg">{e.title}</div>
                <div className="text-sm text-white/60 mt-1">
                  {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {e.duration} min · avec {e.with}
                </div>
              </div>

              <button className="bg-lilac text-ink font-medium px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors">
                Rejoindre
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/50">
        🔌 Synchronisation Google Calendar à brancher (OAuth) — phase 2.
      </div>
    </main>
  );
}
