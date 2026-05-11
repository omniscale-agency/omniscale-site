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
    result: 'Refonte site + machine à contenu TikTok',
    color: 'from-fuchsia-500/30 to-purple-700/30',
    tags: ['Site', 'E-commerce', 'TikTok'],
    image: '/images/cases/french-retailers.jpg',
    fallback: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1400&q=80&auto=format&fit=crop',
    context: "Boutique physique reconnue à Avignon mais peu de visibilité en ligne. Site dépassé, contenu social irrégulier. La croissance reposait surtout sur le bouche-à-oreille local.",
    duration: 'En cours',
    services: ['Refonte site e-commerce', 'Production de contenu TikTok', 'Social Media (Insta + TikTok)', 'Publicité Meta'],
    story: [
      "Refonte complète du site (Shopify) avec un design qui colle à l'image premium de la marque, optimisé conversion.",
      "Mise en place d'une vraie machine de contenu : plusieurs vidéos TikTok par semaine, Reels Insta, stories quotidiennes — format storytelling axé boutique.",
      "Lancement de campagnes Meta Ads ciblées local + national avec tracking pixel propre. Plusieurs vidéos du compte tournent à plus d'1M de vues (visibles dans le showreel ci-dessus).",
    ],
    metrics: [
      { value: '12+', label: 'Vidéos showreel', sub: 'visibles ci-dessus' },
      { value: '1M+', label: 'Vues sur la meilleure', sub: 'TikTok organique' },
      { value: 'Hebdo', label: 'Production', sub: 'plusieurs vidéos/sem.' },
      { value: 'En cours', label: 'Mission', sub: 'site + social + ads' },
    ],
    quote: {
      text: "Le contenu tourne, le site tourne, on n'a plus à y penser.",
      author: 'Équipe French Retailers',
    },
  },
  {
    client: 'Maxime',
    sector: 'Agence de location',
    result: '+30k€ dès le premier mois',
    color: 'from-amber-400/30 to-orange-700/30',
    tags: ['Site', 'Ads', 'Conversion'],
    image: '/images/cases/maxime.jpg',
    fallback: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1400&q=80&auto=format&fit=crop',
    context: "Agence de location avec une demande locale forte mais un funnel d'acquisition bancal : trafic correct mais peu de conversions, pas de tracking propre, et une présence digitale décousue.",
    duration: '1 mois pour les premiers résultats',
    services: ['Refonte tunnel de conversion', 'Publicité Meta + Google Ads', 'Tracking + reporting'],
    story: [
      "Audit du tunnel existant : restructuration complète des pages clés (offre, simulateur, prise de contact) pour réduire les frictions de conversion.",
      "Lancement de campagnes Meta + Google ciblées sur l'audience locale, avec suivi des leads de bout en bout (form → CRM → contrat).",
      "Mise en place d'un reporting hebdo simple : coût par lead, taux de signature, ROAS net — pour piloter sans devinette.",
    ],
    metrics: [
      { value: '+30k€', label: 'CA additionnel', sub: 'dès le 1er mois' },
      { value: 'En cours', label: 'Mission', sub: 'site + ads + tracking' },
      { value: '1 mois', label: 'Délai 1ers résultats', sub: 'depuis le go' },
      { value: 'Vidéo', label: 'Témoignage', sub: 'visible ci-dessus' },
    ],
    quote: {
      text: "Le premier mois on a fait +30k€. Ils savent vraiment de quoi ils parlent.",
      author: 'Maxime — Agence de location',
    },
  },
  {
    client: 'Maria',
    sector: 'Institut de beauté • Londres',
    result: 'Agenda complet sur 4 semaines',
    color: 'from-pink-400/30 to-rose-700/30',
    tags: ['Insta', 'Local', 'Booking'],
    image: '/images/cases/maria.jpg',
    fallback: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80&auto=format&fit=crop',
    context: "Institut de beauté à Londres, qualité de prestation excellente mais un Insta peu actif et aucun système d'acquisition digital. L'agenda était à moitié vide certaines semaines.",
    duration: '4 semaines pour remplir l\'agenda',
    services: ['Stratégie Insta + production de contenu', 'Acquisition locale ciblée', 'Optimisation booking'],
    story: [
      "Plan de contenu Insta axé sur les transformations clientes (avant/après) et les coulisses du salon, pour humaniser et créer de la preuve sociale.",
      "Acquisition locale ciblée Londres + boost des stories à fort engagement pour maximiser la portée organique.",
      "Optimisation du flow de prise de rendez-vous (lien direct, rappel automatique) pour ne plus perdre de leads entre l'intérêt et la réservation.",
    ],
    metrics: [
      { value: '4 sem.', label: 'Pour remplir', sub: 'l\'agenda complet' },
      { value: 'Complet', label: 'Statut actuel', sub: 'liste d\'attente' },
      { value: 'Londres', label: 'Marché', sub: 'acquisition locale' },
      { value: 'Vidéo', label: 'Témoignage', sub: 'visible ci-dessus' },
    ],
    quote: {
      text: "En 4 semaines mon agenda était complet. Je n'avais jamais eu ça.",
      author: 'Maria — Institut de beauté Londres',
    },
  },
  {
    client: 'Alex',
    sector: 'Boutique de parfums de niche • Lyon',
    result: '+22k€ dès le premier mois',
    color: 'from-violet-500/30 to-purple-800/30',
    tags: ['E-commerce', 'Insta', 'Ads'],
    image: '/images/cases/alex.jpg',
    fallback: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1400&q=80&auto=format&fit=crop',
    context: "Boutique de parfums de niche à Lyon, identité forte et catalogue pointu, mais une visibilité limitée à un public local. Quasi pas de ventes en ligne malgré un vrai potentiel.",
    duration: '1 mois pour les premiers résultats',
    services: ['Stratégie e-commerce', 'Production de contenu Insta', 'Publicité Meta'],
    story: [
      "Refonte de la stratégie produit en ligne : mise en avant des univers olfactifs et des histoires des marques pour créer de la désirabilité.",
      "Production de contenu Insta autour des accords parfumés, des nouveautés en boutique, et des conseils du gérant — format storytelling premium.",
      "Lancement de campagnes Meta ciblées sur les amateurs de parfumerie de niche en France, avec retargeting des visiteurs site.",
    ],
    metrics: [
      { value: '+22k€', label: 'CA additionnel', sub: 'dès le 1er mois' },
      { value: 'Lyon', label: 'Marché initial', sub: 'extension France' },
      { value: 'En cours', label: 'Mission', sub: 'e-com + social + ads' },
      { value: 'Vidéo', label: 'Témoignage', sub: 'visible ci-dessus' },
    ],
    quote: {
      text: "+22k€ le premier mois. Sur une boutique de niche, c'est énorme.",
      author: 'Alex — Boutique de parfums de niche, Lyon',
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
            Clique sur un client pour voir le détail de l'intervention et les chiffres.
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
