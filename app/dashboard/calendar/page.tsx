'use client';
import { useEffect, useState } from 'react';
import { Calendar, Video, Users, Sparkles, ExternalLink, CalendarPlus } from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { ClientData, getClientBySlug } from '@/lib/mockData';
import { fetchEvents, subscribeClientChanges, Event } from '@/lib/sharedStore';
import { markSeen } from '@/lib/notifications';
import RoleGate from '@/components/RoleGate';
import EmptyState from '@/components/dashboard/EmptyState';
import { BOOKING_URL } from '@/lib/config';

const TYPE_ICONS = { call: Video, shooting: Sparkles, review: Calendar, workshop: Users };
const TYPE_LABELS = { call: 'Appel visio', shooting: 'Shooting', review: 'Revue', workshop: 'Atelier' };

/** Génère un lien "Ajouter à Google Calendar" qui ouvre le wizard Google avec event pré-rempli */
function buildGoogleCalendarUrl(event: { title: string; startsAt: string; duration: number; with?: string; type?: string }): string {
  try {
    const start = new Date(event.startsAt);
    const end = new Date(start.getTime() + event.duration * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Omniscale — ${event.title}`);
    url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`);
    const details = `${TYPE_LABELS[event.type as keyof typeof TYPE_LABELS] || 'Événement'} avec ${event.with || 'Omniscale'}.\n\nLien visio envoyé par email avant le RDV.\n\nDes questions ? contact@omniscale.fr`;
    url.searchParams.set('details', details);
    return url.toString();
  } catch {
    return '#';
  }
}

export default function CalendarPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [extras, setExtras] = useState<Event[]>([]);
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
    const refresh = async () => {
      setExtras(await fetchEvents(slug));
      markSeen('events', slug);
    };
    refresh();
    return subscribeClientChanges(slug, refresh);
  }, [slug]);

  if (!loaded || !session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Agenda et rendez-vous"><></></RoleGate>;
  }

  const allEvents = [...extras, ...(client?.upcomingEvents || [])].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Agenda</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Prochains rendez-vous</h1>
          <p className="text-white/60 mt-2">Tu peux ajouter chaque RDV à ton Google Calendar en un clic.</p>
        </div>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm bg-lilac text-ink font-semibold px-4 py-2.5 rounded-lg hover:bg-white transition-colors"
        >
          <CalendarPlus size={16} /> Réserver un RDV
        </a>
      </div>

      {allEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucun rendez-vous pour l'instant"
          description="Réserve un appel découverte avec un closer Omniscale. Tu pourras ensuite ajouter chaque RDV à ton Google Calendar en un clic."
          cta={{ label: 'Réserver un appel', href: BOOKING_URL }}
        />
      ) : (
        <div className="space-y-3">
          {allEvents.map((e) => {
            const Icon = TYPE_ICONS[e.type as keyof typeof TYPE_ICONS] || Calendar;
            const d = new Date(e.startsAt);
            const gcal = buildGoogleCalendarUrl(e);
            return (
              <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col sm:flex-row sm:items-center gap-5 hover:border-lilac/30 transition-colors">
                <div className="text-center w-16 shrink-0 rounded-xl bg-lilac/10 border border-lilac/30 py-2">
                  <div className="font-display font-bold text-2xl leading-none text-lilac">{d.toLocaleDateString('fr-FR', { day: '2-digit' })}</div>
                  <div className="text-[10px] uppercase text-white/60 mt-1">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-widest text-lilac inline-flex items-center gap-1">
                      <Icon size={12} /> {TYPE_LABELS[e.type as keyof typeof TYPE_LABELS] || 'Événement'}
                    </span>
                  </div>
                  <div className="font-display font-bold text-lg">{e.title}</div>
                  <div className="text-sm text-white/60 mt-1">
                    {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {e.duration} min · avec {e.with}
                  </div>
                </div>
                <a
                  href={gcal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm bg-white/5 border border-white/10 hover:border-lilac/40 hover:bg-lilac/10 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <ExternalLink size={14} /> Ajouter à Google Calendar
                </a>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
