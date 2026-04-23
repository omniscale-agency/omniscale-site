'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Video, Sparkles, Users, Eye,
  ExternalLink, Trash2, Pencil, Clock,
} from 'lucide-react';
import {
  fetchAllEvents, subscribeAllEvents, deleteEvent, updateEvent, Event,
} from '@/lib/sharedStore';
import { listAllAdminClients, AdminClientRow } from '@/lib/adminClients';
import { sendEmail } from '@/lib/sendEmail';
import { buildGCalUrl } from '@/lib/emailTemplates';
import Card from '@/components/dashboard/Card';

type View = 'month' | 'week' | 'list';

const TYPE_ICON = { call: Video, shooting: Sparkles, review: Eye, workshop: Users };
const TYPE_LABEL: Record<string, string> = { call: 'Visio', shooting: 'Shooting', review: 'Revue', workshop: 'Atelier' };
const TYPE_COLOR: Record<string, string> = {
  call: 'bg-lilac/15 border-lilac/40 text-lilac',
  shooting: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
  review: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  workshop: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<AdminClientRow[]>([]);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [selected, setSelected] = useState<Event | null>(null);

  useEffect(() => {
    const refresh = async () => setEvents(await fetchAllEvents());
    refresh();
    listAllAdminClients().then(setClients);
    return subscribeAllEvents(refresh);
  }, []);

  const clientBySlug = useMemo(() => {
    const map = new Map<string, AdminClientRow>();
    clients.forEach((c) => {
      map.set(c.slug, c);
      if (c.profile?.userId) map.set(`user-${c.profile.userId}`, c);
      if (c.mockData?.slug) map.set(c.mockData.slug, c);
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterClient !== 'all' && e.clientSlug !== filterClient) return false;
      return true;
    });
  }, [events, filterType, filterClient]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    filtered.forEach((e) => {
      const key = new Date(e.startsAt).toDateString();
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    });
    return map;
  }, [filtered]);

  const handleDelete = async (e: Event) => {
    const c = clientBySlug.get(e.clientSlug || '');
    const email = c?.profile?.email || c?.mockData?.contact?.email;
    if (!confirm(`Annuler le RDV "${e.title}" ? ${email ? 'Le client recevra un email d\'annulation.' : ''}`)) return;
    await deleteEvent(e.id);
    if (email) {
      sendEmail('event_cancelled', email, {
        clientName: c?.profile?.name || c?.mockData?.contact?.name || 'toi',
        eventTitle: e.title,
        startsAt: e.startsAt,
      }).catch(() => {});
    }
    setSelected(null);
  };

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Agenda global</h1>
          <p className="text-white/60 mt-2">{events.length} RDV au total · vue d'ensemble de tous les clients</p>
        </div>
        <div className="flex items-center gap-2">
          {(['month', 'week', 'list'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === v ? 'bg-lilac text-ink font-semibold' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Liste'}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-lilac/50"
        >
          <option value="all">Tous les types</option>
          <option value="call">Visio</option>
          <option value="shooting">Shooting</option>
          <option value="review">Revue</option>
          <option value="workshop">Atelier</option>
        </select>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-lilac/50"
        >
          <option value="all">Tous les clients</option>
          {Array.from(clientBySlug.values()).filter((c, i, arr) => arr.findIndex((x) => x.slug === c.slug) === i).map((c) => (
            <option key={c.slug} value={c.mockData?.slug || (c.profile?.userId ? `user-${c.profile.userId}` : c.slug)}>
              {c.brand}
            </option>
          ))}
        </select>
        <span className="text-xs text-white/40 self-center ml-auto">{filtered.length} RDV affichés</span>
      </div>

      {/* Vues */}
      {view === 'month' && (
        <MonthView
          cursor={cursor}
          setCursor={setCursor}
          eventsByDay={eventsByDay}
          clientBySlug={clientBySlug}
          onSelect={setSelected}
        />
      )}
      {view === 'week' && (
        <WeekView
          cursor={cursor}
          setCursor={setCursor}
          eventsByDay={eventsByDay}
          clientBySlug={clientBySlug}
          onSelect={setSelected}
        />
      )}
      {view === 'list' && (
        <ListView events={filtered} clientBySlug={clientBySlug} onSelect={setSelected} />
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          event={selected}
          client={clientBySlug.get(selected.clientSlug || '')}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected)}
          onSave={async (patch) => {
            await updateEvent(selected.id, patch);
            setSelected(null);
          }}
        />
      )}
    </main>
  );
}

