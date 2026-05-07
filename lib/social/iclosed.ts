// iClosed API client — server-side only.
// Doc : https://developer.iclosed.io
// Auth : Bearer token via header `Authorization: Bearer iclosed_xxx`.
//
// On utilise ce client pour POLLER les bookings depuis iClosed parce que
// leur webhook est silencieux dans le free tier (jamais firé même
// avec event=STRATEGY_EVENT correctement typé). L'API REST fonctionne.

const BASE_URL = 'https://public.api.iclosed.io';

export type IClosedEventType = 'UPCOMING' | 'PAST' | 'ALL';

export interface IClosedEventCall {
  id: number;
  eventId: number;
  dateTime: string;          // "2026-05-07 09:00:00.000" (local, sans TZ)
  dateTimeUTC: string;       // "2026-05-07T07:00:00.000Z" (utiliser celui-ci)
  userId: number;
  location: string;          // "GOOGLE_MEET" / "ZOOM" / etc.
  locationLink?: string | null;
  cancelReason?: string | null;
  rescheduledBy?: string | null;
  cancelledBy?: string | null;
  callType: string;          // "STRATEGY_EVENT" / "DISCOVERY_EVENT"
  duration: number;
  durationUnit: string;      // "MINUTES"
  createdAt: string;         // ISO
  updatedAt: string;         // ISO
  contactId?: number;
  inviteeName?: string | null;
  inviteeEmail?: string | null;
  phoneNumber?: string | null;
  inviteTimeZone?: string | null;
  user?: { id: number; firstName: string; lastName: string; email: string };
  event?: {
    name: string;
    eventType: string;
    linkPrefix: string;
    duration: number;
    durationUnit: string;
    location: string;
  };
  task?: Array<{
    id: number;
    completed: boolean;
    outcome: string | null;       // ex: "WIN", "LOSS", "NO_SHOW" — selon iClosed
    noSaleReason: string | null;
    objection: string | null;
    notes: string | null;
  }>;
  utm?: Array<{ source?: string; medium?: string; campaign?: string; term?: string; content?: string }>;
  questions?: Array<{ statement: string; answer: string }>;
}

interface ListResponse {
  data: { eventCalls: IClosedEventCall[] };
}

/**
 * Fetch les eventCalls iClosed.
 * Par défaut on récupère ALL (UPCOMING + PAST + cancelled inclus dans PAST).
 * `limit` = max d'items renvoyés (max iClosed = 50 par défaut).
 */
export async function fetchRecentEventCalls(opts: {
  apiKey: string;
  type?: IClosedEventType;
  limit?: number;
}): Promise<IClosedEventCall[]> {
  const type = opts.type || 'ALL';
  const limit = opts.limit || 50;

  const url = `${BASE_URL}/v1/eventCalls?eventType=${type}&limit=${limit}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${opts.apiKey}` },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`iClosed API ${type} failed (${r.status}): ${t.slice(0, 300)}`);
  }
  const json = (await r.json()) as ListResponse;
  return json?.data?.eventCalls || [];
}

/**
 * Mappe un eventCall iClosed vers le shape de notre table `bookings`.
 * Détermine l'event status à partir des champs cancelReason / rescheduledBy / task.outcome.
 */
export function mapToBooking(call: IClosedEventCall) {
  // Détection du statut
  let event: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show' = 'scheduled';
  if (call.cancelledBy || call.cancelReason) {
    event = 'cancelled';
  } else if (call.rescheduledBy) {
    event = 'rescheduled';
  } else if (call.task && call.task[0]?.outcome) {
    const outcome = call.task[0].outcome.toUpperCase();
    if (outcome.includes('NO_SHOW') || outcome.includes('NOSHOW')) event = 'no_show';
    else if (outcome.includes('WIN') || outcome.includes('LOSS') || outcome.includes('COMPLETED')) event = 'completed';
  }

  // UTM (iClosed le retourne en array d'objets, on prend le premier set)
  const firstUtm = call.utm?.[0] || {};

  // Closer (le user owner du call)
  const closer = call.user
    ? `${call.user.firstName} ${call.user.lastName}`.trim() || call.user.email
    : null;

  return {
    external_id: String(call.id),
    source: 'iclosed',
    event,
    invitee_name: call.inviteeName || null,
    invitee_email: call.inviteeEmail || null,
    invitee_phone: call.phoneNumber || null,
    scheduled_at: call.dateTimeUTC ? new Date(call.dateTimeUTC).toISOString() : null,
    duration_minutes: call.duration || null,
    closer,
    meeting_url: call.locationLink || null,
    utm_source: firstUtm.source || null,
    utm_medium: firstUtm.medium || null,
    utm_campaign: firstUtm.campaign || null,
    utm_term: firstUtm.term || null,
    utm_content: firstUtm.content || null,
    referrer: null,
    raw: call as any,
    received_at: new Date().toISOString(),
  };
}
