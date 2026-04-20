// Helpers communs pour le flow OAuth (state cookie anti-CSRF)

import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { Platform } from './types';

const STATE_COOKIE_PREFIX = 'omniscale_oauth_state_';
const STATE_TTL_SECONDS = 600; // 10 min

/** Génère un state cryptographiquement aléatoire et le stocke en cookie httpOnly */
export async function createState(platform: Platform): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE_PREFIX + platform, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_TTL_SECONDS,
    path: '/',
  });
  return state;
}

/** Vérifie le state au callback. Throw si invalide. */
export async function verifyAndClearState(platform: Platform, receivedState: string | null): Promise<void> {
  if (!receivedState) throw new Error('Missing state parameter');
  const cookieStore = await cookies();
  const cookieName = STATE_COOKIE_PREFIX + platform;
  const stored = cookieStore.get(cookieName)?.value;
  if (!stored) throw new Error('State cookie missing or expired');
  if (stored !== receivedState) throw new Error('State mismatch (possible CSRF)');
  cookieStore.delete(cookieName);
}

/** Construit l'URL absolue du callback pour une plateforme */
export function buildRedirectUri(platform: Platform): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';
  const normalized = base.startsWith('http') ? base : `https://${base}`;
  return `${normalized}/api/social/${platform}/callback`;
}
