'use client';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const cases = [
  {
    client: 'French Retailers',
    sector: 'Boutique de mode • Avignon',
    result: 'Site refait, x10 sur le CA en ligne, +30% en boutique',
    color: 'from-fuchsia-500/30 to-purple-700/30',
    tags: ['Site', 'E-commerce', 'Insta'],
    // Si /images/cases/french-retailers.jpg existe en public/, c'est utilisé.
    // Sinon fallback Unsplash (boutique mode storefront).
    image: '/images/cases/french-retailers.jpg',
    fallback: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1400&q=80&auto=format&fit=crop',
  },
  {
    client: 'Trattoria Sole',
    sector: 'Restaurant italien • Paris',
    result: '+12k abonnés Insta en 90j',
    color: 'from-orange-500/30 to-rose-700/30',
    tags: ['TikTok', 'Influence', 'UGC'],
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1400&q=80&auto=format&fit=crop',
  },
  {
    client: 'Glow Cosmetics',
    sector: 'E-commerce beauté',
    result: 'ROAS x6.4 sur Meta',
    color: 'from-pink-400/30 to-violet-700/30',
    tags: ['Ads', 'CRO', 'Email'],
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1400&q=80&auto=format&fit=crop',
  },
  {
    client: 'Atelier Brut',
    sector: 'Concept store déco • Bordeaux',
    result: 'Site refait, +180% de trafic',
    color: 'from-amber-400/30 to-orange-700/30',
    tags: ['Site', 'SEO', 'Branding'],
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=80&auto=format&fit=crop',
  },
];

export default function Cases() {
  return (
    <section id="cas" className="relative py-32 px-6">
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
            <span className="text-lilac text-sm tracking-widest uppercase">Cas clients</span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl">
            Des résultats <span className="text-gradient">qu'on assume.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <motion.a
              key={c.client}
              href="#contact"
              data-cursor-hover
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative aspect-[4/5] md:aspect-[16/11] rounded-3xl overflow-hidden border border-white/10 hover:border-lilac/40 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.client}
                loading="lazy"
                onError={(e) => {
                  if ('fallback' in c && c.fallback && (e.target as HTMLImageElement).src !== c.fallback) {
                    (e.target as HTMLImageElement).src = c.fallback;
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${c.color} mix-blend-overlay opacity-60`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-lilac group-hover:text-ink transition-all">
                <ArrowUpRight size={20} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="text-xs uppercase tracking-widest text-white/60 mb-2">{c.sector}</div>
                <h3 className="font-display text-3xl md:text-4xl font-bold mb-3">{c.client}</h3>
                <div className="text-lilac font-medium mb-4">{c.result}</div>
                <div className="flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/80 border border-white/10">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
