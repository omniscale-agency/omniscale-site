'use client';
import { useState } from 'react';
import { Calendar, Trash2, BadgePlus, Pencil, Check, X, ExternalLink } from 'lucide-react';
import { Event, deleteEvent, updateEvent } from '@/lib/sharedStore';
import { sendEmail } from '@/lib/sendEmail';
import { buildGCalUrl } from '@/lib/emailTemplates';
import Card from '@/components/dashboard/Card';

export default function ClientEventsCard({
  mockEvents,
  extraEvents,
  clientEmail = '',
  clientName = '',
}: {
  mockEvents: Array<{ id: string; title: string; startsAt: string; duration: number; with?: string; type?: string }>;
  extraEvents: Event[];
  clientEmail?: string;
  clientName?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const all = [
    ...extraEvents.map((e) => ({ ...e, fromDB: true })),
    ...mockEvents.map((e) => ({ ...e, fromDB: false })),
  ].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const onDelete = async (id: string, title: string, startsAt: string, fromDB: boolean) => {
    if (!fromDB) return;
    if (!confirm(`Annuler le RDV "${title}" ? Le client le verra disparaître de son agenda et recevra un email d'annulation.`)) return;
    await deleteEvent(id);
    if (clientEmail) {
      sendEmail('event_cancelled', clientEmail, { clientName: clientName || 'toi', eventTitle: title, startsAt }).catch(() => {});
    }
  };

  return (
    <Card title="Prochains RDV" icon={Calendar} subtitle={`${extraEvents.length} planifié(s) par toi`}>
      {all.length === 0 ? (
        <div className="text-sm text-white/50 italic py-4 text-center">
          Aucun RDV planifié. Utilise « Planifier un RDV » en haut à droite.
        </div>
      ) : (
        <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {all.map((e) => {
            if (editingId === e.id && e.fromDB) {
              return (
                <li key={e.id}>
                  <EventEditForm
                    event={e as Event}
                    onCancel={() => setEditingId(null)}
                    onSave={async (patch) => {
                      await updateEvent(e.id, patch);
                      setEditingId(null);
                    }}
                  />
                </li>
              );
            }
            const d = new Date(e.startsAt);
            const gcal = buildGCalUrl({ eventTitle: e.title, startsAt: e.startsAt, duration: e.duration, with: e.with, type: e.type });
            return (
              <li
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] group"
              >
                <div className="text-center w-12 shrink-0 rounded-lg bg-lilac/10 border border-lilac/30 py-1.5">
                  <div className="font-display font-bold text-lg leading-none text-lilac">
                    {d.toLocaleDateString('fr-FR', { day: '2-digit' })}
                  </div>
                  <div className="text-[10px] uppercase text-white/60">
                    {d.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    {e.fromDB && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-lilac/20 text-lilac uppercase font-semibold inline-flex items-center gap-1">
                        <BadgePlus size={9} /> Envoyé
                      </span>
                    )}
                    <span>{e.title}</span>
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {e.duration} min
                  </div>
                  {e.with && <div className="text-xs text-white/40">avec {e.with}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0 self-center">
                  <a
                    href={gcal}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ajouter à Google Calendar"
                    className="p-1.5 rounded-lg text-white/30 hover:text-lilac hover:bg-lilac/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink size={13} />
                  </a>
                  {e.fromDB && (
                    <>
                      <button
                        onClick={() => setEditingId(e.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Modifier"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(e.id, e.title, e.startsAt, e.fromDB)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Annuler le RDV"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function EventEditForm({
  event, onCancel, onSave,
}: {
  event: Event;
  onCancel: () => void;
  onSave: (patch: Partial<Omit<Event, 'id' | 'createdAt' | 'clientSlug'>>) => Promise<void>;
}) {
  const d = new Date(event.startsAt);
  const datePart = d.toISOString().slice(0, 10);
  const timePart = d.toTimeString().slice(0, 5);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(datePart);
  const [time, setTime] = useState(timePart);
  const [duration, setDuration] = useState(event.duration);
  const [type, setType] = useState<Event['type']>(event.type);
  const [withWho, setWithWho] = useState(event.with || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setBusy(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      await onSave({ title: title.trim(), startsAt, duration, type, with: withWho });
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm';

  return (
    <form onSubmit={submit} className="rounded-xl border border-lilac/30 bg-lilac/5 p-3 space-y-2.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' text-white'} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls + ' text-white'} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          value={duration}
          min={15}
          step={15}
          onChange={(e) => setDuration(parseInt(e.target.value) || 45)}
          className={inputCls}
        />
        <select value={type} onChange={(e) => setType(e.target.value as Event['type'])} className={inputCls}>
          <option value="call">Appel visio</option>
          <option value="shooting">Shooting</option>
          <option value="review">Revue</option>
          <option value="workshop">Atelier</option>
        </select>
        <input
          value={withWho}
          onChange={(e) => setWithWho(e.target.value)}
          placeholder="Avec"
          className={inputCls}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-2 rounded-lg text-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          <Check size={14} /> Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>
    </form>
  );
}
