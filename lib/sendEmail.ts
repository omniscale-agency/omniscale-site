'use client';

/** Client helper pour appeler l'API route /api/send-email */
export type EmailKind =
  | 'task' | 'event' | 'invoice' | 'new_lead_admin' | 'welcome_lead'
  | 'task_cancelled' | 'event_cancelled' | 'booking_confirmed';

export async function sendEmail(kind: EmailKind, to: string, data: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, to, data }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: false, error: j.error || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Network error' };
  }
}
