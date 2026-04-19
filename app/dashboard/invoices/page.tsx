'use client';
import { useEffect, useState } from 'react';
import { FileText, Download, CheckCircle2, Clock, Receipt, Send } from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { CLIENTS, getClientBySlug, formatCurrency } from '@/lib/mockData';
import RoleGate from '@/components/RoleGate';
import { listInvoicesForClient, subscribeInvoices, computeTotals, InvoiceDoc } from '@/lib/invoicesStore';
import { downloadPDF } from '@/lib/pdfGenerator';
import Card from '@/components/dashboard/Card';

export default function ClientInvoicesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState(CLIENTS[0]);
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (!s) return;
      setSession(s);
      const c = s.clientSlug ? getClientBySlug(s.clientSlug) : CLIENTS[0];
      setClient(c || CLIENTS[0]);
    });
  }, []);

  useEffect(() => {
    const refresh = async () => setInvoices(await listInvoicesForClient(client.slug));
    refresh();
    return subscribeInvoices(refresh);
  }, [client]);

  if (session?.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Mes factures"><></></RoleGate>;
  }

  const total = invoices.reduce((s, i) => s + computeTotals(i.lines, i.vatRate).total, 0);
  const pending = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + computeTotals(i.lines, i.vatRate).total, 0);
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + computeTotals(i.lines, i.vatRate).total, 0);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Facturation</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Mes factures</h1>
        <p className="text-white/60 mt-2">Toutes les factures et demandes de paiement reçues d'Omniscale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Total reçu</div>
          <div className="font-display text-2xl font-bold">{formatCurrency(total)}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="text-xs uppercase tracking-widest text-amber-400/80 mb-1">À payer</div>
          <div className="font-display text-2xl font-bold text-amber-400">{formatCurrency(pending)}</div>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <div className="text-xs uppercase tracking-widest text-green-400/80 mb-1">Payé</div>
          <div className="font-display text-2xl font-bold text-green-400">{formatCurrency(paid)}</div>
        </div>
      </div>

      <Card title="Documents reçus" icon={FileText} subtitle={`${invoices.length} document(s)`}>
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Receipt size={32} className="mx-auto mb-3 opacity-50" />
            <p>Aucune facture reçue pour le moment.</p>
            <p className="text-xs mt-2 text-white/30">Quand Omniscale t'enverra une facture, elle apparaîtra ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {invoices.map((inv) => {
              const t = computeTotals(inv.lines, inv.vatRate);
              const isPaymentReq = inv.type === 'payment_request';
              return (
                <div key={inv.id} className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center shrink-0">
                    {isPaymentReq ? <Send size={16} className="text-lilac" /> : <FileText size={16} className="text-lilac" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-white/60">{inv.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                        {isPaymentReq ? 'Demande de paiement' : 'Facture'}
                      </span>
                      {inv.status === 'paid' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> Payée
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                          <Clock size={10} /> À payer avant le {new Date(inv.dueAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <div className="font-medium">{inv.lines[0]?.productName || inv.lines[0]?.description || 'Prestations'}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      Émise le {new Date(inv.issuedAt).toLocaleDateString('fr-FR')} · {inv.lines.length} ligne(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-lg">{formatCurrency(t.total)}</div>
                    <div className="text-xs text-white/40">TTC</div>
                  </div>
                  <button onClick={() => downloadPDF(inv)} className="ml-2 inline-flex items-center gap-1.5 bg-white/5 hover:bg-lilac hover:text-ink border border-white/10 hover:border-lilac text-white text-sm px-3 py-2 rounded-lg transition-colors">
                    <Download size={14} /> PDF
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}
