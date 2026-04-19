'use client';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

export default function PresentationVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setProgress((v.currentTime / v.duration) * 100 || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setHasInteracted(true);
    // Première interaction : on enlève le mute pour que le son joue
    if (muted && !hasInteracted) {
      v.muted = false;
      setMuted(false);
    }
    if (v.paused) v.play(); else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      v.requestFullscreen();
    }
  };

  return (
    <section id="presentation" className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Background ambiance */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 14, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-omni-700/15 blur-[160px]"
        />
        <div className="absolute inset-0 halftone-dense opacity-15" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">Présentation</span>
            <div className="w-12 h-px bg-lilac" />
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] mb-5">
            Découvre <span className="text-gradient">Omniscale.</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            En 1 minute, on te raconte qui on est, comment on bosse et pourquoi on scale différemment.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative aspect-video rounded-3xl overflow-hidden border border-lilac/20 shadow-2xl shadow-lilac/10 group bg-black"
        >
          <video
            ref={videoRef}
            src="/videos/presentation.mp4"
            poster="/videos/presentation-poster.jpg"
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            onClick={togglePlay}
          />

          {/* Overlay gradient quand pause */}
          {!playing && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          )}

          {/* Big play button au centre — visible si pause */}
          {!playing && (
            <button
              onClick={togglePlay}
              aria-label="Lire la vidéo"
              className="absolute inset-0 flex items-center justify-center group/play"
            >
              <span className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-lilac/95 flex items-center justify-center shadow-2xl shadow-lilac/40 group-hover/play:scale-110 group-hover/play:bg-white transition-all duration-300">
                <Play size={36} fill="currentColor" className="text-ink ml-1.5" />
              </span>
            </button>
          )}

          {/* Barre de progression + contrôles bottom */}
          <div className={`absolute bottom-0 left-0 right-0 transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} duration-300`}>
            <div className="h-1 bg-white/20">
              <div className="h-full bg-lilac transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-4 px-5 py-3 bg-gradient-to-t from-black/80 to-transparent">
              <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lire'} className="text-white hover:text-lilac transition-colors">
                {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'} className="text-white hover:text-lilac transition-colors">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="flex-1" />
              <button onClick={toggleFullscreen} aria-label="Plein écran" className="text-white hover:text-lilac transition-colors">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-8 text-sm text-white/50"
        >
          Active le son pour la pleine expérience 🔊
        </motion.div>
      </div>
    </section>
  );
}
