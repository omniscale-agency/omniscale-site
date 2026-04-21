// POST /api/webhooks/iclosed
// Reçoit les events de iClosed (booking scheduled / cancelled / completed / no_show).
// Stocke en BDD + forward à PostHog pour les funnels.
//
// Configuration côté iClosed (admin → Integrations → Webhooks) :
//   URL : https://omniscale.fr/api/webhooks/iclosed
//   Secret : ICLOSED_WEBHOOK_SECRET (vérifié via header X-Iclosed-Signature ou X-Webhook-Secret)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { captureServer } from '@/lib/analytics-server';

const SECRET = process.env.ICLOSED_WEBHOOK_SECRET || '';

function mapEvent(raw: string): 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show' | null {
  const e = raw.toLowerCase();
  if (e.includes('scheduled') || e.includes('created') || e === 'invitee.created') return 'scheduled';
  if (e.includes('rescheduled')) return 'rescheduled';
  if (e.includes('cancel') || e === 'invitee.canceled') return 'cancelled';
  if (e.includes('complete') || e.includes('attended') || e.includes('show')) return 'completed';
  if (e.includes('no_show') || e.includes('noshow')) return 'no_show';
  return null;
}

export async function POST(req: NextRequest) {
  // Verify shared secret (best-effort — iClosed signature scheme à confirmer)
  if (SECRET) {
    const got =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('x-iclosed-secret') ||
      req.nextUrl.searchParams.get('secret');
    if (got !== SECRET) {
      console.warn('[iclosed webhook] invalid secret');
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // iClosed payload shape (à adapter selon doc réelle) — on couvre les noms communs :
  // { event_type|event, booking|invitee|payload : { id, name, email, phone, scheduled_at|start_time, duration, ... } }
  const eventRaw: string = body.event_type || body.event || body.type || '';
  const event = mapEvent(eventRaw);
  if (!event) {
    console.warn('[iclosed webhook] unknown event type:', eventRaw);
    return NextResponse.json({ ok: true, ignored: true, reason: 'unknown_event_type' });
  }

  const payload = body.booking || body.invitee || body.payload || body.data || body;
  const externalId =
    payload.id || payload.booking_id || payload.uuid || payload.uid || `${eventRaw}-${Date.now()}`;
  const inviteeName = payload.name || payload.invitee_name || payload.full_name || null;
  const inviteeEmail = payload.email || payload.invitee_email || null;
  const inviteePhone = payload.phone || payload.invitee_phone || payload.phone_number || null;
  const scheduledAt =
    payload.scheduled_at || payload.start_time || payload.starts_at || payload.event_start_time || null;
  const durationMinutes =
    payload.duration_minutes || payload.duration || payload.length_minutes || null;
  const closer = payload.assigned_to || payload.host || payload.closer || null;
  const meetingUrl = payload.meeting_url || payload.location || payload.video_url || null;

  // UTM/referrer si dispo (iClosed les passe parfois en custom fields)
  const utm = payload.utm || body.utm || {};
  const tracking = payload.tracking || body.tracking || {};

  const sb = await supabaseServer();

  // Si même booking (même externalId) → on update, sinon insert
  const { data: insertedRows, error: insertErr } = await sb
    .from('bookings')
    .upsert(
      {
        external_id: String(externalId),
        source: 'iclosed',
        event,
        invitee_name: inviteeName,
        invitee_email: inviteeEmail,
        invitee_phone: inviteePhone,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        closer,
        meeting_url: meetingUrl,
        utm_source: utm.source || tracking.utm_source || null,
        utm_medium: utm.medium || tracking.utm_medium || null,
        utm_campaign: utm.campaign || tracking.utm_campaign || null,
        utm_term: utm.term || tracking.utm_term || null,
        utm_content: utm.content || tracking.utm_content || null,
        referrer: tracking.referrer || payload.referrer || null,
        raw: body,
        received_at: new Date().toISOString(),
      },
      { onConflict: 'external_id' },
    )
    .select()
    .single();

  if (insertErr) {
    console.error('[iclosed webhook] DB insert error:', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Lie au user si l'email matche un profil existant
  if (inviteeEmail) {
    const { data: profile } = await sb.from('profiles').select('id').eq('email', inviteeEmail).maybeSingle();
    if (profile?.id && insertedRows?.id) {
      await sb.from('bookings').update({ matched_user_id: profile.id, matched_at: new Date().toISOString() }).eq('id', insertedRows.id);
    }
  }

  // Forward à PostHog pour funnels
  await captureServer(
    inviteeEmail || `iclosed-${externalId}`,
    `iclosed_booking_${event}`,
    {
      booking_id: externalId,
      invitee_name: inviteeName,
      invitee_email: inviteeEmail,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      closer,
      utm_source: utm.source || tracking.utm_source,
      utm_medium: utm.medium || tracking.utm_medium,
      utm_campaign: utm.campaign || tracking.utm_campaign,
    },
  );

  return NextResponse.json({ ok: true, event, external_id: externalId });
}
