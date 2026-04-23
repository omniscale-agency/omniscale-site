'use client';
import { useEffect, useState } from 'react';
import { fetchTodos, fetchEvents, subscribeClientChanges } from './sharedStore';

const STORAGE_PREFIX = 'omni-lastseen';

/** Mémorise la date de la dernière visite d'une page (pour calculer les "nouveautés"). */
export function markSeen(scope: 'todos' | 'events' | 'objectives', userKey: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}-${scope}-${userKey}`, new Date().toISOString());
  } catch {}
}

export function getLastSeen(scope: 'todos' | 'events' | 'objectives', userKey: string): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(`${STORAGE_PREFIX}-${scope}-${userKey}`);
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}

interface Counts {
  newTodos: number;
  newEvents: number;
  upcomingEvents: number;
  openTodos: number;
}

/** Hook côté client : compte les tâches/RDV "non vus" depuis la dernière visite. */
export function useDashboardNotifications(slug: string | null): Counts {
  const [counts, setCounts] = useState<Counts>({ newTodos: 0, newEvents: 0, upcomingEvents: 0, openTodos: 0 });

  useEffect(() => {
    if (!slug) return;
    const refresh = async () => {
      const [todos, events] = await Promise.all([fetchTodos(slug), fetchEvents(slug)]);
      const lastSeenTodos = getLastSeen('todos', slug);
      const lastSeenEvents = getLastSeen('events', slug);
      const now = Date.now();
      const newTodos = todos.filter((t) => {
        if (t.done) return false;
        if (!t.createdAt) return true; // pas de createdAt = on considère comme nouveau
        if (!lastSeenTodos) return true;
        return new Date(t.createdAt).getTime() > lastSeenTodos.getTime();
      }).length;
      const newEvents = events.filter((e) => {
        if (new Date(e.startsAt).getTime() < now) return false; // RDV passés ne comptent pas
        if (!e.createdAt) return true;
        if (!lastSeenEvents) return true;
        return new Date(e.createdAt).getTime() > lastSeenEvents.getTime();
      }).length;
      const upcomingEvents = events.filter((e) => new Date(e.startsAt).getTime() >= now).length;
      const openTodos = todos.filter((t) => !t.done).length;
      setCounts({ newTodos, newEvents, upcomingEvents, openTodos });
    };
    refresh();
    return subscribeClientChanges(slug, refresh);
  }, [slug]);

  return counts;
}
