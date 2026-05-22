'use client';
import { TRUSTPILOT } from '@/lib/config';

interface Props {
  /** 'compact' = inline pill (footer / hero) · 'card' = bloc avec CTA */
  variant?: 'compact' | 'card';
  /** Centrer horizontalement (utile en hero ou page confirmation) */
  center?: boolean;
  className?: string;
}

/**
 * Badge Trustpilot custom — 5 étoiles partiellement remplies selon la note,
 * couleur officielle Trustpilot #00b67a, lien vers la page d'avis.
 *
 * Variantes :
 *  - compact : ★★★★★  4,0 · 4 avis · Trustpilot   (inline, footer/hero)
 *  - card    : bloc plus visible avec CTA "Voir tous les avis"
 */
export default function TrustpilotBadge({
  variant = 'compact',
  center = false,
  className = '',
}: Props) {
  const { url, rating, label } = TRUSTPILOT;
  // Affichage visuel : on arrondit à la demi-étoile supérieure la plus proche
  // (4.3 → 4.5 étoiles colorées) pour matcher le rendu Trustpilot officiel.
  const visualRating = Math.ceil(rating * 2) / 2;
  const ratingFr = rating.toFixed(1).replace('.', ',');

  if (variant === 'compact') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${center ? 'mx-auto' : ''} ${className}`}
        title={`${label} — ${ratingFr}/5 sur Trustpilot`}
      >
        <Stars filled={visualRating} size={18} />
        <span className="text-sm text-white/80">
          <strong className="text-white">{ratingFr}</strong>
          <span className="text-white/50"> · Avis vérifiés sur </span>
          <strong className="text-white">Trustpilot</strong>
        </span>
      </a>
    );
  }

  // Card variant
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#00b67a]/40 hover:bg-white/[0.04] transition-colors p-5 ${center ? 'mx-auto' : ''} ${className}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2">
          <TrustpilotLogo />
          <span className="font-display font-bold text-base text-white">Trustpilot</span>
        </div>
        <Stars filled={visualRating} size={28} />
        <div className="text-sm text-white/80">
          <strong className="text-white text-lg">{label}</strong>
          <span className="text-white/50"> · </span>
          <strong className="text-white">{ratingFr}/5</strong>
          <span className="text-white/50"> · </span>
          <span>Avis vérifiés</span>
        </div>
        <span className="text-xs text-[#00b67a] group-hover:underline">
          Voir tous les avis →
        </span>
      </div>
    </a>
  );
}

/**
 * 5 carrés Trustpilot officiels.
 * `filled` = note décimale 0..5 (ex 4.5 = 4 carrés verts pleins + 1 demi-vert).
 */
function Stars({ filled, size }: { filled: number; size: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${filled} étoiles sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        // Pour chaque case, calcule le pourcentage de remplissage 0/50/100
        const fillPct =
          filled >= i + 1 ? 100 :
          filled >= i + 0.5 ? 50 :
          0;
        return <Star key={i} fillPct={fillPct} size={size} />;
      })}
    </div>
  );
}

function Star({ fillPct, size }: { fillPct: number; size: number }) {
  // Carré arrondi Trustpilot. Si fillPct=100 : tout vert.
  // Si fillPct=0 : tout gris. Si fillPct=50 : moitié gauche verte, moitié droite grise.
  const id = `tp-half-${size}-${fillPct}`;
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
  // Logo Trustpilot simplifié : étoile verte + texte "Trustpilot"
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 2L9 9H2l6 4-2 7 6-4 6 4-2-7 6-4h-7L12 2z"
        fill="#00b67a"
      />
    </svg>
  );
}
