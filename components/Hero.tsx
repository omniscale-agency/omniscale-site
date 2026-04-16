'use client';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import TypewriterCycle from './TypewriterCycle';
import Counter from './Counter';

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-black">
      {/* Background blobs — assombris */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-omni-700/15 blur-[160px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full bg-lilac/8 blur-[180px]"
        />
        <div className="absolute inset-0 halftone opacity-20" />
        {/* Couche d'assombrissement supplémentaire */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lilac/30 bg-lilac/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/80">Disponible — 2 places en avril 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="font-display text-[clamp(2.8rem,9vw,8rem)] font-bold leading-[0.9] tracking-tighter"
        >
          On scale <br />
          <TypewriterCycle />
          <br />
          <span className="text-white/40">En vrai.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed"
        >
          Boutiques, restaurants, e-commerce. On déploie social media, ads, sites
          internet et marketing d'influence pour transformer ton business en
          machine à attirer des clients.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <a
            href="#contact"
            className="btn-shine inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-7 py-4 rounded-full hover:bg-white transition-colors"
          >
            Démarrer un projet <ArrowUpRight size={18} />
          </a>
          <a
            href="#showreel"
            className="inline-flex items-center gap-2 text-white/80 hover:text-lilac border border-white/15 hover:border-lilac/50 px-7 py-4 rounded-full transition-all"
          >
            Voir le showreel
          </a>
        </motion.div>

        {/* Stats avec compteurs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl border-t border-white/10 pt-10"
        >
          <div>
            <div className="font-display text-4xl md:text-5xl font-bold text-lilac">
              +<Counter value={120} />
            </div>
            <div className="text-sm text-white/50 mt-1">commerces accompagnés</div>
          </div>
          <div>
            <div className="font-display text-4xl md:text-5xl font-bold text-lilac">
              +<Counter value={50} suffix="M" />
            </div>
            <div className="text-sm text-white/50 mt-1">vues générées sur les réseaux</div>
          </div>
          <div>
            <div className="font-display text-4xl md:text-5xl font-bold text-lilac">
              x<Counter value={4.2} decimals={1} />
            </div>
            <div className="text-sm text-white/50 mt-1">CA moyen sur 12 mois</div>
          </div>
          <div>
            <div className="font-display text-4xl md:text-5xl font-bold text-lilac">
              <Counter value={98} suffix="%" />
            </div>
            <div className="text-sm text-white/50 mt-1">clients fidélisés</div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hidden md:flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ArrowDown size={18} />
        </motion.div>
      </div>
    </section>
  );
}
