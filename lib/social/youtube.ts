// YouTube — utilise le client Google OAuth existant (celui qu'on a créé pour Sign-In).
// Doc : https://developers.google.com/youtube/v3/docs
//       https://developers.google.com/identity/protocols/oauth2/web-server
//
// On demande des scopes additionnels (youtube.readonly) en plus de openid/email/profile.

import type { OAuthTokenResult, ProviderProfile, SocialProvider, SocialVideo } from './types';

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
].join(' ');

export const youtubeProvider: SocialProvider = {
  platform: 'youtube',

  buildAuthUrl(state, redirectUri) {
    if (!CLIENT_ID) throw new Error('YOUTUBE_CLIENT_ID not configured');
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',     // pour avoir un refresh_token
      prompt: 'consent',          // force le consent pour récupérer le refresh_token
      include_granted_scopes: 'true',
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  async exchangeCode(code, redirectUri): Promise<OAuthTokenResult> {
    if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Google OAuth credentials missing');
    const formBody = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Google code exchange failed: ${res.status} ${t}`);
    }
    const data = await res.json() as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
      token_type: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResult> {
    const formBody = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });
    if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
    const data = await res.json() as { access_token: string; expires_in: number; scope: string };
    return {
      accessToken: data.access_token,
      refreshToken, // Google ne re-renvoie pas le refresh_token au refresh
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  },

  async fetchProfile(accessToken): Promise<ProviderProfile> {
    const url = `${YT_BASE}/channels?part=snippet,statistics&mine=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`YouTube /channels failed: ${res.status} ${t}`);
    }
    const data = await res.json() as { items: Array<any> };
    const ch = data.items?.[0];
    if (!ch) throw new Error('No YouTube channel found for this Google account');

    const stats = ch.statistics || {};
    const snip = ch.snippet || {};

    return {
      providerUserId: ch.id,
      username: snip.title || 'YouTube',
      avatarUrl: snip.thumbnails?.default?.url,
      metrics: {
        followers: parseInt(stats.subscriberCount || '0', 10),
        totalViews: parseInt(stats.viewCount || '0', 10),
        videoCount: parseInt(stats.videoCount || '0', 10),
      },
    };
  },

  async fetchRecentVideos(accessToken, providerUserId, limit = 12): Promise<SocialVideo[]> {
    if (!providerUserId) throw new Error('YouTube channel ID required');

    // 1. Récupère l'uploads playlist
    const chRes = await fetch(`${YT_BASE}/channels?part=contentDetails&id=${providerUserId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!chRes.ok) throw new Error(`YouTube channel uploads playlist fetch failed: ${chRes.status}`);
    const chData = await chRes.json() as { items: Array<any> };
    const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    // 2. Liste les N dernières vidéos
    const plRes = await fetch(
      `${YT_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!plRes.ok) throw new Error(`YouTube playlistItems failed: ${plRes.status}`);
    const plData = await plRes.json() as { items: Array<any> };
    const videoIds = plData.items.map((it) => it.contentDetails?.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    // 3. Récupère les statistics
    const vRes = await fetch(
      `${YT_BASE}/videos?part=snippet,statistics&id=${videoIds.join(',')}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!vRes.ok) throw new Error(`YouTube videos failed: ${vRes.status}`);
    const vData = await vRes.json() as { items: Array<any> };

    return vData.items.map((v): SocialVideo => ({
      externalId: v.id,
      title: v.snippet?.title,
      thumbnailUrl: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url,
      permalink: `https://youtu.be/${v.id}`,
      publishedAt: v.snippet?.publishedAt,
      views: parseInt(v.statistics?.viewCount || '0', 10),
      likes: parseInt(v.statistics?.likeCount || '0', 10),
      comments: parseInt(v.statistics?.commentCount || '0', 10),
      shares: 0,
      raw: v,
    }));
  },
};
