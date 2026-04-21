'use client';
// Loader pour les VRAIES données sociales (connections + social_videos) depuis Supabase.
// Utilisé par le dashboard client pour merger avec les données mock quand des plateformes
// sont connectées en OAuth réel.

import { supabaseBrowser } from './supabase/client';
import type { SocialMetrics } from './social/types';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface RealConnection {
  platform: Platform;
  username: string;
  followers: number;
  avatarUrl?: string;
  metrics: SocialMetrics;
  lastSyncedAt?: string;
  connectedAt: string;
}

export interface RealVideo {
  id: string;
  platform: Platform;
  externalId: string;
  title: string;
  thumbnailUrl?: string;
  permalink?: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface RealSocialData {
  connections: Partial<Record<Platform, RealConnection>>;
  videos: RealVideo[];
}

const EMPTY: RealSocialData = { connections: {}, videos: [] };

/** Charge les vraies données sociales de l'utilisateur courant (RLS = self only). */
export async function fetchRealSocialData(): Promise<RealSocialData> {
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return EMPTY;

  const [connRes, vidRes] = await Promise.all([
    sb.from('connections').select('*').eq('user_id', user.id),
    sb.from('social_videos').select('*').eq('user_id', user.id).order('published_at', { ascending: false }).limit(24),
  ]);

  const connections: Partial<Record<Platform, RealConnection>> = {};
  for (const r of connRes.data || []) {
    connections[r.platform as Platform] = {
      platform: r.platform,
      username: r.username,
      followers: r.followers || 0,
      avatarUrl: r.avatar_url || undefined,
      metrics: ((r.metrics_cache as Partial<SocialMetrics>) || {}) as SocialMetrics,
      lastSyncedAt: r.last_synced_at || undefined,
      connectedAt: r.connected_at,
    };
  }

  const videos: RealVideo[] = (vidRes.data || []).map((v: any) => ({
    id: v.id,
    platform: v.platform,
    externalId: v.external_id,
    title: v.title || '(Sans titre)',
    thumbnailUrl: v.thumbnail_url || undefined,
    permalink: v.permalink || undefined,
    publishedAt: v.published_at || v.fetched_at,
    views: v.views || 0,
    likes: v.likes || 0,
    comments: v.comments || 0,
    shares: v.shares || 0,
  }));

  return { connections, videos };
}

/** Helper : compte de plateformes connectées */
export function connectedCount(data: RealSocialData): number {
  return Object.keys(data.connections).length;
}
