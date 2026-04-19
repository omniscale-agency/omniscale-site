'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText, Download, Send, Eye } from 'lucide-react';
import { CLIENTS, formatCurrency } from '@/lib/mockData';
import { createInvoice, computeTotals, updateInvoice, InvoiceLine } from '@/lib/invoicesStore';
import { generateInvoicePDF, downloadPDF } from '@/lib/pdfGenerator';
import { sendEmail } from '@/lib/sendEmail';
import { formatCurrency as fmtEur } from '@/lib/mockData';

type DocType = 'invoice' | 'payment_request';

interface Props {
  open: boolean;
  type: DocType;
  defaultClientSlug?: string;
  onClose: () => void;
  onSent?: () => void;
}

export default function InvoiceCreator({ open, type, defaultClientSlug, onClose, onSent }: Props) {
  const [clientSlug, setClientSlug] = useState(defaultClientSlug || CLIENTS[0].slug);
  const today = new Date().toISOString().slice(0, 10);
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [issuedAt, setIssuedAt] = useState(today);
  const [dueAt, setDueAt] = useState(dueDefault);
  const [lines, setLines] = useState<InvoiceLine[]>([
    { productName: 'Accompagnement marketing', description: 'Stratégie social media + ads + suivi hebdomadaire', duration: '1 mois', quantity: 1, unitPrice: 2500 },
  ]);
  const [vatRate, setVatRate] = useState(20);
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const client = CLIENTS.find((c) => c.slug === clientSlug)!;
  const totals = useMemo(() => computeTotals(lines, vatRate), [lines, vatRate]);

  const updateLine = (i: number, patch: Partial<InvoiceLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const addLine = () => setLines((prev) => [...prev, { productName: '', description: '', duration: '', quantity: 1, unitPrice: 0 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const buildDoc = () => ({
    clientSlug: client.slug,
    clientBrand: client.brand,
    clientEmail: client.contact.email,
    issuedAt: new Date(issuedAt).toISOString(),
    dueAt: new Date(dueAt).toISOString(),
    lines: lines.filter((l) => l.description.trim() && l.quantity > 0),
    vatRate,
    status: 'draft' as const,
    notes,
    type,
  });

  const handlePreview = async () => {
    const doc = await createInvoice(buildDoc());
    setCreatedId(doc.id);
    const { blob } = generateInvoicePDF(doc);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const handleDownload = async () => {
    if (!createdId) {
      const doc = await createInvoice(buildDoc());
      setCreatedId(doc.id);
      downloadPDF(doc);
    } else {
      const doc = { ...buildDoc(), id: createdId };
      downloadPDF(doc);
    }
  };

  const handleSend = async () => {
    setSending(true);
    let invoiceId = createdId;
    if (createdId) {
      await updateInvoice(createdId, { status: 'sent', sentAt: new Date().toISOString() });
    } else {
      const created = await createInvoice({ ...buildDoc(), status: 'sent', sentAt: new Date().toISOString() });
      invoiceId = created.id;
    }
    // Email réel au client
    if (client.contact.email && invoiceId) {
      sendEmail('invoice', client.contact.email, {
        clientName: client.contact.name,
        invoiceId,
        amount: fmtEur(totals.total),
        dueAt: new Date(dueAt).toISOString(),
        type,
      }).catch(() => {});
    }
    setSending(false);
    onSent?.();
    onClose();
  };

  const reset = () => {
    setLines([{ description: 'Accompagnement marketing — mois en cours', quantity: 1, unitPrice: 2500 }]);
    setNotes('');
    setIssuedAt(today);
    setDueAt(dueDefault);
    setCreatedId(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const close = () => { reset(); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-black border border-white/10 rounded-2xl shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lilac/15 border border-lilac/30 flex items-center justify-center">
                  <FileText className="text-lilac" size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">
                    {type === 'invoice' ? 'Créer une facture' : 'Demander un paiement'}
                  </h3>
                  <p className="text-xs text-white/50">
                    Remplis les infos, prévisualise, télécharge ou envoie au client.
                  </p>
                </div>
              </div>
              <button onClick={close} className="text-white/50 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Client">
                    <select value={clientSlug} onChange={(e) => setClientSlug(e.target.value)} className={inputCls}>
                      {CLIENTS.map((c) => <option key={c.slug} value={c.slug}>{c.brand}</option>)}
                    </select>
                  </Field>
                  <Field label="TVA (%)">
                    <input type="number" value={vatRate} onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)} className={inputCls} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date d'émission">
                    <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className={inputCls + ' text-white'} />
                  </Field>
                  <Field label={type === 'invoice' ? 'Échéance' : 'Date limite'}>
                    <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputCls + ' text-white'} />
                  </Field>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Lignes / produits</label>
                  <div className="space-y-3">
                    {lines.map((line, i) => (
                      <div key={i} className="rounded-lg bg-white/[0.03] border border-white/10 p-3 space-y-2 relative">
                        <button
                          onClick={() => removeLine(i)}
                          className="absolute top-2 right-2 text-white/30 hover:text-red-400"
                          disabled={lines.length === 1}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                        <input
                          value={line.productName || ''}
                          onChange={(e) => updateLine(i, { productName: e.target.value })}
                          placeholder="Nom du produit / prestation (ex: Accompagnement marketing)"
                          className={inputCls + ' font-semibold'}
                        />
                        <textarea
                          value={line.description}
                          onChange={(e) => updateLine(i, { description: e.target.value })}
                          placeholder="Description détaillée (livrables, périmètre, modalités…)"
                          rows={2}
                          className={inputCls + ' resize-none text-xs'}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Durée</label>
                            <input
                              value={line.duration || ''}
                              onChange={(e) => updateLine(i, { duration: e.target.value })}
                              placeholder="3 mois"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Quantité</label>
                            <input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => updateLine(i, { quantity: parseFloat(e.target.value) || 0 })}
                              className={inputCls}
                              step={1}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Prix unit. (€)</label>
                            <input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className={inputCls}
                              step={50}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addLine} type="button" className="text-sm text-lilac hover:underline inline-flex items-center gap-1">
                      <Plus size={14} /> Ajouter une ligne
                    </button>
                  </div>
                </div>

                <Field label="Notes (optionnel)">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Modalités, références, remerciements…" className={inputCls + ' resize-none'} />
                </Field>

                {/* Totaux */}
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 text-sm space-y-1.5">
                  <Row label="Sous-total HT" value={formatCurrency(totals.subtotal)} />
                  <Row label={`TVA ${vatRate}%`} value={formatCurrency(totals.vat)} />
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <Row label={<span className="font-display font-bold">Total TTC</span>} value={<span className="font-display font-bold text-lg text-lilac">{formatCurrency(totals.total)}</span>} />
                  </div>
                </div>
              </div>

              {/* Preview / Actions */}
              <div className="flex flex-col">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] flex-1 flex items-center justify-center min-h-[400px] overflow-hidden">
                  {previewUrl ? (
                    <iframe src={previewUrl} className="w-full h-full min-h-[400px] rounded-xl bg-white" title="PDF preview" />
                  ) : (
                    <div className="text-center p-8">
                      <FileText size={36} className="text-white/20 mx-auto mb-3" />
                      <div className="text-sm text-white/50 mb-4">Clique sur "Prévisualiser" pour générer le PDF</div>
                      <button onClick={handlePreview} className="bg-lilac/15 text-lilac border border-lilac/30 hover:bg-lilac/25 font-medium px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
                        <Eye size={14} /> Prévisualiser
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={handlePreview} className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
                    <Eye size={14} /> {previewUrl ? 'Régénérer' : 'Prévisualiser'}
                  </button>
                  <button onClick={handleDownload} className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
                    <Download size={14} /> Télécharger
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-lilac text-ink text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-white transition-colors disabled:opacity-60"
                  >
                    <Send size={14} /> {sending ? 'Envoi...' : 'Envoyer au client'}
                  </button>
                </div>
                <p className="text-[11px] text-white/40 mt-2 text-center">
                  ✉️ Email envoyé à {client.contact.email} + apparaît dans l'espace client (mock — vrai SMTP en phase 2)
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-lilac/50 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
