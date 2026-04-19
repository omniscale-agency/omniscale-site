'use client';
import { supabaseBrowser } from './supabase/client';

export interface InvoiceLine {
  productName?: string;
  description: string;
  duration?: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDoc {
  id: string;
  clientSlug: string;
  clientBrand: string;
  clientEmail: string;
  issuedAt: string;
  dueAt: string;
  lines: InvoiceLine[];
  vatRate: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  type: 'invoice' | 'payment_request';
  pdfDataUrl?: string;
  sentAt?: string;
  paidAt?: string;
}

function fromDB(r: any): InvoiceDoc {
  return {
    id: r.id,
    clientSlug: r.client_slug,
    clientBrand: r.client_brand,
    clientEmail: r.client_email,
    issuedAt: r.issued_at,
    dueAt: r.due_at,
    lines: r.lines || [],
    vatRate: Number(r.vat_rate),
    status: r.status,
    notes: r.notes || undefined,
    type: r.type,
    sentAt: r.sent_at || undefined,
    paidAt: r.paid_at || undefined,
  };
}

export async function listInvoices(): Promise<InvoiceDoc[]> {
  const sb = supabaseBrowser();
  const { data } = await sb.from('invoices').select('*').order('created_at', { ascending: false });
  return (data || []).map(fromDB);
}

export async function listInvoicesForClient(slug: string): Promise<InvoiceDoc[]> {
  const sb = supabaseBrowser();
  const { data } = await sb.from('invoices').select('*')
    .eq('client_slug', slug)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });
  return (data || []).map(fromDB);
}

export async function nextInvoiceId(): Promise<string> {
  const sb = supabaseBrowser();
  const year = new Date().getFullYear();
  const { count } = await sb.from('invoices').select('*', { count: 'exact', head: true })
    .like('id', `F-${year}-%`);
  const next = ((count || 0) + 1).toString().padStart(4, '0');
  return `F-${year}-${next}`;
}

export async function createInvoice(doc: Omit<InvoiceDoc, 'id'>): Promise<InvoiceDoc> {
  const id = await nextInvoiceId();
  const sb = supabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  const { data } = await sb.from('invoices').insert({
    id,
    client_slug: doc.clientSlug,
    client_brand: doc.clientBrand,
    client_email: doc.clientEmail,
    issued_at: doc.issuedAt,
    due_at: doc.dueAt,
    lines: doc.lines,
    vat_rate: doc.vatRate,
    status: doc.status,
    notes: doc.notes || null,
    type: doc.type,
    sent_at: doc.sentAt || null,
    paid_at: doc.paidAt || null,
    created_by: user?.id,
  }).select().single();
  return data ? fromDB(data) : { ...doc, id };
}

export async function updateInvoice(id: string, patch: Partial<InvoiceDoc>) {
  const sb = supabaseBrowser();
  const dbPatch: Record<string, unknown> = {};
  if (patch.status) dbPatch.status = patch.status;
  if ('sentAt' in patch) dbPatch.sent_at = patch.sentAt || null;
  if ('paidAt' in patch) dbPatch.paid_at = patch.paidAt || null;
  if (patch.lines) dbPatch.lines = patch.lines;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;
  if (patch.vatRate !== undefined) dbPatch.vat_rate = patch.vatRate;
  await sb.from('invoices').update(dbPatch).eq('id', id);
}

export async function deleteInvoice(id: string) {
  const sb = supabaseBrowser();
  await sb.from('invoices').delete().eq('id', id);
}

export function computeTotals(lines: InvoiceLine[], vatRate: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

export function subscribeInvoices(cb: () => void): () => void {
  const sb = supabaseBrowser();
  const ch = sb
    .channel('invoices-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => cb())
    .subscribe();
  return () => { sb.removeChannel(ch); };
}
