'use client';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const quotes = [
  {
    q: "En 4 mois, ma boutique est devenue la plus visible de la ville sur Insta. Et surtout, ça se voit en caisse.",
    a: 'Léa M.',
    r: 'Maison Léa, Lyon',
  },
  {
    q: "Le site qu'ils m'ont fait tourne tout seul. Les commandes en ligne ont triplé en 2 mois.",
    a: 'Marco D.',
    r: 'Trattoria Sole, Paris',
  },
  {
    q: "On a divisé par 3 notre coût d'acquisition sur Meta. Reporting clair chaque semaine, équipe ultra réactive.",
    a: 'Camille R.',
    r: 'Glow Cosmetics',
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">Témoignages</span>
            <div className="w-12 h-px bg-lilac" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Ils nous font <span className="text-gradient">confiance.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((t, i) => (
            <motion.div
              key={t.a}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-lilac/40 transition-all flex flex-col"
            >
              <Quote className="text-lilac mb-6" size={32} />
              <p className="text-white/80 leading-relaxed flex-1 italic">"{t.q}"</p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="font-display font-bold">{t.a}</div>
                <div className="text-sm text-white/50">{t.r}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
