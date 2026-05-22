'use client';
import { motion } from 'framer-motion';
import { TRUSTPILOT } from '@/lib/config';

/**
 * Section "Avis clients" — affiche les vrais avis Trustpilot d'Omniscale.
 * Les avis sont repris tels quels depuis la page publique Trustpilot
 * (fr.trustpilot.com/review/omniscale.fr). Note globale + lien officiel
 * en tête, grille de cards en dessous, CTA pour laisser un avis.
 */

interface Review {
  name: string;
  rating: number;
  date: string;
  title?: string;
  body: string;
}

// Avis réels Trustpilot (vérifiés) — repris depuis la page publique.
const REVIEWS: Review[] = [
  {
    name: 'ELO GRD',
    rating: 5,
    date: '6 mai 2026',
    title: 'On avait un vrai problème de visibilité',
    body:
      "On avait un vrai problème de visibilité avant de travailler avec Omniscale. Le salon tournait surtout grâce au bouche-à-oreille et on avait du mal à remplir certaines journées en semaine. En quelques semaines, ils nous ont aidés à moderniser toute notre image, mettre en place des campagnes publicitaires locales et surtout attirer une nouvelle clientèle beaucoup plus régulière. Résultat : plus de prises de rendez-vous, plus de demandes via Instagram et un agenda beaucoup plus rempli. Je recommande à 100% Omniscale pour tous les salons qui veulent passer un cap.",
  },
  {
    name: 'finfo',
    rating: 5,
    date: '1 mai 2026',
    body:
      "J'ai découvert Omniscale sur les réseaux sociaux, et leur contenu m'a tout de suite donné confiance. Avec Rayan et Bilal, on a mis en place une stratégie complète et concrète. Ils se sont même déplacés en boutique pour tourner les vidéos et structurer toute la mise en place. Résultat : en seulement 3 semaines, +200 % de réservations, avec un agenda rempli sur près de 2 mois. En moins d'un mois et demi, j'ai multiplié mon chiffre d'affaires par 4. Je recommande sans hésitation 👍",
  },
  {
    name: 'Arthur Harlange',
    rating: 5,
    date: '26 avr. 2026',
    title: 'Plus de 30 000 € dès le premier mois',
    body:
      "Je gère une agence de location de voitures et j'avais du mal à remplir ma flotte régulièrement. Depuis que je travaille avec Omniscale, on a généré plus de 30 000 € de chiffre d'affaires supplémentaire dès le premier mois. Bilal et Rayan sont réactifs, professionnels et vraiment investis. Je recommande sans hésiter.",
  },
  {
    name: 'Johan',
    rating: 5,
    date: '23 avr. 2026',
    title: 'Agenda complet sur 2 mois',
    body:
      "Je suis tombé sur la chaîne YouTube Omniscale et j'ai été séduit par leur service. Avec Rayan et Bilal, nous avons mis en place toute la stratégie Omniscale pour augmenter le chiffre d'affaires de mon salon de coiffure. 3 semaines plus tard : +200 % de réservations, mon agenda est complet sur 2 mois 😂 Un grand merci à toute l'équipe OMNISCALE !",
  },
  {
    name: 'RayWare',
    rating: 5,
    date: '21 avr. 2026',
    title: "Merci à l'agence de Rayan et Bilal",
    body:
      "J'ai découvert Omniscale sur YouTube, et leur contenu apportait déjà beaucoup de valeur. J'ai décidé de passer sur leur accompagnement pour aller plus loin, et je ne regrette pas du tout. Rayan et Bilal sont venus directement en boutique pour mettre en place la stratégie et tourner les vidéos, c'était très concret. Résultat : x3,5 sur mon chiffre d'affaires en moins d'1 mois et demi. Je recommande 👍",
  },
  {
    name: 'Nuser',
    rating: 5,
    date: '22 avr. 2026',
    title: 'Des résultats en 30 jours',
    body:
      "Merci à Omniscale, j'ai eu d'excellents retours grâce à votre écosystème mis en place dans mon commerce en 30 jours seulement. Un grand merci 🙏🏽",
  },
];

export default function TrustpilotReviews() {
  const { url, reviewUrl, rating, reviewCount, label } = TRUSTPILOT;
  const ratingFr = rating.toFixed(1).replace('.', ',');

  return (
    <section id="avis" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête + note globale */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">Avis clients</span>
            <div className="w-12 h-px bg-lilac" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Ils en parlent <span className="text-gradient">mieux que nous.</span>
          </h2>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 hover:opacity-90 transition-opacity"
          >
            <span className="inline-flex items-center gap-1.5 font-display font-bold text-white">
              <TrustpilotLogo />
              Trustpilot
            </span>
            <Stars rating={Math.ceil(rating * 2) / 2} size={22} />
            <span className="text-white/80 text-sm">
              <strong className="text-white">{label}</strong>
              <span className="text-white/50"> · </span>
              <strong className="text-white">{ratingFr}/5</strong>
              <span className="text-white/50"> · {reviewCount} avis vérifiés</span>
            </span>
          </a>
        </motion.div>

        {/* Grille d'avis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((rev, i) => (
            <motion.article
              key={rev.name + rev.date}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="flex flex-col p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-[#00b67a]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <Stars rating={rev.rating} size={20} />
                <TrustpilotLogo />
              </div>
              {rev.title && (
                <h3 className="font-display font-bold text-white mb-2 leading-snug">{rev.title}</h3>
              )}
              <p className="text-white/75 text-sm leading-relaxed flex-1">{rev.body}</p>
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="font-medium text-white/90 text-sm">{rev.name}</span>
                <span className="text-xs text-white/40">{rev.date}</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#00b67a]">
                <CheckIcon /> Avis vérifié
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full border border-white/15 text-white/85 text-sm font-medium hover:border-white/30 hover:bg-white/[0.04] transition-colors"
          >
            Voir les {reviewCount} avis sur Trustpilot
          </a>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-[#00b67a] text-white text-sm font-semibold hover:bg-[#00a06b] transition-colors"
          >
            Laisser un avis
          </a>
        </div>
      </div>
    </section>
  );
}

/** 5 carrés Trustpilot officiels — remplissage partiel selon la note (0/50/100 %). */
function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} étoiles sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPct = rating >= i + 1 ? 100 : rating >= i + 0.5 ? 50 : 0;
        return <Star key={i} fillPct={fillPct} size={size} />;
      })}
    </div>
  );
}

function Star({ fillPct, size }: { fillPct: number; size: number }) {
  const id = `tpr-${size}-${fillPct}`;
  const isFull = fillPct >= 100;
  const isEmpty = fillPct <= 0;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {isFull || isEmpty ? (
        <rect width="24" height="24" rx="3" fill={isFull ? '#00b67a' : '#dcdce6'} />
      ) : (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset={`${fillPct}%`} stopColor="#00b67a" />
              <stop offset={`${fillPct}%`} stopColor="#dcdce6" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="3" fill={`url(#${id})`} />
        </>
      )}
      <path
        d="M12 4.5l2.245 4.55 5.02.73-3.633 3.541.857 5.001L12 15.95l-4.49 2.372.857-5.001L4.735 9.78l5.02-.73L12 4.5z"
        fill="#fff"
      />
    </svg>
  );
}

function TrustpilotLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2L9 9H2l6 4-2 7 6-4 6 4-2-7 6-4h-7L12 2z" fill="#00b67a" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="#00b67a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
