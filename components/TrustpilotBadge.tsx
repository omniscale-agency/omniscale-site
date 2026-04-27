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
  const { url, rating, reviewCount, label } = TRUSTPILOT;
  const stars = Math.round(rating); // arrondi à l'entier le plus proche pour les blocs verts pleins
  const ratingFr = rating.toFixed(1).replace('.', ',');

  if (variant === 'compact') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${center ? 'mx-auto' : ''} ${className}`}
        title={`${label} — ${ratingFr}/5 sur Trustpilot (${reviewCount} avis)`}
      >
        <Stars filled={stars} size={18} />
        <span className="text-sm text-white/80">
          <strong className="text-white">{ratingFr}</strong>
          <span className="text-white/50"> · {reviewCount} avis sur </span>
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
        <Stars filled={stars} size={28} />
        <div className="text-sm text-white/80">
          <strong className="text-white text-lg">{label}</strong>
          <span className="text-white/50"> · </span>
          <strong className="text-white">{ratingFr}/5</strong>
          <span className="text-white/50"> · </span>
          <span>{reviewCount} avis vérifiés</span>
        </div>
        <span className="text-xs text-[#00b67a] group-hover:underline">
          Voir tous les avis →
        </span>
      </div>
    </a>
  );
}

/**
 * 5 carrés Trustpilot officiels (verts/blancs).
 * `filled` = nombre d'étoiles vertes (0..5).
 */
function Stars({ filled, size }: { filled: number; size: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${filled} étoiles sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} filled={i < filled} size={size} />
      ))}
    </div>
  );
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  // Carré arrondi vert Trustpilot avec étoile blanche au centre.
  // Quand non rempli : carré gris (#dcdce6) avec étoile blanche.
  const bg = filled ? '#00b67a' : '#dcdce6';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill={bg} />
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
