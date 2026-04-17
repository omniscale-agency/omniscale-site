'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, Video, Mail, Sparkles } from 'lucide-react';
import Logo from '@/components/Logo';
import Socials from '@/components/Socials';
import { CONTACT_EMAIL } from '@/lib/config';

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
  const phone = sp.get('text_reminder_number') || '';
  const closer = sp.get('assigned_to') || '';

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
            Pendant ces 45 minutes, on va auditer ensemble ton business : ce qui marche, ce qui te bloque, et surtout les <span className="text-lilac font-medium">3 leviers concrets</span> que tu peux activer dans les 30 prochains jours pour générer plus de chiffre — que tu bosses avec nous ensuite ou pas.
          </p>
          <p className="text-white/60">
            Tu vas recevoir une confirmation par email avec le lien visio. À très vite.
          </p>
        </motion.div>

        {/* Bloc valeur */}
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

        {/* Vidéo de félicitations (format horizontal 16:9) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-12 rounded-3xl overflow-hidden border border-lilac/20 bg-gradient-to-br from-omni-900/30 to-black relative aspect-video shadow-2xl shadow-lilac/10"
        >
          {/* TODO: remplacer par la vraie vidéo de félicitations */}
          {/* Quand prête, déposer le fichier dans public/videos/welcome.mp4 + welcome-poster.jpg
              et remplacer ce placeholder par :
              <video src="/videos/welcome.mp4" poster="/videos/welcome-poster.jpg"
                     autoPlay muted loop playsInline controls
                     className="absolute inset-0 w-full h-full object-cover" />
          */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-lilac/20 border border-lilac/40 flex items-center justify-center mb-5 animate-pulse">
              <Video className="text-lilac" size={32} />
            </div>
            <div className="font-display text-2xl md:text-3xl font-bold mb-2">
              Un petit mot de l'équipe
            </div>
            <div className="text-white/60 text-sm max-w-md">
              Vidéo de bienvenue à venir — l'équipe Omniscale t'accueille personnellement
              avant l'appel.
            </div>
          </div>
          <div className="absolute inset-0 halftone-dense opacity-20 pointer-events-none" />
        </motion.div>

        {/* Details card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
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

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center shrink-0">
                <Video className="text-lilac" size={20} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Format</div>
                <div className="font-display font-semibold">Visio (lien envoyé par email)</div>
              </div>
            </div>

            {email && (
              <div className="flex items-start gap-4">
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

        {/* Prepare section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="rounded-3xl border border-lilac/20 bg-lilac/5 p-6 md:p-8 mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="text-lilac" size={20} />
            <h2 className="font-display text-2xl font-bold">Pour préparer l'appel</h2>
          </div>
          <ul className="space-y-3 text-white/80">
            {[
              "Réfléchis à ton objectif principal sur les 6 prochains mois (CA, ouverture de boutique, lancement produit…)",
              "Note ton CA mensuel actuel et tes canaux d'acquisition existants",
              "Prépare 1 ou 2 questions précises que tu veux qu'on traite",
              "Si possible, ouvre tes statistiques (Insta, Meta Business, Shopify) pendant l'appel",
            ].map((tip, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-lilac mt-1">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Socials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 mb-8 text-center"
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
