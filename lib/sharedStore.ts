'use client';
import { supabaseBrowser } from './supabase/client';

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  assignee?: string;
  priority?: 'low' | 'med' | 'high';
}

export interface Event {
  id: string;
  title: string;
  startsAt: string;
  duration: number;
  type: 'call' | 'shooting' | 'review' | 'workshop';
  with: string;
}

// ---------- TODOS ----------
function todoFromDB(r: any): Todo {
  return {
    id: r.id,
    title: r.title,
    done: r.done,
    dueDate: r.due_date || undefined,
    assignee: r.assignee || undefined,
    priority: r.priority || undefined,
  };
}

export async function fetchTodos(clientSlug: string): Promise<Todo[]> {
  const sb = supabaseBrowser();
  const { data } = await sb.from('todos').select('*')
    .eq('client_slug', clientSlug)
    .order('created_at', { ascending: false });
  return (data || []).map(todoFromDB);
}

export async function addTodo(clientSlug: string, todo: Omit<Todo, 'id'>): Promise<Todo | null> {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  const { data } = await sb.from('todos').insert({
    client_slug: clientSlug,
    title: todo.title,
    done: todo.done,
    due_date: todo.dueDate || null,
    assignee: todo.assignee || null,
    priority: todo.priority || null,
    created_by: user?.id,
  }).select().single();
  return data ? todoFromDB(data) : null;
}

export async function toggleTodo(id: string) {
  const sb = supabaseBrowser();
  const { data: cur } = await sb.from('todos').select('done').eq('id', id).single();
  if (!cur) return;
  await sb.from('todos').update({ done: !cur.done }).eq('id', id);
}

export async function deleteTodo(id: string) {
  const sb = supabaseBrowser();
  await sb.from('todos').delete().eq('id', id);
}

// ---------- EVENTS ----------
function eventFromDB(r: any): Event {
  return {
    id: r.id,
    title: r.title,
    startsAt: r.starts_at,
    duration: r.duration,
    type: r.type,
    with: r.with_who || '',
  };
}

export async function fetchEvents(clientSlug: string): Promise<Event[]> {
  const sb = supabaseBrowser();
  const { data } = await sb.from('events').select('*')
    .eq('client_slug', clientSlug)
    .order('starts_at', { ascending: true });
  return (data || []).map(eventFromDB);
}

export async function addEvent(clientSlug: string, event: Omit<Event, 'id'>): Promise<Event | null> {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  const { data } = await sb.from('events').insert({
    client_slug: clientSlug,
    title: event.title,
    starts_at: event.startsAt,
    duration: event.duration,
    type: event.type,
    with_who: event.with,
    created_by: user?.id,
  }).select().single();
  return data ? eventFromDB(data) : null;
}

export async function deleteEvent(id: string) {
  const sb = supabaseBrowser();
  await sb.from('events').delete().eq('id', id);
}

// ---------- REALTIME SUBSCRIPTION ----------
/** Subscribe aux changements live des todos + events d'un client. Renvoie unsubscribe. */
export function subscribeClientChanges(clientSlug: string, cb: () => void): () => void {
  const sb = supabaseBrowser();
  const ch = sb
    .channel(`client-${clientSlug}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `client_slug=eq.${clientSlug}` }, () => cb())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `client_slug=eq.${clientSlug}` }, () => cb())
    .subscribe();
  return () => { sb.removeChannel(ch); };
}
