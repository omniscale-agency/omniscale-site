// Analytics côté SERVEUR — pour les routes API (webhooks, callbacks, etc.)
// Utilise posthog-node (events serveur, pas de cookie/distinct_id côté browser).

import { PostHog } from 'posthog-node';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!POSTHOG_KEY) return null;
  if (!_client) {
    _client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,        // envoi immédiat (serverless = pas de batch)
      flushInterval: 0,
    });
  }
  return _client;
}

/** Capture un event serveur. distinctId = email ou user_id si connu, sinon 'server-anonymous'. */
export async function captureServer(
  distinctId: string,
  event: string,
  properties: Record<string, any> = {},
) {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
  // Force flush en serverless (Vercel kill le process après la response)
  await client.shutdown().catch(() => {});
  _client = null; // recréer au prochain appel
}
