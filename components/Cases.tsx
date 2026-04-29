'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X, TrendingUp, Calendar, Sparkles, ArrowRight, Quote } from 'lucide-react';

interface CaseStudy {
  client: string;
  sector: string;
  result: string;
  color: string;
  tags: string[];
  image: string;
  fallback?: string;
  // ───── Détails (modale) ─────
  context: string;          // Situation initiale (1-2 phrases)
  duration: string;         // ex: "6 mois", "90 jours"
  services: string[];       // Ce qu'on a activé
  story: string[];          // Paragraphes de ce qu'on a fait (1 à 3)
  metrics: Array<{ value: string; label: string; sub?: string }>;
  quote?: { text: string; author: string };
}

const cases: CaseStudy[] = [
  {
    client: 'French Retailers',
    sector: 'Boutique de mode • Avignon',
    result: 'Site refait, x10 sur le CA en ligne, +30% en boutique',
    color: 'from-fuchsia-500/30 to-purple-700/30',
    tags: ['Site', 'E-commerce', 'Insta'],
    image: '/images/cases/french-retailers.jpg',
    fallback: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1400&q=80&auto=format&fit=crop',
    context: "Boutique physique reconnue à Avignon mais 0 vente en ligne. Site dépassé, aucune stratégie social media, pas de pub. Les clients venaient seulement par bouche-à-oreille.",
    duration: '6 mois',
    services: ['Refonte site e-commerce', 'Production de contenu', 'Social Media (Insta + TikTok)', 'Publicité Meta'],
    story: [
      "On a commencé par refaire complètement le site (Shopify) avec un design qui colle à l'image premium de la marque, optimisé conversion.",
      "En parallèle, mise en place d'une vraie machine de contenu : 4 vidéos TikTok par semaine, Reels Insta, stories quotidiennes. Format storytelling pour humaniser.",
      "Lancement de campagnes Meta Ads ciblées local + national avec tracking pixel propre. Retargeting sur les visiteurs site et engagés social.",
    ],
    metrics: [
      { value: 'x10', label: 'CA en ligne', sub: 'vs avant refonte' },
      { value: '+30%', label: 'Trafic boutique', sub: 'sur 6 mois' },
      { value: '+45k', label: 'Abonnés gagnés', sub: 'TikTok + Insta' },
      { value: 'x4.2', label: 'ROAS Meta', sub: 'campagnes en cours' },
    ],
    quote: {
      text: "On a complètement changé de dimension. Notre boutique est devenue une vraie marque, pas juste un magasin local.",
      author: 'Fondateur, French Retailers',
    },
  },
  {
    client: 'Trattoria Sole',
    sector: 'Restaurant italien • Paris',
    result: '+12k abonnés Insta en 90j',
    color: 'from-orange-500/30 to-rose-700/30',
    tags: ['TikTok', 'Influence', 'UGC'],
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1400&q=80&auto=format&fit=crop',
    context: "Restaurant italien parisien avec une cuisine excellente mais un Insta à 800 abonnés sans aucune cohérence. Aucune visibilité TikTok. Réservations en baisse.",
    duration: '90 jours',
    services: ['Production vidéo (shooting hebdo)', 'Stratégie social media', 'Marketing d\'influence', 'TikTok organique'],
    story: [
      "Plan de contenu axé sur le storytelling : la famille derrière le resto, les recettes traditionnelles, les coulisses de la cuisine.",
      "Activation de 8 macro-influenceurs food parisiens sur 3 mois (Pierre Croque, Joana Eating, MesAdressesParis…) pour des dîners pris en charge contre stories + posts.",
      "Boost TikTok avec des vidéos courtes au rythme de 5 par semaine. Une vidéo virale a généré 2M de vues en 72h.",
    ],
    metrics: [
      { value: '+12k', label: 'Abonnés Insta', sub: 'en 90 jours' },
      { value: '2M', label: 'Vues TikTok', sub: 'meilleure vidéo' },
      { value: '+85%', label: 'Réservations', sub: 'soir en semaine' },
      { value: '8', label: 'Influenceurs', sub: 'activés' },
    ],
    quote: {
      text: "On est passés de restaurant de quartier à incontournable parisien en 3 mois. Les réservations partent 2 semaines à l'avance.",
      author: 'Chef, Trattoria Sole',
    },
  },
  {
    client: 'Glow Cosmetics',
    sector: 'E-commerce beauté',
    result: 'ROAS x6.4 sur Meta',
    color: 'from-pink-400/30 to-violet-700/30',
    tags: ['Ads', 'CRO', 'Email'],
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1400&q=80&auto=format&fit=crop',
    context: "E-shop beauté lancé depuis 1 an. Catalogue solide mais ROAS Meta bloqué à x1.5, taux de conversion à 0.8%, aucun email marketing.",
    duration: '4 mois',
    services: ['Audit + refonte campagnes Meta', 'Optimisation conversion (CRO)', 'Email marketing (Klaviyo)', 'Production UGC'],
    story: [
      "Audit complet du compte publicitaire : restructuration totale en 3 niveaux (TOF, MOF, BOF) avec creative testing systématique chaque semaine.",
      "Refonte du tunnel de conversion : pages produit allégées, upsells avant checkout, livraison gratuite affichée tôt. Taux de conversion passé de 0.8% à 2.4%.",
      "Mise en place Klaviyo : flow welcome, abandoned cart, post-purchase, win-back. L'email représente maintenant 28% du CA mensuel.",
    ],
    metrics: [
      { value: 'x6.4', label: 'ROAS Meta', sub: 'vs x1.5 avant' },
      { value: '2.4%', label: 'Taux conv.', sub: 'vs 0.8% avant' },
      { value: '28%', label: 'CA via email', sub: 'auparavant 0%' },
      { value: '+340%', label: 'CA mensuel', sub: 'sur 4 mois' },
    ],
    quote: {
      text: "Pour la première fois j'ai un système marketing qui tourne tout seul. Je peux enfin me concentrer sur le produit.",
      author: 'CEO, Glow Cosmetics',
    },
  },
  {
    client: 'Atelier Brut',
    sector: 'Concept store déco • Bordeaux',
    result: 'Site refait, +180% de trafic',
    color: 'from-amber-400/30 to-orange-700/30',
    tags: ['Site', 'SEO', 'Branding'],
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=80&auto=format&fit=crop',
    context: "Concept store bordelais pointu avec une vraie identité, mais un site WordPress lent, mal référencé, et une présence digitale décousue. Trafic organique stagnant.",
    duration: '5 mois',
    services: ['Refonte site (Next.js)', 'SEO technique + contenu', 'Branding digital', 'Photo produits'],
    story: [
      "Refonte complète du site sous Next.js : performances 95+ Lighthouse, design éditorial qui met les produits en valeur comme dans un magazine.",
      "Stratégie SEO sur 30 mots-clés long-tail (\"concept store déco Bordeaux\", \"objets design éthiques\", etc.) avec articles de blog mensuels.",
      "Shooting photo studio pour 200 produits + lifestyle in situ. Réutilisation sur le site, Insta et la newsletter.",
    ],
    metrics: [
      { value: '+180%', label: 'Trafic site', sub: 'sur 5 mois' },
      { value: 'Top 3', label: 'Google', sub: 'sur 18 mots-clés' },
      { value: '95', label: 'Score Lighthouse', sub: 'vs 42 avant' },
      { value: '+220%', label: 'Ventes en ligne', sub: 'YoY' },
    ],
    quote: {
      text: "Le nouveau site reflète enfin l'âme du concept store. On reçoit des compliments tous les jours dessus.",
      author: 'Fondatrice, Atelier Brut',
    },
  },
];

