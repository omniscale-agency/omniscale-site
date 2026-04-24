'use client';
import { supabaseBrowser } from './supabase/client';
import type { SocialMetrics } from './social/types';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface Connection {
  platform: Platform;
  username: string;
  connectedAt: string;
  followers: number;
  avatarUrl?: string;
  metrics?: SocialMetrics;
  lastSyncedAt?: string;
}

function fromDB(r: any): Connection {
  return {
    platform: r.platform,
    username: r.username,
    followers: r.followers || 0,
    connectedAt: r.connected_at,
    avatarUrl: r.avatar_url || undefined,
    metrics: r.metrics_cache || {},
    lastSyncedAt: r.last_synced_at || undefined,
  };
}

export async function getConnections(): Promise<Connection[]> {
  const sb = supabaseBrowser();
  const { data } = await sb
    .from('connections')
    .select('*')
    .order('connected_at', { ascending: false });
  return (data || []).map(fromDB);
}

/** Lance le flow OAuth en redirigeant le navigateur vers /api/social/{platform}/connect */
export function startOAuth(platform: Platform) {
  window.location.href = `/api/social/${platform}/connect`;
}

/** Force un refresh des données via l'API serveur (qui call le provider) */
export async function syncPlatform(platform: Platform): Promise<{ ok: boolean; videoCount?: number; error?: string }> {
  const res = await fetch(`/api/social/${platform}/sync`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || 'sync_failed' };
  return { ok: true, videoCount: data.videoCount };
}

export async function disconnectPlatform(platform: Platform): Promise<boolean> {
  const res = await fetch(`/api/social/${platform}/disconnect`, { method: 'POST' });
  return res.ok;
}

export function subscribeConnections(cb: () => void): () => void {
  const sb = supabaseBrowser();
  const uniq = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const ch = sb
    .channel(`connections-changes-${uniq}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => cb())
    .subscribe();
  return () => { sb.removeChannel(ch); };
}

// ============================================================
// Vidéos importées depuis les APIs sociales
// ============================================================

export interface SocialVideoRow {
  id: string;
  platform: Platform;
  externalId: string;
  title?: string;
  thumbnailUrl?: string;
  permalink?: string;
  publishedAt?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export async function getSocialVideos(limit = 12): Promise<SocialVideoRow[]> {
  const sb = supabaseBrowser();
  const { data } = await sb
    .from('social_videos')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data || []).map((r: any) => ({
    id: r.id,
    platform: r.platform,
    externalId: r.external_id,
    title: r.title,
    thumbnailUrl: r.thumbnail_url,
    permalink: r.permalink,
    publishedAt: r.published_at,
    views: r.views || 0,
    likes: r.likes || 0,
    comments: r.comments || 0,
    shares: r.shares || 0,
  }));
}