function MonthView({
  cursor, setCursor, eventsByDay, clientBySlug, onSelect,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  eventsByDay: Map<string, Event[]>;
  clientBySlug: Map<string, AdminClientRow>;
  onSelect: (e: Event) => void;
}) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const days: Date[] = [];
  let d = gridStart;
  while (d <= monthEnd || days.length % 7 !== 0) {
    days.push(d);
    d = addDays(d, 1);
    if (days.length > 42) break;
  }
  const today = new Date();

  return (
    <Card title={cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
      icon={Calendar}
      action={
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(addDays(monthStart, -1))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-2 py-1 text-xs rounded-md hover:bg-white/10 text-white/60">
            Aujourd'hui
          </button>
          <button onClick={() => setCursor(addDays(monthEnd, 1))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
            <ChevronRight size={16} />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="bg-black/40 text-xs uppercase tracking-widest text-white/40 text-center py-2">{d}</div>
        ))}
        {days.map((day, i) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = sameDay(day, today);
          const dayEvents = eventsByDay.get(day.toDateString()) || [];
          return (
            <div
              key={i}
              className={`bg-black min-h-[110px] p-1.5 ${!inMonth ? 'opacity-40' : ''}`}
            >
              <div className={`text-xs font-mono mb-1 ${isToday ? 'text-lilac font-bold' : 'text-white/50'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => {
                  const c = clientBySlug.get(e.clientSlug || '');
                  return (
                    <button
                      key={e.id}
                      onClick={() => onSelect(e)}
                      className={`w-full text-left text-[10px] px-1.5 py-1 rounded border truncate hover:opacity-80 transition-opacity ${TYPE_COLOR[e.type] || 'bg-white/5 border-white/10'}`}
                      title={`${e.title} — ${c?.brand || 'inconnu'}`}
                    >
                      <span className="font-mono">{new Date(e.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="ml-1 truncate">{e.title}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-white/40 px-1">+{dayEvents.length - 3} autre(s)</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function WeekView({
  cursor, setCursor, eventsByDay, clientBySlug, onSelect,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  eventsByDay: Map<string, Event[]>;
  clientBySlug: Map<string, AdminClientRow>;
  onSelect: (e: Event) => void;
}) {
  const weekStart = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[6];
  const today = new Date();

  return (
    <Card title={`Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
      icon={Calendar}
      action={
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(addDays(weekStart, -7))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-2 py-1 text-xs rounded-md hover:bg-white/10 text-white/60">
            Cette semaine
          </button>
          <button onClick={() => setCursor(addDays(weekStart, 7))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
            <ChevronRight size={16} />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isToday = sameDay(day, today);
          const dayEvents = eventsByDay.get(day.toDateString()) || [];
          return (
            <div key={day.toISOString()} className={`rounded-xl border ${isToday ? 'border-lilac/40 bg-lilac/5' : 'border-white/10 bg-white/[0.02]'} p-2 min-h-[20rem]`}>
              <div className={`text-xs uppercase mb-2 ${isToday ? 'text-lilac font-bold' : 'text-white/40'}`}>
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className={`text-2xl font-display font-bold mb-3 ${isToday ? 'text-lilac' : 'text-white/80'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((e) => {
                  const c = clientBySlug.get(e.clientSlug || '');
                  const Icon = TYPE_ICON[e.type as keyof typeof TYPE_ICON] || Calendar;
                  return (
                    <button
                      key={e.id}
                      onClick={() => onSelect(e)}
                      className={`w-full text-left text-xs p-2 rounded-lg border ${TYPE_COLOR[e.type] || 'bg-white/5 border-white/10'} hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex items-center gap-1 font-mono mb-0.5">
                        <Icon size={10} /> {new Date(e.startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="font-medium truncate">{e.title}</div>
                      <div className="text-[10px] opacity-70 truncate">{c?.brand || '—'}</div>
                    </button>
                  );
                })}
                {dayEvents.length === 0 && <div className="text-[10px] text-white/30 italic">vide</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ListView({
  events, clientBySlug, onSelect,
}: {
  events: Event[];
  clientBySlug: Map<string, AdminClientRow>;
  onSelect: (e: Event) => void;
}) {
  // Groupé par jour, futur d'abord
  const now = Date.now();
  const sorted = [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const upcoming = sorted.filter((e) => new Date(e.startsAt).getTime() >= now - 86400000);
  const past = sorted.filter((e) => new Date(e.startsAt).getTime() < now - 86400000).reverse();

  return (
    <div className="space-y-6">
      <Card title="À venir" icon={Calendar} subtitle={`${upcoming.length} RDV`}>
        {upcoming.length === 0 ? (
          <div className="text-sm text-white/50 italic py-4 text-center">Aucun RDV à venir.</div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <ListRow key={e.id} event={e} client={clientBySlug.get(e.clientSlug || '')} onSelect={onSelect} />
            ))}
          </ul>
        )}
      </Card>
      {past.length > 0 && (
        <Card title="Historique" icon={Clock} subtitle={`${past.length} RDV passés`}>
          <ul className="space-y-2 opacity-60">
            {past.slice(0, 30).map((e) => (
              <ListRow key={e.id} event={e} client={clientBySlug.get(e.clientSlug || '')} onSelect={onSelect} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function ListRow({ event, client, onSelect }: { event: Event; client?: AdminClientRow; onSelect: (e: Event) => void }) {
  const d = new Date(event.startsAt);
  const Icon = TYPE_ICON[event.type as keyof typeof TYPE_ICON] || Calendar;
  return (
    <li>
      <button
        onClick={() => onSelect(event)}
        className="w-full flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-lilac/30 hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="text-center w-14 shrink-0 rounded-lg bg-lilac/10 border border-lilac/30 py-1.5">
          <div className="font-display font-bold text-lg leading-none text-lilac">{d.toLocaleDateString('fr-FR', { day: '2-digit' })}</div>
          <div className="text-[10px] uppercase text-white/60">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${TYPE_COLOR[event.type] || 'bg-white/5 border-white/10'}`}>
              <Icon size={10} /> {TYPE_LABEL[event.type] || event.type}
            </span>
            <span className="font-medium">{event.title}</span>
          </div>
          <div className="text-xs text-white/50">
            {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {event.duration} min · avec {event.with || 'Omniscale'}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium">{client?.brand || '—'}</div>
          <div className="text-xs text-white/40">{client?.profile?.email || client?.mockData?.contact?.email || ''}</div>
        </div>
      </button>
    </li>
  );
}

function DetailModal({
  event, client, onClose, onDelete, onSave,
}: {
  event: Event;
  client?: AdminClientRow;
  onClose: () => void;
  onDelete: () => void;
  onSave: (patch: Partial<Omit<Event, 'id' | 'createdAt' | 'clientSlug'>>) => Promise<void>;
}) {
  const d0 = new Date(event.startsAt);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(d0.toISOString().slice(0, 10));
  const [time, setTime] = useState(d0.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState(event.duration);
  const [type, setType] = useState<Event['type']>(event.type);
  const [withWho, setWithWho] = useState(event.with || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      await onSave({ title: title.trim(), startsAt, duration, type, with: withWho });
    } finally {
      setBusy(false);
    }
  };

  const Icon = TYPE_ICON[event.type as keyof typeof TYPE_ICON] || Calendar;
  const gcal = buildGCalUrl({ eventTitle: event.title, startsAt: event.startsAt, duration: event.duration, with: event.with, type: event.type });
  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-black border border-white/10 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${TYPE_COLOR[event.type] || 'bg-white/5 border-white/10'}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">{editing ? 'Modifier le RDV' : event.title}</div>
              {!editing && <div className="text-xs text-white/50 mt-0.5">{TYPE_LABEL[event.type] || event.type} · {event.duration} min</div>}
            </div>
          </div>
        </div>

        {editing ? (
          <form onSubmit={submit} className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} autoFocus />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' text-white'} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls + ' text-white'} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={duration} min={15} step={15} onChange={(e) => setDuration(parseInt(e.target.value) || 45)} className={inputCls} />
              <select value={type} onChange={(e) => setType(e.target.value as Event['type'])} className={inputCls}>
                <option value="call">Visio</option>
                <option value="shooting">Shooting</option>
                <option value="review">Revue</option>
                <option value="workshop">Atelier</option>
              </select>
              <input value={withWho} onChange={(e) => setWithWho(e.target.value)} placeholder="Avec" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 bg-lilac text-ink font-semibold py-2 rounded-lg text-sm hover:bg-white transition-colors disabled:opacity-50">
                Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10">
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-white/70">
                <Calendar size={14} className="shrink-0 text-lilac" />
                <span className="capitalize">{d0.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {d0.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {event.with && (
                <div className="flex items-center gap-2 text-white/70">
                  <Users size={14} className="shrink-0 text-lilac" />
                  <span>avec {event.with}</span>
                </div>
              )}
              {client && (
                <div className="flex items-center gap-2 text-white/70">
                  <span className="shrink-0 text-lilac w-3.5">●</span>
                  <a href={`/admin/clients/${client.slug}`} className="hover:text-lilac">
                    {client.brand} {client.profile?.email && <span className="text-white/40">· {client.profile.email}</span>}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={gcal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-sm bg-white/5 border border-white/10 text-white/80 hover:border-lilac/40 hover:text-lilac py-2 rounded-lg transition-colors"
              >
                <ExternalLink size={13} /> Google Calendar
              </a>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center gap-1.5 text-sm bg-white/5 border border-white/10 text-white/80 hover:border-lilac/40 hover:text-lilac py-2 rounded-lg transition-colors"
              >
                <Pencil size={13} /> Modifier
              </button>
            </div>
            <button
              onClick={onDelete}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 text-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2 rounded-lg transition-colors"
            >
              <Trash2 size={13} /> Annuler ce RDV
            </button>
          </>
        )}
      </div>
    </div>
  );
}
