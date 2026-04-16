'use client';
import { motion } from 'framer-motion';
import { Megaphone, Target, Globe, Users, Camera, TrendingUp } from 'lucide-react';

const services = [
  {
    icon: Megaphone,
    title: 'Social Media',
    desc: "Stratégie, création de contenu et community management sur Instagram, TikTok, et plus. On crée des posts qui font scroller… et acheter.",
    tags: ['Reels', 'TikTok', 'Stories', 'CM'],
  },
  {
    icon: Target,
    title: 'Publicité (Ads)',
    desc: "Campagnes Meta, Google et TikTok Ads optimisées au quotidien. Objectif : un ROAS qui justifie chaque euro dépensé.",
    tags: ['Meta', 'Google', 'TikTok'],
  },
  {
    icon: Globe,
    title: 'Création de sites',
    desc: "Sites vitrines pour boutiques et restaurants, e-commerce Shopify ou WooCommerce. Design, dev et maintenance.",
    tags: ['Shopify', 'Webflow', 'Next.js'],
  },
  {
    icon: Users,
    title: "Marketing d'influence",
    desc: "On identifie les bons créateurs pour ta marque, on négocie, on cadre les briefs et on track les retombées.",
    tags: ['Macro', 'Micro', 'UGC'],
  },
  {
    icon: Camera,
    title: 'Production de contenu',
    desc: "Shooting photo, tournage vidéo, motion design. On vient sur place capturer ton commerce sous son meilleur angle.",
    tags: ['Photo', 'Vidéo', 'Motion'],
  },
  {
    icon: TrendingUp,
    title: 'Scaling e-commerce',
    desc: "Audit, optimisation conversion, email marketing, fidélisation. On débloque ton plafond de croissance.",
    tags: ['CRO', 'Email', 'CRM'],
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-32 px-6">
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
            <span className="text-lilac text-sm tracking-widest uppercase">Services</span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-3xl">
            Tout ce qu'il te faut pour <span className="text-gradient">passer à l'échelle.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-lilac/40 hover:bg-lilac/5 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-lilac/0 group-hover:bg-lilac/10 blur-3xl transition-all duration-700" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-lilac/10 border border-lilac/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                    <Icon className="text-lilac" size={26} />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                  <p className="text-white/60 leading-relaxed mb-5">{s.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
