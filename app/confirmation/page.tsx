'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, Mail, Youtube } from 'lucide-react';
import Logo from '@/components/Logo';
import Socials from '@/components/Socials';
import YouTubeVideosGrid from '@/components/YouTubeVideosGrid';
import VideoTestimonials from '@/components/VideoTestimonials';
import TrustpilotBadge from '@/components/TrustpilotBadge';
import { CONTACT_EMAIL, YOUTUBE_URL } from '@/lib/config';
import { capture } from '@/lib/analytics';
import { supabaseBrowser } from '@/lib/supabase/client';
import { sendEmail } from '@/lib/sendEmail';

function formatDate(iso: string) {
  if (!iso) return { date: '', time: '' };
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    });
    const time = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });
    return { date, time };
  } catch {
    return { date: '', time: '' };
  }
}

function durationMinutes(start: string, end: string) {
  if (!start || !end) return null;
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(ms / 60000);
  } catch {
    return null;
  }
}

function buildGoogleCalendarUrl(params: {
  title: string;
  start: string;
  end: string;
  details: string;
}) {
  const fmt = (iso: string) =>
    iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const url = new URL('https://www.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', params.title);
  url.searchParams.set('dates', `${fmt(params.start)}/${fmt(params.end)}`);
  url.searchParams.set('details', params.details);
  return url.toString();
}

