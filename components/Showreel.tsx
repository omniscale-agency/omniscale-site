'use client';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { TIKTOK_VIDEOS, TikTokVideo } from '@/lib/config';

// Split en 2 rangées (alternées) pour la double marquee
const half = Math.ceil(TIKTOK_VIDEOS.length / 2);
const row1 = TIKTOK_VIDEOS.slice(0, half);
const row2 = TIKTOK_VIDEOS.slice(half);

function VideoCard({ video }: { video: TikTokVideo }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor-hover
      className="video-card group w-[220px] md:w-[280px] block"
      title={`${video.author} — ${video.title} (ouvre TikTok)`}
    >
      {/* Thumbnail réelle TikTok */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={video.thumbnail}
        alt={`${video.author} — ${video.title}`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Gradient bottom pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

      {/* Badge TikTok + lien externe en haut à droite */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white border border-white/10">
          TikTok
        </span>
        <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={12} />
        </span>
      </div>

      {/* Texte bas */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
        {video.category && (
          <div className="text-[10px] uppercase tracking-widest text-lilac mb-1">{video.category}</div>
        )}
        <div className="font-display font-bold text-base text-white leading-tight line-clamp-2 mb-1">
          {video.title}
        </div>
        <div className="text-[11px] text-white/70 truncate">@{video.author}</div>
      </div>
    </a>
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
            équipe. <span className="text-white/40">Clique sur une card pour voir la vidéo en entier sur TikTok.</span>
          </p>
        </motion.div>
      </div>

      {/* Rangée 1 — défile vers la gauche */}
      <div className="relative mb-6">
        <div className="video-marquee">
          {[...row1, ...row1].map((v, i) => (
            <VideoCard key={`r1-${i}`} video={v} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      </div>

      {/* Rangée 2 — défile vers la droite */}
      <div className="relative">
        <div className="video-marquee reverse">
          {[...row2, ...row2].map((v, i) => (
            <VideoCard key={`r2-${i}`} video={v} />
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
          Tu veux le même type de contenu pour ton commerce&nbsp;?
        </a>
      </div>
    </section>
  );
}
