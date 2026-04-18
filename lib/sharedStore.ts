'use client';
// Store partagé local : admin écrit, client lit (via localStorage).
// À remplacer par une vraie DB (Supabase) en phase 2.

import type { ClientData } from './mockData';

type Todo = ClientData['todos'][number];
type Event = ClientData['upcomingEvents'][number];

const KEY = (slug: string, kind: 'todos' | 'events') => `omniscale_extra_${kind}_${slug}`;

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

function write<T>(key: string, items: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
  // Dispatch un événement custom pour update intra-tab
  window.dispatchEvent(new CustomEvent('omniscale-store-change', { detail: { key } }));
}

export function getExtraTodos(slug: string): Todo[] {
  return read<Todo>(KEY(slug, 'todos'));
}

export function getExtraEvents(slug: string): Event[] {
  return read<Event>(KEY(slug, 'events'));
}

export function addTodo(slug: string, todo: Omit<Todo, 'id'>) {
  const items = getExtraTodos(slug);
  const newTodo: Todo = { ...todo, id: `admin-${Date.now()}` };
  write(KEY(slug, 'todos'), [newTodo, ...items]);
  return newTodo;
}

export function toggleTodo(slug: string, id: string) {
  const items = getExtraTodos(slug);
  write(KEY(slug, 'todos'), items.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
}

export function deleteExtraTodo(slug: string, id: string) {
  const items = getExtraTodos(slug);
  write(KEY(slug, 'todos'), items.filter((t) => t.id !== id));
}

export function addEvent(slug: string, event: Omit<Event, 'id'>) {
  const items = getExtraEvents(slug);
  const newEvent: Event = { ...event, id: `admin-${Date.now()}` };
  write(KEY(slug, 'events'), [newEvent, ...items]);
  return newEvent;
}

export function deleteExtraEvent(slug: string, id: string) {
  const items = getExtraEvents(slug);
  write(KEY(slug, 'events'), items.filter((e) => e.id !== id));
}

// Hook helper pour s'abonner aux changements
export function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener('omniscale-store-change', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('omniscale-store-change', handler);
  };
}
