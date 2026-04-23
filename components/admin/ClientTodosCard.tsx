'use client';
import { useState } from 'react';
import { CheckSquare, Square, Trash2, BadgePlus, Pencil, Check, X, Clock } from 'lucide-react';
import { Todo, toggleTodo, deleteTodo, updateTodo } from '@/lib/sharedStore';
import { sendEmail } from '@/lib/sendEmail';
import Card from '@/components/dashboard/Card';

export default function ClientTodosCard({
  mockTodos,
  extraTodos,
  clientEmail = '',
  clientName = '',
}: {
  mockTodos: Array<{ id: string; title: string; done: boolean; assignee?: string; dueDate?: string; priority?: string }>;
  extraTodos: Todo[];
  clientEmail?: string;
  clientName?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const all = [
    ...extraTodos.map((t) => ({ ...t, fromDB: true })),
    ...mockTodos.map((t) => ({ ...t, fromDB: false })),
  ];

  const onToggle = async (id: string, fromDB: boolean) => {
    if (!fromDB) return;
    await toggleTodo(id);
  };
  const onDelete = async (id: string, title: string, fromDB: boolean) => {
    if (!fromDB) return;
    if (!confirm(`Annuler la tâche "${title}" ? Le client la verra disparaître immédiatement et recevra un email d'annulation.`)) return;
    await deleteTodo(id);
    if (clientEmail) {
      sendEmail('task_cancelled', clientEmail, { clientName: clientName || 'toi', taskTitle: title }).catch(() => {});
    }
  };

  return (
    <Card title="Tâches" icon={CheckSquare} subtitle={`${all.filter((t) => !t.done).length} ouvertes — ${extraTodos.length} envoyée(s) par toi`}>
      {all.length === 0 ? (
        <div className="text-sm text-white/50 italic py-4 text-center">
          Aucune tâche envoyée. Utilise « Envoyer une tâche » en haut à droite.
        </div>
      ) : (
        <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {all.map((t) => (
            editingId === t.id && t.fromDB ? (
              <li key={t.id}>
                <TodoEditForm
                  todo={t as Todo}
                  onCancel={() => setEditingId(null)}
                  onSave={async (patch) => {
                    await updateTodo(t.id, patch);
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li
                key={t.id}
                className="flex items-start gap-3 text-sm p-2.5 rounded-lg hover:bg-white/[0.03] group"
              >
                <button
                  onClick={() => onToggle(t.id, t.fromDB)}
                  disabled={!t.fromDB}
                  className="shrink-0 mt-0.5 disabled:cursor-not-allowed"
                  title={t.fromDB ? 'Marquer comme fait' : 'Lecture seule (mock)'}
                >
                  {t.done
                    ? <CheckSquare className="text-lilac" size={16} />
                    : <Square className="text-white/40 hover:text-white" size={16} />}
                </button>
                <div className={`flex-1 min-w-0 ${t.done ? 'line-through text-white/40' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.fromDB && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-lilac/20 text-lilac uppercase font-semibold inline-flex items-center gap-1">
                        <BadgePlus size={9} /> Envoyée
                      </span>
                    )}
                    <span className="break-words">{t.title}</span>
                    {t.priority === 'high' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 uppercase font-semibold">Prio</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                    {t.assignee && <span>→ {t.assignee}</span>}
                    {t.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                {t.fromDB && (
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(t.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10"
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(t.id, t.title, t.fromDB)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10"
                      title="Annuler la tâche"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </li>
            )
          ))}
        </ul>
      )}
    </Card>
  );
}

function TodoEditForm({
  todo, onCancel, onSave,
}: {
  todo: Todo;
  onCancel: () => void;
  onSave: (patch: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>;
}) {
  const [title, setTitle] = useState(todo.title);
  const [dueDate, setDueDate] = useState(todo.dueDate || '');
  const [assignee, setAssignee] = useState(todo.assignee || '');
  const [priority, setPriority] = useState<'low' | 'med' | 'high'>(todo.priority || 'med');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSave({ title: title.trim(), dueDate, assignee, priority });
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
      <div className="grid grid-cols-3 gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls + ' text-white'}
        />
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assigné à"
          className={inputCls}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'med' | 'high')}
          className={inputCls}
        >
          <option value="low">Basse</option>
          <option value="med">Moyenne</option>
          <option value="high">Haute</option>
        </select>
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
