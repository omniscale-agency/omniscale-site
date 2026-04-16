'use client';
import { motion } from 'framer-motion';

const steps = [
  {
    n: '01',
    t: 'Audit & immersion',
    d: "On vient sur place (ou en visio), on étudie ton commerce, ta clientèle, tes concurrents. On pose les bases.",
  },
  {
    n: '02',
    t: 'Stratégie 360°',
    d: "On définit les bons leviers : social, ads, influence, site, contenu. Avec des objectifs chiffrés et un plan clair.",
  },
  {
    n: '03',
    t: 'Production & lancement',
    d: "Shooting, montage, design, dev, campagnes : on produit tout en interne et on lance proprement.",
  },
  {
    n: '04',
    t: 'Optimisation & scale',
    d: "Reporting hebdo, A/B tests, ajustements. On pousse les leviers qui performent et on coupe ce qui ne marche pas.",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-omni-900/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">Méthode</span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl">
            Une méthode <span className="text-gradient">en 4 étapes.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-lilac/40 transition-all"
            >
              <div className="font-display text-6xl font-bold text-lilac/30 mb-6">{s.n}</div>
              <h3 className="font-display text-2xl font-bold mb-3">{s.t}</h3>
              <p className="text-white/60 leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
