'use client';
import jsPDF from 'jspdf';
import { InvoiceDoc, computeTotals } from './invoicesStore';
import { getCompanySettings } from './companySettings';

const COLORS = {
  ink: [10, 10, 10] as [number, number, number],
  lilac: [183, 148, 232] as [number, number, number],
  muted: [110, 110, 120] as [number, number, number],
  divider: [230, 230, 240] as [number, number, number],
  bgLight: [245, 240, 252] as [number, number, number],
};

function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

function frDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Dessine le logo Omniscale (3 chevrons en halftone) en vectoriel sur le PDF.
 * Reproduit le SVG du composant Logo en utilisant les primitives jsPDF.
 */
function drawOmniscaleLogo(pdf: jsPDF, x: number, y: number, size: number) {
  // Fond carré violet arrondi
  pdf.setFillColor(...COLORS.lilac);
  pdf.roundedRect(x, y, size, size, size * 0.18, size * 0.18, 'F');

  // 3 chevrons en cercles blancs (halftone simplifié)
  // Chaque chevron = forme triangulaire pointant haut-droite, formée de 3 rangées de cercles
  pdf.setFillColor(255, 255, 255);

  const dotR = size * 0.025;
  const drawChevron = (cx: number, cy: number, scale: number) => {
    // Forme: triangle qui pointe en haut-droite, créé en empilant des rangées de petits cercles
    const rows = [
      { offset: -0.30, count: 7 },
      { offset: -0.18, count: 6 },
      { offset: -0.06, count: 5 },
      { offset: 0.06, count: 4 },
      { offset: 0.18, count: 3 },
    ];
    rows.forEach((row) => {
      for (let i = 0; i < row.count; i++) {
        const dx = (i - (row.count - 1) / 2) * size * 0.06 * scale;
        const dy = row.offset * size * scale;
        // rotation 12° anti-horaire pour l'inclinaison
        const angle = -12 * Math.PI / 180;
        const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
        const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
        pdf.circle(cx + rx, cy + ry, dotR * scale, 'F');
      }
    });
  };

  // 3 chevrons décalés
  drawChevron(x + size * 0.66, y + size * 0.32, 0.85);
  drawChevron(x + size * 0.55, y + size * 0.55, 0.85);
  drawChevron(x + size * 0.44, y + size * 0.78, 0.85);
}

