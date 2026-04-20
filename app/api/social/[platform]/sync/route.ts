// POST /api/social/{platform}/sync
// Refetch profile + videos from the provider, update DB.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getProvider } from '@/lib/social';

export async function POST(req: NextRequest, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });

  let provider;
  try { provider = getProvider(platform); }
  catch { return NextResponse.json({ error: 'unknown_platform' }, { status: 400 }); }

  // Charge la connexion existante
  const { data: conn, error: connErr } = await sb.from('connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single();
  if (connErr || !conn) return NextResponse.json({ error: 'not_connected' }, { status: 404 });

  let accessToken: string = conn.access_token;
  let newRefresh: string | null = conn.refresh_token;
  let newExpires: string | null = conn.expires_at;

  // Si expiré et qu'on a un refresh_token + refresh dispo : refresh
  const isExpired = conn.expires_at && new Date(conn.expires_at).getTime() < Date.now() + 60_000;
  if (isExpired && provider.refreshAccessToken) {
    try {
      const refreshArg = provider.platform === 'instagram'
        ? conn.access_token        // Instagram refresh utilise l'access_token actuel
        : conn.refresh_token;      // TikTok / Google utilisent un refresh_token séparé
      if (refreshArg) {
        const refreshed = await provider.refreshAccessToken(refreshArg);
        accessToken = refreshed.accessToken;
        newRefresh = refreshed.refreshToken || conn.refresh_token;
        newExpires = refreshed.expiresAt || null;
      }
    } catch (e) {
      console.warn(`[social/${platform}/sync] refresh failed, trying with current token`, e);
    }
  }

  try {
    const profile = await provider.fetchProfile(accessToken, conn.provider_user_id || undefined);

    await sb.from('connections').update({
      username: profile.username,
      followers: profile.metrics.followers,
      provider_user_id: profile.providerUserId,
      avatar_url: profile.avatarUrl || conn.avatar_url,
      metrics_cache: profile.metrics,
      access_token: accessToken,
      refresh_token: newRefresh,
      expires_at: newExpires,
      last_synced_at: new Date().toISOString(),
    }).eq('id', conn.id);

    let videoCount = 0;
    try {
      const videos = await provider.fetchRecentVideos(accessToken, profile.providerUserId, 12);
      if (videos.length > 0) {
        await sb.from('social_videos').upsert(
          videos.map((v) => ({
            connection_id: conn.id,
            user_id: user.id,
            platform: provider.platform,
            external_id: v.externalId,
            title: v.title || null,
            thumbnail_url: v.thumbnailUrl || null,
            permalink: v.permalink || null,
            published_at: v.publishedAt || null,
            views: v.views, likes: v.likes, comments: v.comments, shares: v.shares,
            raw: v.raw || {},
            fetched_at: new Date().toISOString(),
          })),
          { onConflict: 'connection_id,external_id' }
        );
        videoCount = videos.length;
      }
    } catch (e) {
      console.warn(`[social/${platform}/sync] video fetch skipped:`, e);
    }

    return NextResponse.json({ ok: true, profile, videoCount });
  } catch (e: any) {
    console.error(`[social/${platform}/sync]`, e);
    return NextResponse.json({ error: e.message || 'sync_failed' }, { status: 500 });
  }
}
