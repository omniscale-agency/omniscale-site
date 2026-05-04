// LinkedIn OAuth 2.0 + UGC Posts helpers (server-side only).
// Doc : https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
//       https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const POSTS_URL = 'https://api.linkedin.com/v2/ugcPosts';

// Scopes minimum pour OpenID Connect + posting sur le profil personnel
export const SCOPES = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

/** URL d'autorisation OAuth — redirige l'admin vers LinkedIn pour login. */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env('LINKEDIN_CLIENT_ID'),
    redirect_uri: env('LINKEDIN_REDIRECT_URI'),
    state,
    scope: SCOPES,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Échange code → access_token + infos. */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: env('LINKEDIN_CLIENT_ID'),
    client_secret: env('LINKEDIN_CLIENT_SECRET'),
    redirect_uri: env('LINKEDIN_REDIRECT_URI'),
  });
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`LinkedIn token exchange failed (${r.status}): ${t}`);
  }
  return r.json();
}

/** Profil utilisateur OpenID (sub, name, email, picture). */
export async function getUserInfo(accessToken: string): Promise<{
  sub: string;
  name: string;
  email?: string;
  picture?: string;
}> {
  const r = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`LinkedIn userinfo failed (${r.status}): ${t}`);
  }
  return r.json();
}

/** Publie un post text-only sur le profil de l'utilisateur connecté.
 *  `userSub` = id LinkedIn (sub OpenID), permet de construire l'URN auteur.
 *  Renvoie l'URN du post créé (ex: "urn:li:share:7..."). */
export async function publishTextPost(opts: {
  accessToken: string;
  userSub: string;
  text: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}): Promise<{ postId: string }> {
  const author = `urn:li:person:${opts.userSub}`;
  const body = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: opts.text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': opts.visibility || 'PUBLIC',
    },
  };
  const r = await fetch(POSTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`LinkedIn ugcPosts failed (${r.status}): ${t}`);
  }
  // L'URN est renvoyé dans le header x-restli-id
  const postId = r.headers.get('x-restli-id') || r.headers.get('X-RestLi-Id') || '';
  return { postId };
}
