'use client';
import { useEffect, useState } from 'react';
import { CheckSquare, Square, Clock, BadgePlus } from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { ClientData, getClientBySlug } from '@/lib/mockData';
import { fetchTodos, toggleTodo, subscribeClientChanges, Todo } from '@/lib/sharedStore';
import { markSeen } from '@/lib/notifications';
import RoleGate from '@/components/RoleGate';
import EmptyState from '@/components/dashboard/EmptyState';

export default function TodosPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [mockTodos, setMockTodos] = useState<ClientData['todos']>([]);
  const [dbTodos, setDbTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (!s) return;
      setSession(s);
      const c = s.clientSlug ? getClientBySlug(s.clientSlug) : null;
      if (c) {
        setClient(c);
        setMockTodos(c.todos);
      }
      setLoaded(true);
    });
  }, []);

  // Slug pour fetch les tâches DB : si pas de mock binding, on utilise user-{userId}
  const slug = client?.slug || (session?.userId ? `user-${session.userId}` : '');

  useEffect(() => {
    if (!slug) return;
    const refresh = async () => {
      setDbTodos(await fetchTodos(slug));
      markSeen('todos', slug);
    };
    refresh();
    return subscribeClientChanges(slug, refresh);
  }, [slug]);

  if (!loaded || !session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Liste des tâches"><></></RoleGate>;
  }

  // Merge dbTodos + mockTodos. Détection: les UUID DB sont longs.
  type Item = { id: string; title: string; done: boolean; dueDate?: string; assignee?: string; priority?: string; fromDB: boolean };
  const all: Item[] = [
    ...dbTodos.map((t) => ({ ...t, fromDB: true })),
    ...mockTodos.map((t) => ({ ...t, fromDB: false })),
  ];
  const visible = all.filter((t) => filter === 'all' ? true : filter === 'open' ? !t.done : t.done);

  const toggle = async (item: Item) => {
    if (item.fromDB) {
      await toggleTodo(item.id);
    } else {
      setMockTodos((prev) => prev.map((t) => (t.id === item.id ? { ...t, done: !t.done } : t)));
    }
  };

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Tâches</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">À faire</h1>
          <p className="text-white/60 mt-2">{all.filter(t => !t.done).length} en cours, {all.filter(t => t.done).length} terminées</p>
        </div>
        <div className="flex gap-2">
          {(['open', 'all', 'done'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f ? 'bg-lilac text-ink font-medium' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {f === 'open' ? 'En cours' : f === 'done' ? 'Terminées' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche pour l'instant"
          description="Ton account manager Omniscale t'enverra des tâches à compléter (préparer un brief, valider un visuel, fournir des photos, etc.) directement ici."
          cta={{ label: 'Connecte tes comptes en attendant', href: '/dashboard/connections' }}
        />
      ) : (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
        {visible.map((t) => (
          <button key={t.id} onClick={() => toggle(t)} className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/5 transition-colors">
            {t.done ? <CheckSquare className="text-lilac shrink-0 mt-0.5" size={20} /> : <Square className="text-white/40 shrink-0 mt-0.5" size={20} />}
            <div className="flex-1 min-w-0">
              {t.fromDB && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-lilac/20 text-lilac uppercase font-semibold inline-flex items-center gap-1">
                  <BadgePlus size={10} /> Envoyée par Omniscale
                </span>
              )}
              <div className={`font-medium mt-1 ${t.done ? 'line-through text-white/40' : ''}`}>{t.title}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                {t.dueDate && (
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                )}
                {t.assignee && <span>👤 {t.assignee}</span>}
                {t.priority === 'high' && <span className="text-red-400">● Priorité haute</span>}
              </div>
            </div>
          </button>
        ))}
        {visible.length === 0 && <div className="p-12 text-center text-white/50 italic">Aucune tâche dans ce filtre.</div>}
      </div>
      )}
    </main>
  );
}
