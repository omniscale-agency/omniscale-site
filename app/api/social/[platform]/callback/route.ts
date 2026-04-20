// GET /api/social/{platform}/callback?code=...&state=...
// Échange le code contre des tokens, fait un premier sync et stocke en DB.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getProvider } from '@/lib/social';
import { verifyAndClearState, buildRedirectUri } from '@/lib/social/oauth';

export async function GET(req: NextRequest, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const failRedirect = (msg: string) =>
    NextResponse.redirect(new URL(`/dashboard/connections?error=${encodeURIComponent(msg)}`, req.url));

  if (errorParam) return failRedirect(errorParam);
  if (!code) return failRedirect('missing_code');

  let provider;
  try {
    provider = getProvider(platform);
  } catch {
    return failRedirect('unknown_platform');
  }

  try {
    await verifyAndClearState(provider.platform, state);
  } catch (e: any) {
    return failRedirect(e.message || 'state_invalid');
  }

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login?error=auth_required', req.url));

  try {
    const redirectUri = buildRedirectUri(provider.platform);

    // 1. Échange code → tokens
    const tokens = await provider.exchangeCode(code, redirectUri);

    // 2. Premier fetch profil + metrics
    const profile = await provider.fetchProfile(tokens.accessToken);

    // 3. Upsert en DB
    const { data: connRow, error: connErr } = await sb.from('connections').upsert({
      user_id: user.id,
      platform: provider.platform,
      username: profile.username,
      followers: profile.metrics.followers,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken || null,
      expires_at: tokens.expiresAt || null,
      provider_user_id: profile.providerUserId,
      scope: tokens.scope || null,
      avatar_url: profile.avatarUrl || null,
      metrics_cache: profile.metrics,
      last_synced_at: new Date().toISOString(),
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' }).select().single();

    if (connErr || !connRow) {
      console.error(`[social/${platform}/callback] upsert error`, connErr);
      return failRedirect('db_save_failed');
    }

    // 4. Premier sync vidéos (best-effort, non bloquant)
    try {
      const videos = await provider.fetchRecentVideos(tokens.accessToken, profile.providerUserId, 12);
      if (videos.length > 0) {
        await sb.from('social_videos').upsert(
          videos.map((v) => ({
            connection_id: connRow.id,
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
      }
    } catch (e) {
      console.warn(`[social/${platform}/callback] video sync skipped:`, e);
    }

    return NextResponse.redirect(new URL(`/dashboard/connections?connected=${platform}`, req.url));
  } catch (e: any) {
    console.error(`[social/${platform}/callback]`, e);
    return failRedirect(e.message || 'callback_failed');
  }
}
