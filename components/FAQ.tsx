'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const faqs = [
  {
    q: "Quel est le budget minimum pour travailler avec vous ?",
    a: "On démarre nos accompagnements à partir de 1 500 € / mois. Le budget exact dépend de tes objectifs, de ton secteur et des leviers qu'on déploie (social, ads, site, influence). On te fait un devis clair après l'audit gratuit.",
  },
  {
    q: "En combien de temps voit-on des résultats ?",
    a: "Pour les commerces physiques avec social media + ads : premiers vrais résultats en caisse sous 30 à 60 jours. Pour de l'e-commerce avec ads bien optimisées : 2 à 4 semaines. Pour le SEO ou le branding long terme : 3 à 6 mois.",
  },
  {
    q: "Vous travaillez avec quels types de commerces ?",
    a: "Boutiques de mode, restaurants, concept stores, salons, cafés, bijouteries, e-shops DTC. Si tu vends à des particuliers et que ton produit a une histoire visuelle à raconter, on peut bosser ensemble.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Notre contrat standard est de 3 mois minimum (le temps de poser la stratégie et de voir les premiers vrais résultats). Après on continue au mois le mois, sans engagement long.",
  },
  {
    q: "Qui crée les contenus ? Moi ou vous ?",
    a: "Nous. On vient sur place pour shooter (photo + vidéo), on monte, on publie, on track. Tu n'as à fournir que les infos métier. Si tu veux apparaître à l'écran on cadre les sessions ensemble.",
  },
  {
    q: "Vous bossez à distance ou en présentiel ?",
    a: "Les deux. On a des bureaux à Paris et Lyon. Pour le shooting on se déplace partout en France. Le suivi stratégique se fait en visio + sur Slack/WhatsApp.",
  },
  {
    q: "Comment se passe le premier rendez-vous ?",
    a: "15 min en visio (gratuit, sans engagement). On comprend ton commerce, tes objectifs, ton historique. On te dit honnêtement si on peut t'aider. Si oui, on planifie l'audit complet.",
  },
  {
    q: "Vous gérez les budgets pub directement ?",
    a: "Tu gardes le contrôle de tes comptes pubs (Meta Business, Google Ads, TikTok Ads). On y a juste accès pour optimiser. Le budget média est facturé séparément de nos honoraires.",
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
        data-cursor-hover
      >
        <span className="font-display text-lg md:text-xl font-medium group-hover:text-lilac transition-colors">
          {q}
        </span>
        <div
          className={`shrink-0 w-10 h-10 rounded-full border border-white/15 flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'bg-lilac border-lilac rotate-45' : 'group-hover:border-lilac/50'
          }`}
        >
          <Plus size={18} className={isOpen ? 'text-ink' : 'text-white/70'} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-14 text-white/70 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-lilac" />
            <span className="text-lilac text-sm tracking-widest uppercase">FAQ</span>
            <div className="w-12 h-px bg-lilac" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Les questions <span className="text-gradient">qu'on nous pose.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="border-t border-white/10"
        >
          {faqs.map((f, i) => (
            <FAQItem
              key={i}
              q={f.q}
              a={f.a}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </motion.div>

        <div className="mt-12 text-center text-white/60">
          Une autre question ?{' '}
          <a href="#contact" className="text-lilac hover:underline">
            Écris-nous directement.
          </a>
        </div>
      </div>
    </section>
  );
}
