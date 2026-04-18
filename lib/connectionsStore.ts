'use client';

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export interface Connection {
  platform: Platform;
  username: string;
  connectedAt: string;
  followers: number;
  // Champs ajoutés au moment du "vrai" OAuth en phase 2 :
  accessToken?: string;
  refreshToken?: string;
}

const KEY = (email: string) => `omniscale_connections_${email}`;

export function getConnections(email: string): Connection[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY(email));
  if (!raw) return [];
  try { return JSON.parse(raw) as Connection[]; } catch { return []; }
}

export function setConnections(email: string, connections: Connection[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY(email), JSON.stringify(connections));
  window.dispatchEvent(new CustomEvent('omniscale-connections-change'));
}

export function connectPlatform(email: string, platform: Platform, username: string, followers: number) {
  const existing = getConnections(email);
  const filtered = existing.filter((c) => c.platform !== platform);
  setConnections(email, [...filtered, {
    platform,
    username: username.replace('@', ''),
    followers,
    connectedAt: new Date().toISOString(),
  }]);
}

export function disconnectPlatform(email: string, platform: Platform) {
  const existing = getConnections(email);
  setConnections(email, existing.filter((c) => c.platform !== platform));
}

export function subscribeConnections(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const h = () => cb();
  window.addEventListener('omniscale-connections-change', h);
  window.addEventListener('storage', h);
  return () => {
    window.removeEventListener('omniscale-connections-change', h);
    window.removeEventListener('storage', h);
  };
}
