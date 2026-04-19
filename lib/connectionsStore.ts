'use client';
import { supabaseBrowser } from './supabase/client';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface Connection {
  platform: Platform;
  username: string;
  connectedAt: string;
  followers: number;
}

function fromDB(r: any): Connection {
  return {
    platform: r.platform,
    username: r.username,
    followers: r.followers || 0,
    connectedAt: r.connected_at,
  };
}

export async function getConnections(_email?: string): Promise<Connection[]> {
  // Le RLS limite déjà aux connexions de l'utilisateur courant
  const sb = supabaseBrowser();
  const { data } = await sb.from('connections').select('*').order('connected_at', { ascending: false });
  return (data || []).map(fromDB);
}

export async function connectPlatform(_email: string, platform: Platform, username: string, followers: number) {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('connections').upsert({
    user_id: user.id,
    platform,
    username: username.replace('@', ''),
    followers,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' });
}

export async function disconnectPlatform(_email: string, platform: Platform) {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('connections').delete()
    .eq('user_id', user.id)
    .eq('platform', platform);
}

export function subscribeConnections(cb: () => void): () => void {
  const sb = supabaseBrowser();
  const ch = sb
    .channel('connections-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => cb())
    .subscribe();
  return () => { sb.removeChannel(ch); };
}