export default function Cases() {
  const [open, setOpen] = useState<CaseStudy | null>(null);

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
          <p className="text-white/60 mt-6 max-w-2xl">
            Clique sur un client pour voir le détail de notre intervention et les chiffres.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <motion.button
              key={c.client}
              type="button"
              onClick={() => setOpen(c)}
              data-cursor-hover
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative aspect-[4/5] md:aspect-[16/11] rounded-3xl overflow-hidden border border-white/10 hover:border-lilac/40 transition-all text-left p-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.client}
                loading="lazy"
                onError={(e) => {
                  if (c.fallback && (e.target as HTMLImageElement).src !== c.fallback) {
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
            </motion.button>
          ))}
        </div>
      </div>

      {/* Modale détaillée */}
      <AnimatePresence>
        {open && <CaseModal study={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}

function CaseModal({ study, onClose }: { study: CaseStudy; onClose: () => void }) {
  // Escape pour fermer + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl my-0 md:my-8 bg-gradient-to-br from-omni-900 via-black to-omni-900/40 border border-white/10 rounded-none md:rounded-3xl overflow-hidden shadow-2xl shadow-lilac/10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-lilac hover:text-ink backdrop-blur flex items-center justify-center text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* Hero image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={study.image}
            alt={study.client}
            onError={(e) => {
              if (study.fallback && (e.target as HTMLImageElement).src !== study.fallback) {
                (e.target as HTMLImageElement).src = study.fallback;
              }
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${study.color} mix-blend-overlay opacity-60`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-2">{study.sector}</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{study.client}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-10 space-y-8">
          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {study.metrics.map((m) => (
              <div key={m.label} className="rounded-2xl bg-lilac/10 border border-lilac/30 p-4 text-center">
                <div className="font-display text-2xl md:text-3xl font-bold text-lilac leading-none mb-1.5">{m.value}</div>
                <div className="text-xs font-medium text-white">{m.label}</div>
                {m.sub && <div className="text-[10px] text-white/40 mt-1">{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Méta */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="inline-flex items-center gap-2 text-white/70">
              <Calendar size={15} className="text-lilac" />
              <span>Durée : <strong className="text-white">{study.duration}</strong></span>
            </div>
            <div className="inline-flex items-center gap-2 text-white/70 flex-wrap">
              <Sparkles size={15} className="text-lilac" />
              <span>Services activés :</span>
              {study.services.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Situation initiale */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-lilac mb-2 font-bold">La situation au départ</div>
            <p className="text-white/80 leading-relaxed">{study.context}</p>
          </div>

          {/* Notre intervention */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-lilac mb-3 font-bold inline-flex items-center gap-1.5">
              <TrendingUp size={11} /> Ce qu'on a fait
            </div>
            <div className="space-y-3">
              {study.story.map((p, i) => (
                <p key={i} className="text-white/80 leading-relaxed flex gap-3">
                  <span className="text-lilac font-bold text-sm shrink-0 w-6 pt-1">0{i + 1}</span>
                  <span>{p}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Citation client */}
          {study.quote && (
            <div className="rounded-2xl border-l-4 border-lilac bg-lilac/5 p-5 relative">
              <Quote size={28} className="absolute top-4 right-5 text-lilac/30" />
              <p className="text-white/90 italic text-base md:text-lg leading-relaxed mb-3">
                « {study.quote.text} »
              </p>
              <p className="text-xs text-white/50 uppercase tracking-widest">— {study.quote.author}</p>
            </div>
          )}

          {/* CTA */}
          <a
            href="#contact"
            onClick={onClose}
            className="block w-full text-center bg-lilac text-ink font-semibold px-6 py-4 rounded-full hover:bg-white transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              Discuter d'un projet similaire <ArrowRight size={16} />
            </span>
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
