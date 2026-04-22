'use client';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface VideoTestimonial {
  src: string;
  poster: string;
  name: string;
  role: string;
  result: string;
}

// Liste des témoignages vidéo. Ajoute les 4 autres au fur et à mesure.
const VIDEOS: Array<VideoTestimonial | null> = [
  {
    src: '/videos/testimonials/1.mp4',
    poster: '/videos/testimonials/1-poster.jpg',
    name: 'Philippe',
    role: 'Boutique de mode • Lyon',
    result: 'x10 sur le CA en ligne',
  },
  null, // slot 2 — à remplir
  null, // slot 3
  null, // slot 4
  null, // slot 5
];

export default function VideoTestimonials() {
  return (
    <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-lilac/[0.03] to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">Avis clients vidéo</span>
            <div className="w-12 h-px bg-lilac" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
            Ce qu'ils en <span className="text-gradient">disent.</span>
          </h2>
          <p className="text-white/60 mt-5 max-w-2xl mx-auto">
            Pas de blabla, pas d'acteurs. Nos clients filment leur retour eux-mêmes.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {VIDEOS.map((v, i) =>
            v ? <VideoCard key={i} video={v} index={i} /> : <PlaceholderCard key={i} index={i} />
          )}
        </div>
      </div>
    </section>
  );
}

function VideoCard({ video, index }: { video: VideoTestimonial; index: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hover, setHover] = useState(false);

  // Auto-play léger au hover (sans son)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (hover && !playing) {
      el.play().catch(() => {});
    } else if (!hover && !playing) {
      el.pause();
      el.currentTime = 0;
    }
  }, [hover, playing]);

  const togglePlay = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.muted = false;
      setMuted(false);
      el.currentTime = 0;
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={togglePlay}
      data-cursor-hover
      className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 hover:border-lilac/40 transition-all cursor-pointer bg-black"
    >
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        muted={muted}
        playsInline
        loop={!playing}
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* Gradient overlay (atténué quand vidéo joue plein écran) */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none transition-opacity ${playing ? 'opacity-40' : 'opacity-100'}`} />

      {/* Icône Play centrale (cachée quand joue) */}
      {!playing && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: hover ? 1.15 : 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-lilac/95 flex items-center justify-center shadow-2xl">
            <Play className="text-ink ml-1" size={26} fill="currentColor" />
          </div>
        </motion.div>
      )}

      {/* Mute toggle (visible quand joue) */}
      {playing && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-lilac hover:text-ink transition-colors z-10"
          aria-label={muted ? 'Activer le son' : 'Couper le son'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {/* Infos en bas (cachées en plein lecture si tu veux : on les laisse pour le moment) */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 pointer-events-none transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <div className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">{video.role}</div>
        <div className="font-display font-bold text-sm leading-tight">{video.name}</div>
        <div className="text-xs text-lilac mt-1 font-medium">{video.result}</div>
      </div>
    </motion.div>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative aspect-[9/16] rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-center p-4"
    >
      <div>
        <Sparkles className="text-lilac/40 mx-auto mb-2" size={24} />
        <div className="text-xs text-white/30 font-medium">Bientôt</div>
      </div>
    </motion.div>
  );
}
