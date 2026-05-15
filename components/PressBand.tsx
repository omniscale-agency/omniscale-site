'use client';
import { motion } from 'framer-motion';

/**
 * Bande crédibilité — "Nos clients dans les médias".
 * Notre client SOPRA Real Estate (immobilier Dubai) a été couvert par
 * Forbes, BFM Business et C News. On affiche le logo SOPRA recréé à plat
 * + les 3 wordmarks médias en monochrome discret.
 *
 * Les wordmarks sont recréés en texte stylé (pas d'images externes) :
 * monochrome, scalables, et cohérents avec le thème sombre du site.
 */
export default function PressBand() {
  return (
    <section className="relative py-20 px-6 border-y border-white/10 bg-white/[0.015]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-lilac text-xs tracking-[0.25em] uppercase">
            Nos clients dans les médias
          </span>
          <p className="text-white/55 text-sm mt-3 max-w-xl mx-auto">
            Notre client <strong className="text-white/80">SOPRA Real Estate</strong> — agence
            immobilière à Dubai — a été couvert par&nbsp;:
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8"
        >
          <ForbesMark />
          <Divider />
          <BfmBusinessMark />
          <Divider />
          <CNewsMark />
        </motion.div>
      </div>
    </section>
  );
}

function Divider() {
  return <span className="hidden sm:block w-px h-8 bg-white/10" aria-hidden="true" />;
}

/** Wordmark Forbes — serif, capitale initiale, tracking serré. */
function ForbesMark() {
  return (
    <span
      className="font-display text-3xl md:text-4xl font-bold text-white/70 hover:text-white transition-colors select-none"
      style={{ letterSpacing: '-0.02em' }}
      aria-label="Forbes"
    >
      Forbes
    </span>
  );
}

/** Wordmark BFM Business — sans-serif bold, "BFM" plein + "BUSINESS" léger. */
function BfmBusinessMark() {
  return (
    <span className="inline-flex items-baseline gap-1.5 select-none" aria-label="BFM Business">
      <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white/70 hover:text-white transition-colors">
        BFM
      </span>
      <span className="text-lg md:text-xl font-light tracking-[0.15em] uppercase text-white/55">
        Business
      </span>
    </span>
  );
}

/** Wordmark CNEWS — sans-serif bold condensé. */
function CNewsMark() {
  return (
    <span
      className="text-2xl md:text-3xl font-extrabold tracking-tight text-white/70 hover:text-white transition-colors select-none"
      aria-label="CNEWS"
    >
      C<span className="text-white/55">NEWS</span>
    </span>
  );
}

/**
 * Logo SOPRA Real Estate recréé à plat — réutilisable.
 * "SOPRA" en capitales serif élégantes + "REAL ESTATE" tracké entre
 * deux tirets, fidèle au logo physique de l'agence.
 */
export function SopraLogo({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const main = dark ? 'text-ink' : 'text-white';
  const sub = dark ? 'text-ink/70' : 'text-white/70';
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`} aria-label="SOPRA Real Estate">
      <span
        className={`font-display font-bold leading-none ${main}`}
        style={{ letterSpacing: '0.14em', fontSize: '1.9em' }}
      >
        SOPRA
      </span>
      <span
        className={`inline-flex items-center gap-2 mt-1 ${sub}`}
        style={{ fontSize: '0.62em', letterSpacing: '0.32em' }}
      >
        <span className="w-5 h-px bg-current opacity-60" />
        REAL ESTATE
        <span className="w-5 h-px bg-current opacity-60" />
      </span>
    </div>
  );
}
