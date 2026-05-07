import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { cancelCall, rescheduleCall } from '@/lib/social/iclosed';

export const runtime = 'nodejs';

/**
 * Endpoints admin sur un booking — propage les actions à iClosed quand la
 * source est 'iclosed', sinon ne touche que notre DB.
 *
 *   DELETE /api/admin/bookings/:id
 *     → si source='iclosed' : cancel iClosed (PUT /v1/eventCalls/cancel)
 *       puis delete la row.
 *     → sinon : delete la row uniquement.
 *
 *   PATCH /api/admin/bookings/:id
 *     body { action: 'reschedule', scheduled_at: ISO, reason?: string }
 *       → si source='iclosed' : reschedule iClosed (PUT /v1/eventCalls/reschedule)
 *         puis update la row.
 *       → sinon : update la row uniquement.
 *     body { action: 'status', event: 'scheduled'|... }
 *       → update la row uniquement (pas de propagation iClosed).
 *
 * Tout est admin-only via supabaseServer().auth + profile check.
 * On utilise ensuite service-role pour bypass RLS sur les writes (au cas
 * où, même si admin a déjà bookings_admin_all).
 */

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function checkAdmin(): Promise<{ ok: boolean; error?: NextResponse }> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { ok: false, error: NextResponse.json({ error: 'Admin requis' }, { status: 403 }) };
  return { ok: true };
}

// ── DELETE ──
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.error!;
  const { id } = await ctx.params;
  const admin = getAdmin();

  // Lookup booking
  const { data: booking, error: lookupErr } = await admin
    .from('bookings')
    .select('id, source, external_id, invitee_name, invitee_email')
    .eq('id', id)
    .maybeSingle();
  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!booking) return NextResponse.json({ error: 'Booking introuvable' }, { status: 404 });

  const warnings: string[] = [];

  // Si iclosed : cancel côté iClosed (best-effort)
  if (booking.source === 'iclosed' && booking.external_id) {
    const apiKey = process.env.ICLOSED_API_KEY;
    if (!apiKey) {
      warnings.push('ICLOSED_API_KEY non configurée — annulation iClosed sautée');
    } else {
      try {
        await cancelCall({
          apiKey,
          id: booking.external_id,
          reason: 'Annulé depuis Omniscale SaaS',
        });
      } catch (e: any) {
        warnings.push(`Annulation iClosed échouée : ${e?.message?.slice(0, 200) || 'unknown'}`);
      }
    }
  }

  // Delete row
  const { error: delErr } = await admin.from('bookings').delete().eq('id', id);
  if (delErr) return NextResponse.json({ error: delErr.message, warnings }, { status: 500 });

  return NextResponse.json({
    ok: true,
    deleted_id: id,
    cancelled_in_iclosed: booking.source === 'iclosed' && warnings.length === 0,
    warnings,
  });
}

// ── PATCH ──
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.error!;
  const { id } = await ctx.params;

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 }); }
  const action = body?.action;

  const admin = getAdmin();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, source, external_id')
    .eq('id', id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'Booking introuvable' }, { status: 404 });

  const warnings: string[] = [];

  // ── action: reschedule ──
  if (action === 'reschedule') {
    const newScheduledAt = body.scheduled_at as string | undefined;
    if (!newScheduledAt) return NextResponse.json({ error: 'scheduled_at manquant' }, { status: 400 });

    if (booking.source === 'iclosed' && booking.external_id) {
      const apiKey = process.env.ICLOSED_API_KEY;
      if (!apiKey) {
        warnings.push('ICLOSED_API_KEY non configurée — reschedule iClosed sautée');
      } else {
        try {
          await rescheduleCall({
            apiKey,
            id: booking.external_id,
            dateTime: new Date(newScheduledAt).toISOString(),
            timeZone: body.timeZone || 'Europe/Paris',
            reason: body.reason || 'Reprogrammé depuis Omniscale SaaS',
          });
        } catch (e: any) {
          warnings.push(`Reschedule iClosed échouée : ${e?.message?.slice(0, 200) || 'unknown'}`);
        }
      }
    }

    const { error } = await admin
      .from('bookings')
      .update({ scheduled_at: new Date(newScheduledAt).toISOString(), event: 'rescheduled' })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message, warnings }, { status: 500 });

    return NextResponse.json({
      ok: true,
      action: 'reschedule',
      synced_with_iclosed: booking.source === 'iclosed' && warnings.length === 0,
      warnings,
    });
  }

  // ── action: status ──
  if (action === 'status') {
    const newEvent = body.event as string;
    const allowed = ['scheduled', 'rescheduled', 'cancelled', 'completed', 'no_show'];
    if (!allowed.includes(newEvent)) {
      return NextResponse.json({ error: `event invalide (allowed: ${allowed.join(', ')})` }, { status: 400 });
    }

    // Si on passe à 'cancelled' et c'est un iClosed booking → cancel côté iClosed aussi
    if (newEvent === 'cancelled' && booking.source === 'iclosed' && booking.external_id) {
      const apiKey = process.env.ICLOSED_API_KEY;
      if (apiKey) {
        try {
          await cancelCall({
            apiKey,
            id: booking.external_id,
            reason: 'Marqué annulé depuis Omniscale SaaS',
          });
        } catch (e: any) {
          warnings.push(`Annulation iClosed échouée : ${e?.message?.slice(0, 200) || 'unknown'}`);
        }
      }
    }

    const { error } = await admin.from('bookings').update({ event: newEvent }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message, warnings }, { status: 500 });
    return NextResponse.json({ ok: true, action: 'status', event: newEvent, warnings });
  }

  return NextResponse.json({ error: `action inconnue: ${action}` }, { status: 400 });
}
