// TikTok — utilise "Login Kit" + "Display API"
// Doc : https://developers.tiktok.com/doc/login-kit-web/
//       https://developers.tiktok.com/doc/tiktok-api-v2-get-started/
//
// Compte requis : TikTok personnel ou business.

import type { OAuthTokenResult, ProviderProfile, SocialProvider, SocialVideo } from './types';

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';

const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';
const VIDEO_LIST_URL = 'https://open.tiktokapis.com/v2/video/list/';

const SCOPES = [
  'user.info.basic',
  'user.info.profile',
  'user.info.stats',
  'video.list',
].join(',');

export const tiktokProvider: SocialProvider = {
  platform: 'tiktok',

  buildAuthUrl(state, redirectUri) {
    if (!CLIENT_KEY) throw new Error('TIKTOK_CLIENT_KEY not configured');
    const params = new URLSearchParams({
      client_key: CLIENT_KEY,
      response_type: 'code',
      scope: SCOPES,
      redirect_uri: redirectUri,
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  },

  async exchangeCode(code, redirectUri): Promise<OAuthTokenResult> {
    if (!CLIENT_KEY || !CLIENT_SECRET) throw new Error('TikTok app credentials missing');
    const formBody = new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: formBody.toString(),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`TikTok code exchange failed: ${res.status} ${t}`);
    }
    const data = await res.json() as {
      access_token: string;
      expires_in: number;
      open_id: string;
      refresh_token: string;
      refresh_expires_in: number;
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
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });
    if (!res.ok) throw new Error(`TikTok refresh failed: ${res.status}`);
    const data = await res.json() as {
      access_token: string; expires_in: number;
      refresh_token: string; scope: string;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  },

  async fetchProfile(accessToken): Promise<ProviderProfile> {
    const fields = 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,following_count,likes_count,video_count';
    const url = `${USER_INFO_URL}?fields=${encodeURIComponent(fields)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`TikTok /user/info failed: ${res.status} ${t}`);
    }
    const data = await res.json() as { data: { user: any }; error?: any };
    if (data.error?.code && data.error.code !== 'ok') throw new Error(`TikTok API error: ${JSON.stringify(data.error)}`);
    const user = data.data.user;

    return {
      providerUserId: user.open_id,
      username: user.display_name,
      avatarUrl: user.avatar_url,
      metrics: {
        followers: user.follower_count || 0,
        following: user.following_count || 0,
        totalLikes: user.likes_count || 0,
        videoCount: user.video_count || 0,
      },
    };
  },

  async fetchRecentVideos(accessToken, _providerUserId, limit = 12): Promise<SocialVideo[]> {
    const fields = 'id,title,video_description,duration,cover_image_url,share_url,create_time,like_count,comment_count,share_count,view_count';
    const url = `${VIDEO_LIST_URL}?fields=${encodeURIComponent(fields)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: Math.min(limit, 20) }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`TikTok /video/list failed: ${res.status} ${t}`);
    }
    const data = await res.json() as { data: { videos: any[] }; error?: any };
    if (data.error?.code && data.error.code !== 'ok') throw new Error(`TikTok API error: ${JSON.stringify(data.error)}`);
    const videos = data.data?.videos || [];

    return videos.map((v): SocialVideo => ({
      externalId: String(v.id),
      title: v.title || v.video_description?.slice(0, 200),
      thumbnailUrl: v.cover_image_url,
      permalink: v.share_url,
      publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : undefined,
      views: v.view_count || 0,
      likes: v.like_count || 0,
      comments: v.comment_count || 0,
      shares: v.share_count || 0,
      raw: v,
    }));
  },
};
