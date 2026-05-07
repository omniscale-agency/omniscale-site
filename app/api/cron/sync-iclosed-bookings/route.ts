import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchRecentEventCalls, mapToBooking } from '@/lib/social/iclosed';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/sync-iclosed-bookings
 *
 * Poll l'API iClosed et sync les bookings dans la table `bookings`.
 * Appelé par pg_cron toutes les 5 min (cf. supabase/migration-11.sql).
 *
 * Pourquoi ce cron au lieu du webhook iClosed ?
 *   Le webhook iClosed ne fire jamais sur le free tier (toggle ON, event type
 *   correct, mais aucune requête HTTP n'arrive). On bypass leur webhook en
 *   pollant directement leur API REST publique — fiable et documenté.
 *
 * Sécurité : protégé par CRON_SECRET (header Authorization Bearer).
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.ICLOSED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ICLOSED_API_KEY missing' }, { status: 500 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 1. Fetch côté iClosed (UPCOMING + PAST + CANCELLED, dédupé par id)
  let calls;
  try {
    calls = await fetchRecentEventCalls({ apiKey, limit: 50 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'iClosed API error' }, { status: 500 });
  }
  if (calls.length === 0) {
    return NextResponse.json({ ok: true, fetched: 0, inserted: 0, updated: 0 });
  }

  // 2. Pour détecter les "nouveaux", on liste d'abord les external_id déjà connus
  const externalIds = calls.map((c) => String(c.id));
  const { data: existing } = await admin
    .from('bookings')
    .select('external_id, event, scheduled_at')
    .in('external_id', externalIds);
  const existingMap = new Map<string, { event: string; scheduled_at: string | null }>();
  (existing || []).forEach((row: any) => {
    existingMap.set(row.external_id, { event: row.event, scheduled_at: row.scheduled_at });
  });

  // 3. Upsert each call + collect new bookings (and status changes) for notif
  const newBookings: Array<ReturnType<typeof mapToBooking>> = [];
  const statusChanges: Array<{ row: ReturnType<typeof mapToBooking>; previousEvent: string }> = [];
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const call of calls) {
    const row = mapToBooking(call);
    const prev = existingMap.get(row.external_id);

    if (!prev) {
      newBookings.push(row);
    } else if (prev.event !== row.event) {
      statusChanges.push({ row, previousEvent: prev.event });
    }

    const { error } = await admin
      .from('bookings')
      .upsert(row, { onConflict: 'external_id' });
    if (error) {
      errors.push(`${row.external_id}: ${error.message}`);
    } else if (prev) {
      updated++;
    } else {
      inserted++;
    }
  }

  // 4. Lie les nouveaux bookings à un user SaaS si l'email matche un profil
  for (const nb of newBookings) {
    if (!nb.invitee_email) continue;
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', nb.invitee_email)
      .maybeSingle();
    if (profile?.id) {
      await admin
        .from('bookings')
        .update({ matched_user_id: profile.id, matched_at: new Date().toISOString() })
        .eq('external_id', nb.external_id);
    }
  }

  // 5. Email notif admin pour chaque nouveau booking + changement de statut majeur
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://omniscale.fr';
  const adminEmail = process.env.ADMIN_NOTIF_EMAIL || 'omniscale1@gmail.com';

  const sendNotif = (row: ReturnType<typeof mapToBooking>) =>
    fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'new_booking_admin',
        to: adminEmail,
        data: {
          name: row.invitee_name,
          email: row.invitee_email,
          phone: row.invitee_phone,
          scheduledAt: row.scheduled_at,
          closer: row.closer,
          utmSource: row.utm_source,
          utmCampaign: row.utm_campaign,
          event: row.event,
        },
      }),
    }).catch((err) => console.warn('[sync-iclosed] notif failed:', err));

  // Fire-and-forget en parallèle (pas await pour pas bloquer le cron)
  for (const nb of newBookings) sendNotif(nb);
  for (const sc of statusChanges) sendNotif(sc.row);

  return NextResponse.json({
    ok: true,
    fetched: calls.length,
    inserted,
    updated,
    new_bookings: newBookings.length,
    status_changes: statusChanges.length,
    errors,
  });
}
