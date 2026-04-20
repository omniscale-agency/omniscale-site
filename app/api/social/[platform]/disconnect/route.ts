// POST /api/social/{platform}/disconnect → supprime la connexion + les vidéos liées (cascade)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });

  const { error } = await sb.from('connections')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
