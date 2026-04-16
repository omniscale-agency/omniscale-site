'use client';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function About() {
  return (
    <section id="agence" className="relative py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">L'agence</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-8">
            On est une agence <span className="text-gradient">à taille humaine.</span>
          </h2>
          <div className="space-y-5 text-white/70 text-lg leading-relaxed">
            <p>
              Pas de bullshit, pas d'usine à clients : chez Omniscale, on prend
              5 commerces par trimestre et on s'investit comme si c'était le
              nôtre.
            </p>
            <p>
              Notre conviction : un commerce physique ou un e-shop, ça scale
              avec une vraie stratégie de contenu, des campagnes intelligentes
              et un site qui convertit. Pas avec 3 posts Canva par semaine.
            </p>
            <p>
              On bosse pour des boutiques de mode, des restaurants, des concept
              stores et des marques DTC. Si tu veux passer un cap, tu es au bon
              endroit.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {['Paris', 'Lyon', '+ remote France'].map((c) => (
              <span key={c} className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-sm">
                {c}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="relative aspect-square max-w-lg mx-auto w-full"
        >
          <div className="absolute inset-0 bg-lilac/20 rounded-full blur-3xl" />
          <div className="relative bg-lilac rounded-[3rem] p-8 aspect-square flex items-center justify-center animate-float">
            <Logo size={300} color="#0a0a12" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-6 -right-6 w-32 h-32 rounded-full border border-lilac/30 flex items-center justify-center"
          >
            <span className="text-xs tracking-[0.3em] text-lilac">★ OMNISCALE ★ 2026 ★</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
