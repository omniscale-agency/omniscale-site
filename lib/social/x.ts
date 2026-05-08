// X (Twitter) OAuth 2.0 with PKCE + Tweets API helpers (server-side only).
// Doc :
//   https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/authorization-code
//   https://docs.x.com/x-api/posts/creation-of-a-post
//   https://docs.x.com/x-api/posts/posts-by-user
//
// Pricing (free tier) :
//   POST /2/tweets : 17 / 24h / user
//   GET /2/users/:id/tweets : 1 / 15min / user, 500 reads / month
//   Suffisant pour quelques tweets par jour ; au-delà → tier "Basic" 200 $/mois.
//
// X utilise OAuth 2.0 avec PKCE obligatoire (S256). On stocke le code_verifier
// dans un cookie httpOnly entre /auth et /callback (state aussi).

import crypto from 'node:crypto';

const AUTH_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const ME_URL = 'https://api.x.com/2/users/me';
const TWEETS_URL = 'https://api.x.com/2/tweets';

// Scopes : tweet.write pour publier, users.read pour /users/me, tweet.read
// pour récupérer la timeline du user, offline.access pour avoir un refresh_token.
export const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

/** Génère un code_verifier PKCE (43-128 chars URL-safe). */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Dérive le code_challenge S256 depuis le code_verifier. */
export function deriveCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/** URL d'autorisation OAuth avec PKCE. */
export function buildAuthUrl(opts: { state: string; codeChallenge: string }): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env('X_CLIENT_ID'),
    redirect_uri: env('X_REDIRECT_URI'),
    state: opts.state,
    scope: SCOPES,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Échange code → access_token + refresh_token + scope. PKCE-aware. */
export async function exchangeCodeForToken(opts: {
  code: string;
  codeVerifier: string;
}): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: 'bearer';
}> {
  const clientId = env('X_CLIENT_ID');
  const clientSecret = env('X_CLIENT_SECRET');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    redirect_uri: env('X_REDIRECT_URI'),
    code_verifier: opts.codeVerifier,
    client_id: clientId,
  });
  // X OAuth2 confidential client → Basic auth header (client_id:client_secret)
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`X token exchange failed (${r.status}): ${t}`);
  }
  return r.json();
}

/** Renouvelle un access_token via le refresh_token. */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const clientId = env('X_CLIENT_ID');
  const clientSecret = env('X_CLIENT_SECRET');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`X token refresh failed (${r.status}): ${t}`);
  }
  return r.json();
}

/** Profil utilisateur (id, username, name). */
export async function getMe(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}> {
  const url = `${ME_URL}?user.fields=profile_image_url`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`X /users/me failed (${r.status}): ${t}`);
  }
  const json = await r.json();
  return json.data;
}

/** Publie un tweet text-only. Renvoie l'id du tweet créé. */
export async function publishTweet(opts: {
  accessToken: string;
  text: string;
}): Promise<{ tweetId: string }> {
  const r = await fetch(TWEETS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: opts.text }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`X publish failed (${r.status}): ${t.slice(0, 300)}`);
  }
  const json = await r.json();
  return { tweetId: json?.data?.id || '' };
}

/** Supprime un tweet (utile pour cancel). */
export async function deleteTweet(opts: {
  accessToken: string;
  tweetId: string;
}): Promise<void> {
  const r = await fetch(`${TWEETS_URL}/${opts.tweetId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${opts.accessToken}` },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`X delete failed (${r.status}): ${t.slice(0, 200)}`);
  }
}

export interface XRemoteTweet {
  id: string;
  text: string;
  createdAt: string | null;
  permalink: string;
}

/**
 * Récupère les derniers tweets d'un user.
 * GET /2/users/:id/tweets — limit max=100. Free tier : 1/15min, 500/mois.
 */
export async function getRecentTweets(opts: {
  accessToken: string;
  userId: string;
  username: string;
  count?: number;
}): Promise<XRemoteTweet[]> {
  const max = Math.min(opts.count || 20, 100);
  const url = `https://api.x.com/2/users/${opts.userId}/tweets?max_results=${max}&tweet.fields=created_at`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${opts.accessToken}` } });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`X timeline failed (${r.status}): ${t.slice(0, 200)}`);
  }
  const json = await r.json();
  const data: any[] = json?.data || [];
  return data.map((t) => ({
    id: t.id,
    text: t.text,
    createdAt: t.created_at || null,
    permalink: `https://x.com/${opts.username}/status/${t.id}`,
  }));
}
