'use client';

export interface InvoiceLine {
  productName?: string;     // ex: "Accompagnement marketing"
  description: string;      // détails complémentaires
  duration?: string;        // ex: "3 mois", "12 séances"
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDoc {
  id: string;            // F-2026-0042
  clientSlug: string;
  clientBrand: string;
  clientEmail: string;
  issuedAt: string;      // ISO date
  dueAt: string;         // ISO date
  lines: InvoiceLine[];
  vatRate: number;       // ex 20
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  type: 'invoice' | 'payment_request';
  pdfDataUrl?: string;   // base64 du PDF
  sentAt?: string;
  paidAt?: string;
}

const KEY = 'omniscale_invoices_v1';

function read(): InvoiceDoc[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as InvoiceDoc[]; } catch { return []; }
}

function write(items: InvoiceDoc[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('omniscale-invoices-change'));
}

export function listInvoices(): InvoiceDoc[] {
  return read();
}

export function listInvoicesForClient(slug: string): InvoiceDoc[] {
  return read().filter((i) => i.clientSlug === slug && i.status !== 'draft');
}

export function nextInvoiceId(): string {
  const items = read();
  const year = new Date().getFullYear();
  const yearItems = items.filter((i) => i.id.startsWith(`F-${year}-`));
  const next = (yearItems.length + 1).toString().padStart(4, '0');
  return `F-${year}-${next}`;
}

export function createInvoice(doc: Omit<InvoiceDoc, 'id'>): InvoiceDoc {
  const items = read();
  const newDoc: InvoiceDoc = { ...doc, id: nextInvoiceId() };
  write([newDoc, ...items]);
  return newDoc;
}

export function updateInvoice(id: string, patch: Partial<InvoiceDoc>) {
  const items = read();
  write(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export function deleteInvoice(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function computeTotals(lines: InvoiceLine[], vatRate: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

export function subscribeInvoices(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const h = () => cb();
  window.addEventListener('omniscale-invoices-change', h);
  window.addEventListener('storage', h);
  return () => {
    window.removeEventListener('omniscale-invoices-change', h);
    window.removeEventListener('storage', h);
  };
}
