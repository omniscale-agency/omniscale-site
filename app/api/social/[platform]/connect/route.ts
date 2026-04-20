// GET /api/social/{platform}/connect → redirige vers le provider OAuth

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getProvider } from '@/lib/social';
import { createState, buildRedirectUri } from '@/lib/social/oauth';

export async function GET(req: NextRequest, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;

  // Vérifier que l'utilisateur est connecté
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=auth_required', req.url));
  }

  let provider;
  try {
    provider = getProvider(platform);
  } catch {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  try {
    const state = await createState(provider.platform);
    const redirectUri = buildRedirectUri(provider.platform);
    const authUrl = provider.buildAuthUrl(state, redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (e: any) {
    console.error(`[social/${platform}/connect]`, e);
    return NextResponse.redirect(
      new URL(`/dashboard/connections?error=${encodeURIComponent(e.message || 'connect_failed')}`, req.url)
    );
  }
}
