'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { TIKTOK_VIDEOS, TikTokVideo } from '@/lib/config';

const half = Math.ceil(TIKTOK_VIDEOS.length / 2);
const row1 = TIKTOK_VIDEOS.slice(0, half);
const row2 = TIKTOK_VIDEOS.slice(half);

/**
 * Card de la marquee : autoplay muet + boucle.
 * Joue uniquement quand visible (IntersectionObserver) pour
 * éviter de saturer la bande passante avec 12+ vidéos.
 */
function VideoCard({ video, onOpen }: { video: TikTokVideo; onOpen: (v: TikTokVideo) => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={() => onOpen(video)}
      data-cursor-hover
      className="video-card group w-[220px] md:w-[280px] block text-left p-0"
      title={`${video.author} — ${video.title}`}
    >
      <video
        ref={ref}
        src={video.src}
        poster={video.thumbnail}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Gradient bottom pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

      {/* Badge TikTok haut-droite */}
      <div className="absolute top-3 right-3 z-10">
        <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white border border-white/10">
          TikTok
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
    </button>
  );
}

/**
 * Modale plein écran : la vidéo joue en grand, avec son et contrôles.
 * Click outside ou Escape pour fermer.
 */
function VideoLightbox({ video, onClose }: { video: TikTokVideo; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  // Escape pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Lock le scroll du body
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Autoplay avec son si possible (sinon muet — politique browser)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    el.muted = false;
    el.play().then(() => setMuted(false)).catch(() => {
      // Browser bloque l'autoplay avec son → on tombe en muet
      el.muted = true;
      setMuted(true);
      el.play().catch(() => {});
    });
  }, [video.src]);

  const toggleMute = () => {
    const el = ref.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] aspect-[9/16] max-h-[90vh] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl"
      >
        <video
          ref={ref}
          src={video.src}
          poster={video.thumbnail}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />

        {/* Contrôles overlay */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-lilac hover:text-ink backdrop-blur flex items-center justify-center text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {muted && (
          <button
            onClick={toggleMute}
            className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full bg-black/70 hover:bg-lilac hover:text-ink backdrop-blur text-white text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <VolumeX size={14} /> Activer le son
          </button>
        )}

        {/* Footer infos (titre + auteur, pas de redirect TikTok) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
          <div className="min-w-0">
            {video.category && (
              <div className="text-[10px] uppercase tracking-widest text-lilac mb-0.5">{video.category}</div>
            )}
            <div className="font-display font-bold text-base text-white leading-tight line-clamp-2 mb-0.5">
              {video.title}
            </div>
            <div className="text-[11px] text-white/70 truncate">@{video.author}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Showreel() {
  const [open, setOpen] = useState<TikTokVideo | null>(null);

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
            équipe. <span className="text-white/40">Clique sur une vidéo pour la voir en grand.</span>
          </p>
        </motion.div>
      </div>

      {/* Rangée 1 — défile vers la gauche */}
      <div className="relative mb-6">
        <div className="video-marquee">
          {[...row1, ...row1].map((v, i) => (
            <VideoCard key={`r1-${i}`} video={v} onOpen={setOpen} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      </div>

      {/* Rangée 2 — défile vers la droite */}
      <div className="relative">
        <div className="video-marquee reverse">
          {[...row2, ...row2].map((v, i) => (
            <VideoCard key={`r2-${i}`} video={v} onOpen={setOpen} />
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

      {/* Lightbox modale */}
      <AnimatePresence>
        {open && <VideoLightbox video={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
