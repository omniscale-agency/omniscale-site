// Instagram — utilise "Instagram Login" (Meta for Developers, Instagram product).
// Doc : https://developers.facebook.com/docs/instagram-platform/instagram-login
//
// Compte requis : Instagram Business ou Creator (compte personnel non supporté pour Insights).
//
// Flow:
//   1. Redirect vers https://www.instagram.com/oauth/authorize
//   2. Callback → exchange code → short-lived token (1h)
//   3. Exchange short-lived → long-lived (60 jours, refreshable)
//   4. API : graph.instagram.com/me, /me/media, /{ig-id}/insights

import type { OAuthTokenResult, ProviderProfile, SocialProvider, SocialVideo } from './types';

const APP_ID = process.env.INSTAGRAM_APP_ID || '';
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || '';

const AUTH_URL = 'https://www.instagram.com/oauth/authorize';
const TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const LONG_LIVED_URL = 'https://graph.instagram.com/access_token';
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';
const GRAPH_BASE = 'https://graph.instagram.com';

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
  'instagram_business_content_publish',
  'instagram_business_manage_comments',
].join(',');

export const instagramProvider: SocialProvider = {
  platform: 'instagram',

  buildAuthUrl(state, redirectUri) {
    if (!APP_ID) throw new Error('INSTAGRAM_APP_ID not configured');
    const params = new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  async exchangeCode(code, redirectUri) {
    if (!APP_ID || !APP_SECRET) throw new Error('Instagram app credentials missing');

    // Étape 1 : short-lived token (1h)
    const formBody = new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });
    const shortRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });
    if (!shortRes.ok) {
      const t = await shortRes.text();
      throw new Error(`Instagram code exchange failed: ${shortRes.status} ${t}`);
    }
    const shortData = await shortRes.json() as { access_token: string; user_id: string | number; permissions?: string[] };

    // Étape 2 : long-lived token (60 jours)
    const longUrl = new URL(LONG_LIVED_URL);
    longUrl.searchParams.set('grant_type', 'ig_exchange_token');
    longUrl.searchParams.set('client_secret', APP_SECRET);
    longUrl.searchParams.set('access_token', shortData.access_token);
    const longRes = await fetch(longUrl.toString());
    if (!longRes.ok) {
      const t = await longRes.text();
      throw new Error(`Instagram long-lived token exchange failed: ${longRes.status} ${t}`);
    }
    const longData = await longRes.json() as { access_token: string; token_type: string; expires_in: number };

    return {
      accessToken: longData.access_token,
      expiresAt: new Date(Date.now() + longData.expires_in * 1000).toISOString(),
      scope: SCOPES,
    };
  },

  async refreshAccessToken(currentToken: string): Promise<OAuthTokenResult> {
    // Note: pour Instagram, on refresh avec l'access_token actuel, pas un refresh_token
    const url = new URL(REFRESH_URL);
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', currentToken);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Instagram token refresh failed: ${res.status} ${t}`);
    }
    const data = await res.json() as { access_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  },

  async fetchProfile(accessToken): Promise<ProviderProfile> {
    const fields = 'id,username,account_type,media_count,followers_count,follows_count,profile_picture_url';
    const url = `${GRAPH_BASE}/me?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Instagram /me failed: ${res.status} ${t}`);
    }
    const data = await res.json() as {
      id: string; username: string; account_type?: string;
      media_count?: number; followers_count?: number; follows_count?: number;
      profile_picture_url?: string;
    };

    return {
      providerUserId: data.id,
      username: data.username,
      avatarUrl: data.profile_picture_url,
      metrics: {
        followers: data.followers_count || 0,
        following: data.follows_count || 0,
        videoCount: data.media_count || 0,
        postCount: data.media_count || 0,
      },
    };
  },

  async fetchRecentVideos(accessToken, _providerUserId, limit = 12): Promise<SocialVideo[]> {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
    const url = `${GRAPH_BASE}/me/media?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Instagram /me/media failed: ${res.status} ${t}`);
    }
    const data = await res.json() as { data: Array<any> };

    return (data.data || []).map((m): SocialVideo => ({
      externalId: String(m.id),
      title: (m.caption as string | undefined)?.slice(0, 200),
      thumbnailUrl: m.thumbnail_url || m.media_url,
      permalink: m.permalink,
      publishedAt: m.timestamp,
      views: 0, // nécessite /insights par média (1 appel par vidéo, on skip pour v1)
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
      shares: 0,
      raw: m,
    }));
  },
};