function ConfirmationContent() {
  const sp = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const fullName = sp.get('invitee_full_name') || '';
  const firstName = fullName.split(' ')[0] || '';
  const email = sp.get('invitee_email') || '';
  const eventName = sp.get('event_type_name') || 'Appel découverte';
  const start = sp.get('event_start_time') || '';
  const end = sp.get('event_end_time') || '';
  const closer = sp.get('assigned_to') || '';
  const phone = sp.get('invitee_phone') || '';
  const bookingId = sp.get('booking_id') || sp.get('id') || sp.get('event_uuid') || '';

  // Tracking : à l'arrivée sur /confirmation, on capture l'event PostHog + on upsert dans bookings.
  // C'est notre substitut au webhook iClosed (plan free n'expose pas de webhook server-to-server).
  useEffect(() => {
    if (!mounted) return;
    if (!email && !start) return; // pas un vrai retour iClosed (juste une visite directe)

    // PostHog event
    capture('iclosed_booking_confirmed', {
      invitee_email: email,
      invitee_name: fullName,
      event_name: eventName,
      scheduled_at: start,
      closer,
      utm_source: sp.get('utm_source') || undefined,
      utm_medium: sp.get('utm_medium') || undefined,
      utm_campaign: sp.get('utm_campaign') || undefined,
    });

    // Upsert en BDD (anon insert OK via policy)
    const sb = supabaseBrowser();
    void sb.from('bookings').upsert(
      {
        external_id: bookingId || `confirmation-${email}-${start}`,
        source: 'iclosed',
        event: 'scheduled',
        invitee_name: fullName || null,
        invitee_email: email || null,
        invitee_phone: phone || null,
        scheduled_at: start ? new Date(start).toISOString() : null,
        duration_minutes: durationMinutes(start, end),
        closer: closer || null,
        utm_source: sp.get('utm_source'),
        utm_medium: sp.get('utm_medium'),
        utm_campaign: sp.get('utm_campaign'),
        utm_term: sp.get('utm_term'),
        utm_content: sp.get('utm_content'),
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        raw: Object.fromEntries(sp.entries()),
        received_at: new Date().toISOString(),
      },
      { onConflict: 'external_id' },
    );

    // Email de confirmation Omniscale (remplace celui d'iClosed — qui doit être désactivé
    // côté iClosed pour éviter le doublon). On envoie une seule fois par (email, start)
    // grâce à un flag localStorage.
    if (email && start) {
      const dedupeKey = `omni-booking-mail-${email}-${start}`;
      const alreadySent = typeof window !== 'undefined' && localStorage.getItem(dedupeKey);
      if (!alreadySent) {
        sendEmail('booking_confirmed', email, {
          clientName: fullName || email.split('@')[0],
          eventTitle: eventName,
          startsAt: new Date(start).toISOString(),
          endsAt: end ? new Date(end).toISOString() : undefined,
          closer: closer || undefined,
          meetingUrl: sp.get('meeting_url') || sp.get('location') || undefined,
        }).then((res) => {
          if (res.ok && typeof window !== 'undefined') {
            try { localStorage.setItem(dedupeKey, new Date().toISOString()); } catch {}
          }
        }).catch(() => {});
      }
    }
  }, [mounted, email, start, end, fullName, eventName, closer, phone, bookingId, sp]);

  const { date, time } = formatDate(start);
  const dur = durationMinutes(start, end);

  const gcalUrl = start && end
    ? buildGoogleCalendarUrl({
        title: `Omniscale — ${eventName}`,
        start,
        end,
        details: `Appel avec Omniscale${closer ? ` (${closer})` : ''}.\n\nTu recevras le lien visio par email peu avant l'heure du RDV.\n\nDes questions ? contact@omniscale.fr`,
      })
    : '';

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-omni-700/15 blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 14, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-lilac/8 blur-[160px]"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12 md:py-20">
        {/* Logo */}
        <motion.a
          href="/"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 mb-12 group"
        >
          <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
            <Logo size={28} color="#000000" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
        </motion.a>

        {/* Success badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-8"
        >
          <CheckCircle2 className="text-green-400" size={18} />
          <span className="text-sm text-green-300">Rendez-vous confirmé</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] mb-6"
        >
          {firstName ? <>Félicitations, <span className="text-gradient">{firstName}</span>&nbsp;!</> : <>Félicitations <span className="text-gradient">pour votre réservation&nbsp;!</span></>}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-white/80 mb-10 max-w-2xl leading-relaxed space-y-4"
        >
          <p>
            Tu viens de poser la première pierre pour <span className="text-white font-medium">faire passer ton commerce au niveau supérieur</span>. Et ça, c'est déjà 90% de la marche que la plupart ne franchissent jamais.
          </p>
          <p>
            Pendant ces 45 minutes, on va auditer ensemble ton business : ce qui marche, ce qui te bloque, et surtout les <span className="text-lilac font-medium">3 leviers concrets</span> que tu peux activer dans les 30 prochains jours pour générer plus de chiffre, que tu bosses avec nous ensuite ou pas.
          </p>
          <p className="text-white/60">
            Tu vas recevoir une confirmation par email avec le lien visio. À très vite.
          </p>
        </motion.div>

        {/* Bloc valeur (01/02/03) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12"
        >
          {[
            { n: '01', t: 'Audit complet', d: 'On passe au scanner ton acquisition, ton contenu et ton funnel.' },
            { n: '02', t: 'Plan d\'action', d: '3 leviers concrets activables sous 30 jours, chiffrés.' },
            { n: '03', t: 'Sans engagement', d: 'Aucune pression commerciale. Tu pars avec de la valeur, point.' },
          ].map((b) => (
            <div key={b.n} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-lilac text-xs font-semibold tracking-widest mb-2">{b.n}</div>
              <div className="font-display font-bold mb-1">{b.t}</div>
              <div className="text-sm text-white/60 leading-relaxed">{b.d}</div>
            </div>
          ))}
        </motion.div>

        {/* Vidéo de bienvenue de Rayan (16:9) — autoplay muet, contrôles, son au clic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-3"
        >
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-lilac/20 bg-black shadow-2xl shadow-lilac/10">
            <video
              src="/videos/confirmation/rayan-welcome.mp4"
              poster="/videos/confirmation/rayan-welcome-poster.jpg"
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-white/40 mt-2 text-center">
            Un mot de Rayan, fondateur d'Omniscale — clique sur le son pour entendre 🔊
          </p>
        </motion.div>
        <div className="mb-12" />


        {/* Details card (Date, Heure, Email — sans Format ni Visio) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur p-6 md:p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {date && (
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center shrink-0">
                  <Calendar className="text-lilac" size={20} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Date</div>
                  <div className="font-display font-semibold capitalize">{date}</div>
                </div>
              </div>
            )}

            {time && (
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center shrink-0">
                  <Clock className="text-lilac" size={20} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Heure (Paris)</div>
                  <div className="font-display font-semibold">
                    {time} {dur && <span className="text-white/50 font-normal">· {dur} min</span>}
                  </div>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-start gap-4 md:col-span-2">
                <div className="w-11 h-11 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center shrink-0">
                  <Mail className="text-lilac" size={20} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Confirmation envoyée à</div>
                  <div className="font-display font-semibold break-all">{email}</div>
                </div>
              </div>
            )}
          </div>

          {gcalUrl && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-5 py-3 rounded-full text-sm hover:bg-white transition-colors"
              >
                <Calendar size={16} /> Ajouter à Google Calendar
              </a>
            </div>
          )}
        </motion.div>

        {/* Prochaines étapes */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Prochaines <span className="text-gradient">étapes</span>
          </h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto">
            Voici comment on va démarrer ensemble.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                Icon: Mail,
                t: 'Confirmation par email',
                d: 'Tu vas recevoir un email avec tous les détails de ton rendez-vous et le lien visio.',
              },
              {
                Icon: Calendar,
                t: 'Premier rendez-vous',
                d: "On se retrouve en visio au créneau réservé pour faire l'audit complet de ton business.",
              },
              {
                Icon: Youtube,
                t: 'Va voir notre chaîne YouTube',
                d: 'Découvre des cas clients, conseils marketing et stratégies pour scaler ton business.',
              },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-lilac" size={22} />
                </div>
                <div className="font-display font-bold text-lg mb-2">{t}</div>
                <div className="text-sm text-white/60 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
          >
            <Youtube size={18} /> Accéder à la chaîne YouTube d'Omniscale
          </a>
        </motion.section>

        {/* Dernières vidéos YouTube — pour réchauffer en attendant le RDV */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <YouTubeVideosGrid
            title="En attendant, regarde nos dernières vidéos"
            subtitle="Méthodes, cas clients, breakdowns — pour arriver préparé au RDV"
            animated
          />
        </motion.section>
      </div>

      {/* === Avis clients vidéo (5 témoignages) — full-width === */}
      <VideoTestimonials />

      {/* === Trustpilot card (social proof avant socials) === */}
      <div className="relative max-w-md mx-auto px-6 pb-8">
        <TrustpilotBadge variant="card" />
      </div>

      {/* === Socials + footer (retour dans container narrow) === */}
      <div className="relative max-w-3xl mx-auto px-6 pb-12 md:pb-20">
        {/* Socials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 mb-16 text-center"
        >
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
            En attendant le RDV
          </div>
          <div className="font-display text-2xl font-bold mb-4">
            Suis-nous sur les réseaux
          </div>
          <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
            Tips marketing, coulisses des campagnes clients et résultats en
            temps réel — chaque semaine.
          </p>
          <div className="flex justify-center">
            <Socials />
          </div>
        </motion.div>

        {/* Footer actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-center text-white/60 text-sm space-y-2"
        >
          <p>
            Besoin de modifier ou annuler ? Écris-nous à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-lilac hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            <a href="/" className="text-white/50 hover:text-lilac transition-colors">
              ← Retour au site
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
