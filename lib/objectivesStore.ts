'use client';
import { supabaseBrowser } from './supabase/client';

export interface Objective {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  position: number;
}

function fromDB(r: any): Objective {
  return {
    id: r.id,
    label: r.label,
    current: Number(r.current),
    target: Number(r.target),
    unit: r.unit || '',
    position: r.position ?? 0,
  };
}

export async function fetchObjectives(clientSlug: string): Promise<Objective[]> {
  const sb = supabaseBrowser();
  const { data } = await sb
    .from('objectives')
    .select('*')
    .eq('client_slug', clientSlug)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  return (data || []).map(fromDB);
}

export async function addObjective(
  clientSlug: string,
  o: Omit<Objective, 'id' | 'position'>,
): Promise<Objective | null> {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  // Position = max + 1
  const { data: cur } = await sb.from('objectives').select('position').eq('client_slug', clientSlug);
  const nextPos = (cur || []).reduce((m, r: any) => Math.max(m, r.position ?? 0), 0) + 1;
  const { data } = await sb.from('objectives').insert({
    client_slug: clientSlug,
    label: o.label,
    current: o.current,
    target: o.target,
    unit: o.unit,
    position: nextPos,
    created_by: user?.id,
  }).select().single();
  return data ? fromDB(data) : null;
}

export async function updateObjective(id: string, patch: Partial<Omit<Objective, 'id'>>) {
  const sb = supabaseBrowser();
  const dbPatch: Record<string, unknown> = {};
  if (patch.label !== undefined) dbPatch.label = patch.label;
  if (patch.current !== undefined) dbPatch.current = patch.current;
  if (patch.target !== undefined) dbPatch.target = patch.target;
  if (patch.unit !== undefined) dbPatch.unit = patch.unit;
  if (patch.position !== undefined) dbPatch.position = patch.position;
  await sb.from('objectives').update(dbPatch).eq('id', id);
}

export async function deleteObjective(id: string) {
  const sb = supabaseBrowser();
  await sb.from('objectives').delete().eq('id', id);
}

/** Subscribe live aux objectifs d'un client. Renvoie unsubscribe. */
export function subscribeObjectives(clientSlug: string, cb: () => void): () => void {
  const sb = supabaseBrowser();
  const ch = sb
    .channel(`objectives-${clientSlug}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'objectives', filter: `client_slug=eq.${clientSlug}` },
      () => cb(),
    )
    .subscribe();
  return () => { sb.removeChannel(ch); };
}
