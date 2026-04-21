// Analytics — wrapper PostHog (browser) + Supabase (sample local pour requêtes admin)
//
// Usage côté client :
//   import { capture, identify, reset } from '@/lib/analytics';
//   capture('lead_signup', { source: 'landing' });
//
// Usage côté serveur :
//   import { captureServer } from '@/lib/analytics/server';

'use client';
import posthog from 'posthog-js';
import { supabaseBrowser } from './supabase/client';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined' || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',          // crée un profil seulement après identify()
    capture_pageview: false,                      // on capture manuellement (pour gérer Next.js routing)
    capture_pageleave: true,
    autocapture: true,                            // clics + form submits auto
    disable_session_recording: false,             // garde les replays
    cross_subdomain_cookie: true,
    persistence: 'localStorage+cookie',
  });
  initialized = true;
}

/** Capture un événement custom — envoyé à PostHog ET stocké en BDD (sample local) */
export function capture(event: string, properties: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  initPostHog();
  if (initialized) posthog.capture(event, properties);

  // Mirror minimal en BDD (anonyme OK, le RLS gère la confidentialité)
  void mirrorToSupabase(event, properties);
}

async function mirrorToSupabase(event: string, properties: Record<string, any>) {
  try {
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    const distinctId = initialized ? posthog.get_distinct_id() : undefined;
    await sb.from('analytics_events').insert({
      user_id: user?.id || null,
      anonymous_id: distinctId,
      event,
      properties,
      session_id: initialized ? posthog.get_session_id() : null,
      occurred_at: new Date().toISOString(),
    });
  } catch {
    // Best-effort, ignore
  }
}

/** Identifier l'utilisateur après auth (lie l'anonymous distinct_id au user) */
export function identify(userId: string, traits: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  initPostHog();
  if (initialized) posthog.identify(userId, traits);
}

/** Reset au logout */
export function reset() {
  if (typeof window === 'undefined' || !initialized) return;
  posthog.reset();
}

/** Capture un page_view manuellement (utilisé par PostHogPageviewTracker) */
export function capturePageview(url?: string) {
  if (typeof window === 'undefined') return;
  initPostHog();
  if (initialized) posthog.capture('$pageview', { $current_url: url || window.location.href });

  // Mirror minimal (URL + referrer + UTM)
  const params = new URLSearchParams(window.location.search);
  const props: Record<string, any> = {
    url: url || window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || null,
  };
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = params.get(k);
    if (v) props[k] = v;
  }
  void mirrorToSupabase('page_view', props);
}
