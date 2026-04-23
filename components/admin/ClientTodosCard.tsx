'use client';
import { CheckSquare, Square, Trash2, BadgePlus } from 'lucide-react';
import { Todo, toggleTodo, deleteTodo } from '@/lib/sharedStore';
import Card from '@/components/dashboard/Card';

export default function ClientTodosCard({
  mockTodos,
  extraTodos,
}: {
  mockTodos: Array<{ id: string; title: string; done: boolean; assignee?: string }>;
  extraTodos: Todo[];
}) {
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
    if (!confirm(`Annuler la tâche "${title}" ? Le client la verra disparaître immédiatement.`)) return;
    await deleteTodo(id);
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
                </div>
                {t.assignee && (
                  <div className="text-xs text-white/40 mt-0.5">→ {t.assignee}</div>
                )}
              </div>
              {t.fromDB && (
                <button
                  onClick={() => onDelete(t.id, t.title, t.fromDB)}
                  className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Annuler la tâche"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
