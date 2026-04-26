import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  templateNewTask, templateNewEvent, templateNewInvoice,
  templateNewLeadAdmin, templateWelcomeLead,
  templateCancelTask, templateCancelEvent,
  templateBookingConfirmed,
} from '@/lib/emailTemplates';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Adresse principale (visible "From") — branded contact@omniscale.fr
const FROM_VERIFIED = 'Omniscale <contact@omniscale.fr>';
const FROM_FALLBACK = 'Omniscale <onboarding@resend.dev>';
const REPLY_TO = 'contact@omniscale.fr';
const ADMIN_EMAIL = 'admin@omniscale.fr';

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }
  const resend = new Resend(RESEND_API_KEY);

  try {
    const body = await req.json();
    const { kind, to, data } = body as { kind: string; to: string; data: Record<string, any> };

    if (!kind || !to) {
      return NextResponse.json({ error: 'Missing kind or to' }, { status: 400 });
    }

    let subject = '';
    let html = '';

    switch (kind) {
      case 'task':
        subject = `Nouvelle tâche : ${data.taskTitle}`;
        html = templateNewTask(data as any);
        break;
      case 'event':
        subject = `Nouveau RDV : ${data.eventTitle}`;
        html = templateNewEvent(data as any);
        break;
      case 'task_cancelled':
        subject = `Tâche annulée : ${data.taskTitle}`;
        html = templateCancelTask(data as any);
        break;
      case 'event_cancelled':
        subject = `RDV annulé : ${data.eventTitle}`;
        html = templateCancelEvent(data as any);
        break;
      case 'booking_confirmed':
        subject = `Ton appel Omniscale est confirmé 🎉`;
        html = templateBookingConfirmed(data as any);
        break;
      case 'invoice':
        subject = `${data.type === 'payment_request' ? 'Demande de paiement' : 'Facture'} ${data.invoiceId} — Omniscale`;
        html = templateNewInvoice(data as any);
        break;
      case 'new_lead_admin':
        subject = `🚀 Nouveau lead inscrit : ${data.name}`;
        html = templateNewLeadAdmin(data as any);
        break;
      case 'welcome_lead':
        subject = `Bienvenue chez Omniscale 👋`;
        html = templateWelcomeLead(data as any);
        break;
      default:
        return NextResponse.json({ error: 'Unknown email kind' }, { status: 400 });
    }

    // Tentative 1 : depuis le domaine custom (si vérifié)
    let result = await resend.emails.send({
      from: FROM_VERIFIED,
      to,
      subject,
      html,
      replyTo: REPLY_TO,
    });

    // Si erreur 403 (domaine non vérifié) → fallback automatique sur onboarding@resend.dev
    if (result.error && /domain.*not.*verif|not allowed|verify.*domain/i.test(result.error.message)) {
      console.warn('[email] omniscale.fr not verified yet, falling back to onboarding@resend.dev');
      result = await resend.emails.send({
        from: FROM_FALLBACK,
        to,
        subject,
        html,
        replyTo: REPLY_TO,
      });
    }

    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (e: any) {
    console.error('send-email error', e);
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}