export function generateInvoicePDF(doc: InvoiceDoc): { dataUrl: string; blob: Blob } {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  const company = getCompanySettings();
  const isPaymentReq = doc.type === 'payment_request';
  const docLabel = isPaymentReq ? 'DEMANDE DE PAIEMENT' : 'FACTURE';

  // ============ HEADER ============
  drawOmniscaleLogo(pdf, margin, y, 16);

  pdf.setFontSize(20);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.text(company.name.toLowerCase(), margin + 20, y + 9);

  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Agence marketing — scaling commerces & e-commerce', margin + 20, y + 13);

  // Doc title
  pdf.setFontSize(22);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.text(docLabel, W - margin, y + 8, { align: 'right' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.lilac);
  pdf.text(`N° ${doc.id}`, W - margin, y + 14, { align: 'right' });

  y += 26;
  pdf.setDrawColor(...COLORS.divider);
  pdf.line(margin, y, W - margin, y);
  y += 8;

  // ============ FROM / TO ============
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ÉMETTEUR', margin, y);
  pdf.text('FACTURÉ À', W / 2, y);

  y += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.text(company.legalName || company.name, margin, y);
  pdf.text(doc.clientBrand, W / 2, y);

  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  if (company.address) { pdf.text(company.address, margin, y); }
  pdf.text(doc.clientEmail, W / 2, y);
  if (company.address) y += 4;
  if (company.zip || company.city) { pdf.text(`${company.zip} ${company.city}`.trim(), margin, y); y += 4; }
  if (company.email) { pdf.text(company.email, margin, y); y += 4; }
  if (company.phone) { pdf.text(company.phone, margin, y); y += 4; }
  if (company.siret) { pdf.text(`SIRET : ${company.siret}`, margin, y); y += 4; }
  if (company.vatNumber) { pdf.text(`TVA : ${company.vatNumber}`, margin, y); y += 4; }

  y += 8;

  // ============ DATES ============
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.text("DATE D'\u00C9MISSION", margin, y);
  pdf.text(isPaymentReq ? 'DATE LIMITE DE PAIEMENT' : "DATE D'\u00C9CH\u00C9ANCE", W / 2, y);

  y += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont('helvetica', 'normal');
  pdf.text(frDate(doc.issuedAt), margin, y);
  pdf.text(frDate(doc.dueAt), W / 2, y);

  y += 10;
  pdf.line(margin, y, W - margin, y);
  y += 6;

  // ============ TABLE LIGNES ============
  pdf.setFillColor(...COLORS.bgLight);
  pdf.rect(margin, y - 5, W - 2 * margin, 9, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.ink);
  pdf.text('PRODUIT / DESCRIPTION', margin + 2, y);
  pdf.text('DURÉE', W - margin - 75, y, { align: 'right' });
  pdf.text('QTÉ', W - margin - 50, y, { align: 'right' });
  pdf.text('PRIX UNIT.', W - margin - 25, y, { align: 'right' });
  pdf.text('TOTAL HT', W - margin - 2, y, { align: 'right' });

  y += 7;
  pdf.setFont('helvetica', 'normal');

  doc.lines.forEach((line) => {
    const lineTotal = line.quantity * line.unitPrice;

    // Nom produit (gras) + description (régulier en dessous)
    if (line.productName) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.ink);
      pdf.text(line.productName, margin + 2, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.muted);
      const descLines = pdf.splitTextToSize(line.description, W - 2 * margin - 90);
      descLines.forEach((l: string, i: number) => {
        pdf.text(l, margin + 2, y + i * 4);
      });
      y += descLines.length * 4;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.ink);
      const descLines = pdf.splitTextToSize(line.description, W - 2 * margin - 90);
      descLines.forEach((l: string, i: number) => {
        pdf.text(l, margin + 2, y + i * 5);
      });
      y += descLines.length * 5;
    }

    // Colonnes droites alignées sur la première ligne
    const lineY = y - 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.ink);
    if (line.duration) {
      pdf.text(line.duration, W - margin - 75, lineY, { align: 'right' });
    } else {
      pdf.setTextColor(...COLORS.muted);
      pdf.text('—', W - margin - 75, lineY, { align: 'right' });
      pdf.setTextColor(...COLORS.ink);
    }
    pdf.text(line.quantity.toString(), W - margin - 50, lineY, { align: 'right' });
    pdf.text(eur(line.unitPrice), W - margin - 25, lineY, { align: 'right' });
    pdf.text(eur(lineTotal), W - margin - 2, lineY, { align: 'right' });

    y += 4;
    pdf.setDrawColor(...COLORS.divider);
    pdf.line(margin, y, W - margin, y);
    y += 4;
  });

  y += 4;

  // ============ TOTAUX ============
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

  y += 18;

  // ============ COORDONNÉES BANCAIRES ============
  if (company.iban || company.bic || company.bankName) {
    pdf.setFillColor(248, 248, 252);
    pdf.roundedRect(margin, y, W - 2 * margin, 26, 2, 2, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.lilac);
    pdf.text('COORDONNÉES BANCAIRES', margin + 4, y + 5);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.ink);

    let bankY = y + 11;
    if (company.bankName) {
      pdf.text(`Banque : ${company.bankName}`, margin + 4, bankY);
      bankY += 4;
    }
    if (company.iban) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('IBAN : ', margin + 4, bankY);
      pdf.setFont('courier', 'normal');
      pdf.text(company.iban, margin + 18, bankY);
      bankY += 4;
    }
    if (company.bic) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('BIC : ', margin + 4, bankY);
      pdf.setFont('courier', 'normal');
      pdf.text(company.bic, margin + 16, bankY);
    }
    pdf.setFont('helvetica', 'normal');
    y += 30;
  }

  // ============ NOTES ============
  if (doc.notes) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.muted);
    pdf.text('NOTES', margin, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.ink);
    const noteLines = pdf.splitTextToSize(doc.notes, W - 2 * margin);
    pdf.text(noteLines, margin, y);
    y += noteLines.length * 4 + 4;
  }

  // ============ FOOTER ============
  const footerY = H - 16;
  pdf.setDrawColor(...COLORS.divider);
  pdf.line(margin, footerY - 5, W - margin, footerY - 5);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(
    company.invoiceFooter || (isPaymentReq
      ? 'Demande de paiement — Merci de procéder au règlement avant la date limite indiquée.'
      : `Facture émise par ${company.name} — Conditions : paiement à ${company.defaultPaymentTerms} jours sauf indication contraire.`),
    W / 2,
    footerY,
    { align: 'center' },
  );
  pdf.text(`${company.website} · ${company.email}`, W / 2, footerY + 4, { align: 'center' });

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
