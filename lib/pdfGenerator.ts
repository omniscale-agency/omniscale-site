'use client';
import jsPDF from 'jspdf';
import { InvoiceDoc, computeTotals } from './invoicesStore';

const COLORS = {
  ink: [10, 10, 10] as [number, number, number],
  lilac: [183, 148, 232] as [number, number, number],
  muted: [110, 110, 120] as [number, number, number],
  divider: [230, 230, 240] as [number, number, number],
};

function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

function frDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateInvoicePDF(doc: InvoiceDoc): { dataUrl: string; blob: Blob } {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  const isPaymentReq = doc.type === 'payment_request';
  const docLabel = isPaymentReq ? 'DEMANDE DE PAIEMENT' : 'FACTURE';

  // Header — logo block (purple square) + "OMNISCALE"
  pdf.setFillColor(...COLORS.lilac);
  pdf.roundedRect(margin, y, 14, 14, 3, 3, 'F');
  pdf.setFontSize(20);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.text('omniscale', margin + 18, y + 9);

  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Agence marketing — scaling commerces & e-commerce', margin + 18, y + 14);

  // Doc title (right aligned)
  pdf.setFontSize(22);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.text(docLabel, W - margin, y + 9, { align: 'right' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`N° ${doc.id}`, W - margin, y + 15, { align: 'right' });

  y += 28;
  // Divider
  pdf.setDrawColor(...COLORS.divider);
  pdf.line(margin, y, W - margin, y);
  y += 10;

  // From / To
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ÉMETTEUR', margin, y);
  pdf.text('CLIENT', W / 2, y);

  y += 5;
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Omniscale', margin, y);
  pdf.text(doc.clientBrand, W / 2, y);

  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text('contact@omniscale.fr', margin, y);
  pdf.text(doc.clientEmail, W / 2, y);
  y += 5;
  pdf.text('+33 7 80 95 47 83', margin, y);

  y += 14;

  // Dates block
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DATE D\u2019\u00C9MISSION', margin, y);
  pdf.text(isPaymentReq ? 'DATE LIMITE DE PAIEMENT' : 'DATE D\u2019\u00C9CH\u00C9ANCE', W / 2, y);

  y += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.text(frDate(doc.issuedAt), margin, y);
  pdf.text(frDate(doc.dueAt), W / 2, y);

  y += 12;
  pdf.line(margin, y, W - margin, y);
  y += 8;

  // Table header
  pdf.setFillColor(245, 240, 252);
  pdf.rect(margin, y - 5, W - 2 * margin, 9, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.ink);
  pdf.text('DESCRIPTION', margin + 2, y);
  pdf.text('QTÉ', W - margin - 60, y, { align: 'right' });
  pdf.text('PRIX UNIT.', W - margin - 30, y, { align: 'right' });
  pdf.text('TOTAL HT', W - margin - 2, y, { align: 'right' });

  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  doc.lines.forEach((line) => {
    const lineTotal = line.quantity * line.unitPrice;
    pdf.setTextColor(...COLORS.ink);

    // Wrap description if long
    const descLines = pdf.splitTextToSize(line.description, W - 2 * margin - 80);
    descLines.forEach((l: string, i: number) => {
      pdf.text(l, margin + 2, y + i * 5);
    });
    pdf.text(line.quantity.toString(), W - margin - 60, y, { align: 'right' });
    pdf.text(eur(line.unitPrice), W - margin - 30, y, { align: 'right' });
    pdf.text(eur(lineTotal), W - margin - 2, y, { align: 'right' });

    const linesUsed = Math.max(1, descLines.length);
    y += linesUsed * 5 + 3;
    pdf.setDrawColor(...COLORS.divider);
    pdf.line(margin, y, W - margin, y);
    y += 5;
  });

  y += 4;
  const totals = computeTotals(doc.lines, doc.vatRate);
  const labelX = W - margin - 50;
  const valueX = W - margin - 2;

  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.muted);
  pdf.text('Sous-total HT', labelX, y, { align: 'right' });
  pdf.setTextColor(...COLORS.ink);
  pdf.text(eur(totals.subtotal), valueX, y, { align: 'right' });

  y += 6;
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`TVA ${doc.vatRate}%`, labelX, y, { align: 'right' });
  pdf.setTextColor(...COLORS.ink);
  pdf.text(eur(totals.vat), valueX, y, { align: 'right' });

  y += 8;
  pdf.setFillColor(...COLORS.lilac);
  pdf.roundedRect(W - margin - 80, y - 4, 80, 12, 2, 2, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.ink);
  pdf.text('TOTAL TTC', labelX, y + 3, { align: 'right' });
  pdf.text(eur(totals.total), valueX, y + 3, { align: 'right' });

  y += 22;

  // Notes
  if (doc.notes) {
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', margin, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.ink);
    const noteLines = pdf.splitTextToSize(doc.notes, W - 2 * margin);
    pdf.text(noteLines, margin, y);
    y += noteLines.length * 5 + 6;
  }

  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 18;
  pdf.setDrawColor(...COLORS.divider);
  pdf.line(margin, footerY - 5, W - margin, footerY - 5);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(
    isPaymentReq
      ? 'Demande de paiement — Merci de procéder au règlement avant la date limite indiquée.'
      : 'Facture émise par Omniscale — Conditions : paiement à 30 jours sauf indication contraire.',
    W / 2,
    footerY,
    { align: 'center' },
  );
  pdf.text('omniscale.fr · contact@omniscale.fr', W / 2, footerY + 5, { align: 'center' });

  const blob = pdf.output('blob');
  const dataUrl = pdf.output('datauristring');
  return { dataUrl, blob };
}

export function downloadPDF(doc: InvoiceDoc) {
  const { blob } = generateInvoicePDF(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.id}-${doc.clientBrand.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
