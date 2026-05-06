import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/dev/seed-booking
 * Insère un faux booking en DB pour valider que la chaîne d'affichage
 * (page /admin/bookings + email notif) fonctionne. Admin-only.
 *
 * Body optionnel : { name, email, scheduledAt }
 */
export async function POST(req: NextRequest) {
  // Auth admin
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin requis' }, { status: 403 });

  // Service role pour insert direct (bypass RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: 'Service role key manquant' }, { status: 500 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Body params (tous optionnels)
  let body: any = {};
  try { body = await req.json(); } catch {}

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(14, 30, 0, 0);

  const fakeBooking = {
    external_id: `seed-${crypto.randomUUID()}`,
    source: 'seed',
    event: 'scheduled' as const,
    invitee_name: body.name || 'Test Booking (seed)',
    invitee_email: body.email || 'test+seed@omniscale.fr',
    invitee_phone: body.phone || '+33 6 12 34 56 78',
    scheduled_at: body.scheduledAt || tomorrow.toISOString(),
    duration_minutes: 45,
    closer: 'Rayan',
    meeting_url: 'https://app.iclosed.io/test-meeting-url',
    utm_source: 'seed-test',
    utm_medium: 'admin-debug',
    utm_campaign: 'verify-display',
    raw: { _seed: true, _by: user.id, _at: new Date().toISOString() },
    received_at: new Date().toISOString(),
  };

  const { data, error } = await admin.from('bookings').insert(fakeBooking).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    booking: data,
    note: 'Faux booking inséré. Va sur /admin/bookings pour le voir. Tu peux le supprimer ensuite via Supabase Studio.',
  });
}
