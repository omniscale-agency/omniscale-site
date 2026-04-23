// Templates HTML pour les emails Omniscale.
// Style : sombre, accent lilac, inspiré de l'identité du site.

interface BaseTemplate {
  preheader: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

const COLORS = {
  bg: '#000000',
  card: '#0a0a0a',
  border: '#1a1a1a',
  text: '#f5f0ff',
  muted: '#888',
  lilac: '#B794E8',
};

function shell({ preheader, title, body, ctaLabel, ctaUrl }: BaseTemplate): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${COLORS.text};">
  <span style="display:none;font-size:1px;color:#000;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:24px;overflow:hidden;">
        <tr><td style="padding:32px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${COLORS.lilac};border-radius:10px;padding:6px 8px;font-weight:700;color:#000;font-size:14px;letter-spacing:.5px;">★</td>
              <td style="padding-left:10px;font-weight:700;font-size:18px;color:${COLORS.text};letter-spacing:-0.3px;">omniscale</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:-0.5px;color:${COLORS.text};line-height:1.2;">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:${COLORS.text};">${body}</div>
          ${ctaLabel && ctaUrl ? `
          <div style="margin-top:32px;">
            <a href="${ctaUrl}" style="display:inline-block;background:${COLORS.lilac};color:#000;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px;">${ctaLabel} →</a>
          </div>` : ''}
        </td></tr>
        <tr><td style="padding:0 40px 32px;border-top:1px solid ${COLORS.border};margin-top:24px;">
          <p style="font-size:12px;color:${COLORS.muted};margin:24px 0 4px;">Omniscale — Agence marketing pour scaler vos commerces</p>
          <p style="font-size:12px;color:${COLORS.muted};margin:0;">
            <a href="https://omniscale.fr" style="color:${COLORS.lilac};text-decoration:none;">omniscale.fr</a>
            · <a href="mailto:contact@omniscale.fr" style="color:${COLORS.lilac};text-decoration:none;">contact@omniscale.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const BASE_URL = 'https://omniscale.fr';

// ============ Templates ============

export function templateNewTask(opts: { clientName: string; taskTitle: string; dueDate?: string; assignee?: string; priority?: string }) {
  const dueLine = opts.dueDate ? `<p style="margin:8px 0;color:#aaa;">📅 Échéance : <strong style="color:#fff;">${new Date(opts.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>` : '';
  const prioLine = opts.priority === 'high' ? `<p style="margin:8px 0;color:#f87171;">⚡ <strong>Priorité haute</strong></p>` : '';
  const assigneeLine = opts.assignee ? `<p style="margin:8px 0;color:#aaa;">👤 Assignée à : <strong style="color:#fff;">${opts.assignee}</strong></p>` : '';
  return shell({
    preheader: `Nouvelle tâche : ${opts.taskTitle}`,
    title: `Nouvelle tâche pour toi 📋`,
    body: `
      <p>Salut ${opts.clientName},</p>
      <p>L'équipe Omniscale t'a assigné une nouvelle tâche dans ton espace client :</p>
      <div style="margin:24px 0;padding:20px;background:rgba(183,148,232,0.08);border:1px solid rgba(183,148,232,0.2);border-radius:14px;">
        <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#B794E8;">${opts.taskTitle}</p>
        ${dueLine}${prioLine}${assigneeLine}
      </div>
      <p>Connecte-toi à ton espace pour la cocher quand c'est fait.</p>
    `,
    ctaLabel: 'Voir mes tâches',
    ctaUrl: `${BASE_URL}/dashboard/todos`,
  });
}

/** URL pour ajouter un événement à Google Calendar en un clic (sans OAuth). */
export function buildGCalUrl(opts: { eventTitle: string; startsAt: string; duration: number; with?: string; type?: string }): string {
  try {
    const start = new Date(opts.startsAt);
    const end = new Date(start.getTime() + opts.duration * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Omniscale — ${opts.eventTitle}`);
    url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`);
    const typeLabels: Record<string, string> = { call: 'Appel visio', shooting: 'Shooting', review: 'Revue', workshop: 'Atelier' };
    const details = `${typeLabels[opts.type || ''] || 'Événement'} avec ${opts.with || 'Omniscale'}.\n\nLien visio envoyé par email avant le RDV.\n\nDes questions ? contact@omniscale.fr`;
    url.searchParams.set('details', details);
    return url.toString();
  } catch {
    return '#';
  }
}

export function templateNewEvent(opts: { clientName: string; eventTitle: string; startsAt: string; duration: number; type: string; with: string }) {
  const d = new Date(opts.startsAt);
  const date = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const typeLabels: Record<string, string> = { call: '📞 Appel visio', shooting: '🎬 Shooting', review: '🔎 Revue', workshop: '🎓 Atelier' };
  const gcalUrl = buildGCalUrl(opts);
  return shell({
    preheader: `RDV planifié : ${opts.eventTitle} — ${date} à ${time}`,
    title: `Nouveau rendez-vous planifié 📅`,
    body: `
      <p>Salut ${opts.clientName},</p>
      <p>Un nouveau rendez-vous a été planifié pour toi :</p>
      <div style="margin:24px 0;padding:20px;background:rgba(183,148,232,0.08);border:1px solid rgba(183,148,232,0.2);border-radius:14px;">
        <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#B794E8;">${opts.eventTitle}</p>
        <p style="margin:8px 0;color:#aaa;">📆 <strong style="color:#fff;text-transform:capitalize;">${date}</strong> à <strong style="color:#fff;">${time}</strong></p>
        <p style="margin:8px 0;color:#aaa;">⏱ Durée : <strong style="color:#fff;">${opts.duration} minutes</strong></p>
        <p style="margin:8px 0;color:#aaa;">${typeLabels[opts.type] || opts.type}</p>
        <p style="margin:8px 0;color:#aaa;">👥 Avec : <strong style="color:#fff;">${opts.with}</strong></p>
      </div>
      <p style="text-align:center;margin:20px 0;">
        <a href="${gcalUrl}" style="display:inline-block;background:rgba(183,148,232,0.12);border:1px solid rgba(183,148,232,0.4);color:#B794E8;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">📅 Ajouter à Google Calendar</a>
      </p>
      <p>Le lien visio te sera envoyé peu avant le RDV.</p>
    `,
    ctaLabel: 'Voir mon agenda',
    ctaUrl: `${BASE_URL}/dashboard/calendar`,
  });
}

export function templateNewInvoice(opts: { clientName: string; invoiceId: string; amount: string; dueAt: string; type: 'invoice' | 'payment_request' }) {
  const isReq = opts.type === 'payment_request';
  const due = new Date(opts.dueAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return shell({
    preheader: `${isReq ? 'Demande de paiement' : 'Facture'} ${opts.invoiceId} — ${opts.amount}`,
    title: `${isReq ? 'Nouvelle demande de paiement' : 'Nouvelle facture'} 💳`,
    body: `
      <p>Salut ${opts.clientName},</p>
      <p>Une ${isReq ? 'demande de paiement' : 'facture'} vient d'être émise pour ton compte :</p>
      <div style="margin:24px 0;padding:20px;background:rgba(183,148,232,0.08);border:1px solid rgba(183,148,232,0.2);border-radius:14px;">
        <p style="margin:0 0 4px;font-size:13px;color:#888;letter-spacing:1px;">N° ${opts.invoiceId}</p>
        <p style="margin:0 0 16px;font-size:32px;font-weight:700;color:#B794E8;letter-spacing:-1px;">${opts.amount}</p>
        <p style="margin:0;color:#aaa;">À régler avant le <strong style="color:#fff;">${due}</strong></p>
      </div>
      <p>Tu peux retrouver le PDF dans ton espace facturation.</p>
    `,
    ctaLabel: 'Voir mes factures',
    ctaUrl: `${BASE_URL}/dashboard/invoices`,
  });
}

export function templateNewLeadAdmin(opts: { name: string; email: string; brand?: string; sector?: string; city?: string; monthlyRevenue?: string }) {
  return shell({
    preheader: `Nouveau lead inscrit : ${opts.name} (${opts.brand || opts.email})`,
    title: `Nouveau lead inscrit 🚀`,
    body: `
      <p>Un nouveau lead vient de s'inscrire sur omniscale.fr :</p>
      <div style="margin:24px 0;padding:20px;background:rgba(183,148,232,0.08);border:1px solid rgba(183,148,232,0.2);border-radius:14px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#B794E8;">${opts.name}</p>
        <p style="margin:6px 0;color:#aaa;">📧 <a href="mailto:${opts.email}" style="color:#fff;text-decoration:none;">${opts.email}</a></p>
        ${opts.brand ? `<p style="margin:6px 0;color:#aaa;">🏪 Marque : <strong style="color:#fff;">${opts.brand}</strong></p>` : ''}
        ${opts.sector ? `<p style="margin:6px 0;color:#aaa;">🏷 Secteur : <strong style="color:#fff;">${opts.sector}</strong></p>` : ''}
        ${opts.city ? `<p style="margin:6px 0;color:#aaa;">📍 Ville : <strong style="color:#fff;">${opts.city}</strong></p>` : ''}
        ${opts.monthlyRevenue ? `<p style="margin:6px 0;color:#aaa;">💰 CA mensuel : <strong style="color:#fff;">${opts.monthlyRevenue}</strong></p>` : ''}
      </div>
      <p>À toi de jouer pour le qualifier 👇</p>
    `,
    ctaLabel: 'Ouvrir la console admin',
    ctaUrl: `${BASE_URL}/admin/users`,
  });
}

export function templateWelcomeLead(opts: { name: string }) {
  return shell({
    preheader: `Bienvenue chez Omniscale ${opts.name} ! Ton compte est prêt.`,
    title: `Bienvenue chez Omniscale 👋`,
    body: `
      <p>Salut ${opts.name},</p>
      <p>Ton compte est créé. Tu as maintenant accès à nos <strong>conseils scaling gratuits</strong> et à notre chaîne YouTube.</p>
      <p style="margin:24px 0;color:#aaa;">Pour débloquer ton espace client complet (stats temps réel, suivi de campagnes, agenda partagé, factures), réserve un appel découverte de 45 min — c'est gratuit, sans engagement.</p>
      <p>À très vite,<br>L'équipe Omniscale</p>
    `,
    ctaLabel: 'Réserver un appel gratuit',
    ctaUrl: 'https://app.iclosed.io/e/OMNISCALE/45min',
  });
}
