'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckSquare, Calendar, Send, Mail } from 'lucide-react';
import { addTodo, addEvent } from '@/lib/sharedStore';
import { CLIENTS } from '@/lib/mockData';

type Mode = 'todo' | 'event' | null;

export default function SendActionsBar({ slug, brand }: { slug: string; brand: string }) {
  const [mode, setMode] = useState<Mode>(null);
  const [sentMessage, setSentMessage] = useState('');
  const clientEmail = CLIENTS.find((c) => c.slug === slug)?.contact.email || '';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMode('todo')}
          className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-white transition-colors"
        >
          <Plus size={16} /> Envoyer une tâche
        </button>
        <button
          onClick={() => setMode('event')}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-white/10 hover:border-lilac/40 transition-colors"
        >
          <Calendar size={16} /> Planifier un RDV
        </button>
      </div>

      <AnimatePresence>
        {sentMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 bg-green-500/15 border border-green-500/30 text-green-300 px-5 py-3 rounded-xl shadow-2xl text-sm max-w-sm"
          >
            <div className="flex items-start gap-2">
              <Send size={14} className="mt-0.5 shrink-0" />
              <div>
                <div>{sentMessage}</div>
                {clientEmail && (
                  <div className="text-xs text-green-300/70 mt-0.5 inline-flex items-center gap-1">
                    <Mail size={10} /> Email envoyé à {clientEmail}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setMode(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-black border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-xl flex items-center gap-2">
                  {mode === 'todo' ? <><CheckSquare size={20} className="text-lilac" /> Nouvelle tâche</> : <><Calendar size={20} className="text-lilac" /> Nouveau RDV</>}
                </h3>
                <button onClick={() => setMode(null)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-white/50 mb-5">
                Envoyée immédiatement à <span className="text-lilac">{brand}</span>
              </p>

              {mode === 'todo' ? (
                <TodoForm
                  slug={slug}
                  onSent={(title) => { setSentMessage(`Tâche "${title}" envoyée à ${brand}`); setMode(null); setTimeout(() => setSentMessage(''), 3500); }}
                />
              ) : (
                <EventForm
                  slug={slug}
                  onSent={(title) => { setSentMessage(`RDV "${title}" planifié avec ${brand}`); setMode(null); setTimeout(() => setSentMessage(''), 3500); }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TodoForm({ slug, onSent }: { slug: string; onSent: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('Le client');
  const [priority, setPriority] = useState<'low' | 'med' | 'high'>('med');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTodo(slug, { title: title.trim(), done: false, dueDate: dueDate || undefined, assignee, priority });
    onSent(title.trim());
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titre de la tâche">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
          placeholder="Ex: Valider le brief shooting"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Échéance">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm text-white" />
        </Field>
        <Field label="Priorité">
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'med' | 'high')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm">
            <option value="low">Basse</option>
            <option value="med">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </Field>
      </div>

      <Field label="Pour qui">
        <input value={assignee} onChange={(e) => setAssignee(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm" />
      </Field>

      <button type="submit" className="w-full bg-lilac text-ink font-semibold py-3 rounded-lg hover:bg-white transition-colors inline-flex items-center justify-center gap-2">
        <Send size={16} /> Envoyer la tâche
      </button>
    </form>
  );
}

function EventForm({ slug, onSent }: { slug: string; onSent: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(45);
  const [type, setType] = useState<'call' | 'shooting' | 'review' | 'workshop'>('call');
  const [withWho, setWithWho] = useState('Antoine');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const startsAt = new Date(`${date}T${time}:00`).toISOString();
    await addEvent(slug, { title: title.trim(), startsAt, duration, type, with: withWho });
    onSent(title.trim());
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Titre du RDV">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
          placeholder="Ex: Point hebdo stratégie"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm text-white" />
        </Field>
        <Field label="Heure">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm text-white" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Durée (min)">
          <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 45)} min={15} step={15}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm" />
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as 'call' | 'shooting' | 'review' | 'workshop')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm">
            <option value="call">Appel visio</option>
            <option value="shooting">Shooting</option>
            <option value="review">Revue</option>
            <option value="workshop">Atelier</option>
          </select>
        </Field>
      </div>

      <Field label="Avec">
        <input value={withWho} onChange={(e) => setWithWho(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm" />
      </Field>

      <button type="submit" className="w-full bg-lilac text-ink font-semibold py-3 rounded-lg hover:bg-white transition-colors inline-flex items-center justify-center gap-2">
        <Send size={16} /> Planifier le RDV
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
