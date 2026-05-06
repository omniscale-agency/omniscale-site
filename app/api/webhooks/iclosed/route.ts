// POST /api/webhooks/iclosed
// Reçoit les events de iClosed (booking scheduled / cancelled / completed / no_show).
// Stocke en BDD + forward à PostHog pour les funnels.
//
// Configuration côté iClosed (admin → Integrations → Webhooks) :
//   URL : https://omniscale.fr/api/webhooks/iclosed
//   Secret : ICLOSED_WEBHOOK_SECRET (vérifié via header X-Iclosed-Signature ou X-Webhook-Secret)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { captureServer } from '@/lib/analytics-server';

export const runtime = 'nodejs';

const SECRET = process.env.ICLOSED_WEBHOOK_SECRET || '';

/** Loggue toute requête entrante (même 401) dans la table webhook_logs.
 *  Best-effort — n'échoue jamais. Permet de diagnostiquer ce qu'iClosed envoie. */
async function logIncoming(req: NextRequest, opts: {
  status: number;
  result: string;
  bodyPreview: string;
}) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // On filtre les headers sensibles (secrets, auth) avant de logger
    const safeHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k.includes('secret') || k.includes('authorization') || k.includes('cookie')) {
        safeHeaders[k] = value ? '[present, redacted]' : '[absent]';
      } else {
        safeHeaders[k] = value;
      }
    });
    await admin.from('webhook_logs').insert({
      endpoint: 'iclosed',
      method: req.method,
      status_code: opts.status,
      result: opts.result,
      headers: safeHeaders,
      body_preview: opts.bodyPreview.slice(0, 2000),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      user_agent: req.headers.get('user-agent') || null,
    });
  } catch (e) {
    // Silent — debugging shouldn't break the webhook
    console.warn('[iclosed webhook] logIncoming failed (non-blocking):', e);
  }
}

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
  // On clone la req pour pouvoir lire le body en raw même si on échoue plus tard.
  const rawBody = await req.text();

  // Verify shared secret (best-effort — iClosed signature scheme à confirmer)
  if (SECRET) {
    const got =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('x-iclosed-secret') ||
      req.headers.get('x-webhook-signature') ||
      req.nextUrl.searchParams.get('secret') ||
      req.nextUrl.searchParams.get('token');
    if (got !== SECRET) {
      console.warn('[iclosed webhook] invalid secret — got:', got ? '[present, mismatch]' : '[absent]');
      await logIncoming(req, { status: 401, result: 'unauthorized_secret_mismatch', bodyPreview: rawBody });
      return NextResponse.json({
        error: 'unauthorized',
        hint: 'Set X-Webhook-Secret header (or ?secret= query param) to match ICLOSED_WEBHOOK_SECRET env var.',
      }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    await logIncoming(req, { status: 400, result: 'invalid_json', bodyPreview: rawBody });
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // iClosed payload shape (à adapter selon doc réelle) — on couvre les noms communs :
  // { event_type|event, booking|invitee|payload : { id, name, email, phone, scheduled_at|start_time, duration, ... } }
  const eventRaw: string = body.event_type || body.event || body.type || '';
  const event = mapEvent(eventRaw);
  if (!event) {
    console.warn('[iclosed webhook] unknown event type:', eventRaw);
    await logIncoming(req, { status: 200, result: `unknown_event:${eventRaw || '(empty)'}`, bodyPreview: rawBody });
    return NextResponse.json({ ok: true, ignored: true, reason: 'unknown_event_type', received_event: eventRaw });
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
    await logIncoming(req, { status: 500, result: `db_error:${insertErr.message.slice(0, 100)}`, bodyPreview: rawBody });
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

  // Notif email admin — fire-and-forget (n'échoue jamais le webhook)
  try {
    const adminEmail = process.env.ADMIN_NOTIF_EMAIL || 'omniscale1@gmail.com';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://omniscale.fr';
    fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'new_booking_admin',
        to: adminEmail,
        data: {
          name: inviteeName,
          email: inviteeEmail,
          phone: inviteePhone,
          scheduledAt,
          closer,
          utmSource: utm.source || tracking.utm_source || null,
          utmCampaign: utm.campaign || tracking.utm_campaign || null,
          event,
        },
      }),
    }).catch((err) => console.warn('[iclosed webhook] admin notif failed (non-blocking):', err));
  } catch (e) {
    console.warn('[iclosed webhook] admin notif setup failed (non-blocking):', e);
  }

  await logIncoming(req, { status: 200, result: `ok:${event}`, bodyPreview: rawBody });
  return NextResponse.json({ ok: true, event, external_id: externalId });
}

/**
 * GET /api/webhooks/iclosed
 * Endpoint de health-check : permet de vérifier que l'URL est joignable
 * sans 307/308 redirect, et que le secret est configuré.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'alive',
    endpoint: 'iclosed',
    secret_configured: SECRET.length > 0,
    canonical_url: 'https://www.omniscale.fr/api/webhooks/iclosed/',
    note: 'Configure ce URL canonique (avec www ET trailing slash) dans iClosed pour éviter les double-redirects 307+308 qui font perdre les POST.',
  });
}
