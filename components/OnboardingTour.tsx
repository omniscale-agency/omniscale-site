'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles, Lightbulb, Plug, BookOpen, Calendar, FileText } from 'lucide-react';
import { BOOKING_URL } from '@/lib/config';

const STEPS = [
  {
    Icon: Sparkles,
    title: 'Bienvenue chez Omniscale 👋',
    body: 'Ton compte vient d\'être créé. Voici une visite rapide de ton espace pour bien démarrer.',
  },
  {
    Icon: BookOpen,
    title: 'Conseils scaling — gratuit',
    body: 'Dans la section "Conseils scaling", retrouve nos meilleurs frameworks et notre chaîne YouTube. C\'est accessible à tous et mis à jour chaque semaine.',
    highlight: '/dashboard/tips',
  },
  {
    Icon: Plug,
    title: 'Connecte tes comptes sociaux',
    body: 'Quand tu seras client, tu pourras connecter Instagram, TikTok et YouTube pour voir tes vraies stats en temps réel directement ici.',
    highlight: '/dashboard/connections',
  },
  {
    Icon: Calendar,
    title: 'Tableau de bord complet',
    body: 'Stats, objectifs, tâches assignées par ton chargé de compte, agenda Google et factures : tout en un endroit.',
  },
  {
    Icon: FileText,
    title: 'Prêt à passer client ?',
    body: 'Réserve un appel découverte gratuit (45 min). On audite ton business et on te dit si on peut t\'aider à scaler. Sans engagement.',
    cta: { label: 'Réserver mon appel', href: BOOKING_URL, external: true },
  },
];

const STORAGE_KEY = 'omniscale_show_tour';

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      setActive(true);
      setStep(0);
    }
  }, []);

  const close = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    setActive(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  };

  const prev = () => { if (step > 0) setStep((s) => s - 1); };

  const current = STEPS[step];
  const Icon = current?.Icon;

  return (
    <AnimatePresence>
      {active && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-gradient-to-br from-omni-900/40 to-black border border-lilac/30 rounded-3xl p-8 shadow-2xl"
          >
            <button onClick={close} className="absolute top-4 right-4 text-white/50 hover:text-white" aria-label="Fermer">
              <X size={20} />
            </button>

            {/* Progress */}
            <div className="flex gap-1.5 mb-8">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-lilac' : 'bg-white/10'}`} />
              ))}
            </div>

            <div className="w-16 h-16 rounded-2xl bg-lilac/15 border border-lilac/30 flex items-center justify-center mb-6">
              <Icon size={28} className="text-lilac" />
            </div>

            <div className="text-xs uppercase tracking-widest text-lilac mb-2">
              Étape {step + 1} / {STEPS.length}
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 leading-tight">
              {current.title}
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">{current.body}</p>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prev}
                disabled={step === 0}
                className="text-sm text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <div className="flex items-center gap-2">
                <button onClick={close} className="text-sm text-white/50 hover:text-white">Passer</button>
                {current.cta ? (
                  <a
                    href={current.cta.href}
                    target={current.cta.external ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={close}
                    className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white transition-colors"
                  >
                    {current.cta.label} <ArrowRight size={14} />
                  </a>
                ) : (
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white transition-colors"
                  >
                    {step < STEPS.length - 1 ? 'Suivant' : 'Terminer'} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
