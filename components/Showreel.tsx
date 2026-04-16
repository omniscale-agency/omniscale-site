'use client';
import { motion } from 'framer-motion';

const row1 = [
  { title: 'Boutique mode — Lyon', cat: 'Reels Instagram' },
  { title: 'Restaurant gastro — Paris', cat: 'TikTok viral' },
  { title: 'E-shop cosmétiques', cat: 'Pub Meta' },
  { title: 'Concept store', cat: 'UGC Influence' },
  { title: 'Brasserie locale', cat: 'Reels' },
];

const row2 = [
  { title: 'Marque sportwear', cat: 'Campagne 360°' },
  { title: 'Bijouterie — Marseille', cat: 'TikTok' },
  { title: 'Coffee shop', cat: 'Reels lifestyle' },
  { title: 'Salon de beauté', cat: 'UGC' },
  { title: 'Marque DTC', cat: 'Ads Meta' },
];

function VideoCard({ title, cat }: { title: string; cat: string }) {
  return (
    <div className="video-card w-[220px] md:w-[280px]" data-cursor-hover>
      <video
        src="/videos/showreel.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
        <div className="text-[10px] uppercase tracking-widest text-lilac mb-1">{cat}</div>
        <div className="font-display font-bold text-base text-white leading-tight">{title}</div>
      </div>
    </div>
  );
}

export default function Showreel() {
  return (
    <section id="showreel" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 halftone-dense opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-omni-700/20 blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-px bg-lilac" />
              <span className="text-lilac text-sm tracking-widest uppercase">Showreel</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
              Du contenu qui <br />
              <span className="text-gradient">fait scroller.</span>
            </h2>
          </div>
          <p className="text-white/60 max-w-md">
            Une sélection de vidéos qu'on a produites pour nos clients. Reels,
            TikTok, pub Meta, UGC : tout est shooté, monté et publié par notre
            équipe.
          </p>
        </motion.div>
      </div>

      {/* Rangée 1 — défile vers la gauche */}
      <div className="relative mb-6">
        <div className="video-marquee">
          {[...row1, ...row1, ...row1].map((v, i) => (
            <VideoCard key={`r1-${i}`} {...v} />
          ))}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      </div>

      {/* Rangée 2 — défile vers la droite */}
      <div className="relative">
        <div className="video-marquee reverse">
          {[...row2, ...row2, ...row2].map((v, i) => (
            <VideoCard key={`r2-${i}`} {...v} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 mt-16 text-center">
        <a
          href="#contact"
          className="inline-flex items-center gap-2 text-white/70 hover:text-lilac transition-colors text-sm"
        >
          <span className="w-8 h-px bg-lilac" />
          Tu veux le même type de contenu pour ton commerce ?
        </a>
      </div>
    </section>
  );
}
