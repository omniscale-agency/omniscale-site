'use client';
import { Calendar, Trash2, BadgePlus } from 'lucide-react';
import { Event, deleteEvent } from '@/lib/sharedStore';
import Card from '@/components/dashboard/Card';

export default function ClientEventsCard({
  mockEvents,
  extraEvents,
}: {
  mockEvents: Array<{ id: string; title: string; startsAt: string; duration: number; with?: string }>;
  extraEvents: Event[];
}) {
  const all = [
    ...extraEvents.map((e) => ({ ...e, fromDB: true })),
    ...mockEvents.map((e) => ({ ...e, fromDB: false })),
  ].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const onDelete = async (id: string, title: string, fromDB: boolean) => {
    if (!fromDB) return;
    if (!confirm(`Annuler le RDV "${title}" ? Le client le verra disparaître de son agenda immédiatement.`)) return;
    await deleteEvent(id);
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
            const d = new Date(e.startsAt);
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
                {e.fromDB && (
                  <button
                    onClick={() => onDelete(e.id, e.title, e.fromDB)}
                    className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                    title="Annuler le RDV"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
