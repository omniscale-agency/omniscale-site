'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'omniscale_cookie_consent';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) {
        const t = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage indisponible (mode privé) → on n'affiche rien
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
    setShow(false);
  };

  const dismiss = () => {
    // "Continuer sans accepter" — on stocke quand même pour ne pas re-afficher.
    // Pas de tracking opt-in nécessaire car PostHog est déjà en mode identified_only
    // (aucun profil créé tant que l'utilisateur n'est pas connecté = pas de données perso).
    try { localStorage.setItem(STORAGE_KEY, 'dismissed'); } catch {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100]"
          role="dialog"
          aria-label="Bandeau cookies"
        >
          <div className="rounded-2xl bg-black/95 backdrop-blur border border-white/15 shadow-2xl p-5 text-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-lilac/15 border border-lilac/30 flex items-center justify-center shrink-0">
                <Cookie className="text-lilac" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-white mb-1">Cookies & confidentialité</div>
                <p className="text-white/70 leading-relaxed">
                  On utilise des cookies strictement nécessaires (session, login) et un outil
                  d'analyse anonymisé pour améliorer le site. Aucune donnée personnelle n'est
                  collectée tant que tu n'es pas connecté.{' '}
                  <a href="/confidentialite" className="text-lilac hover:underline">En savoir plus</a>.
                </p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Fermer"
                className="text-white/40 hover:text-white shrink-0 -mt-1 -mr-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={accept}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-white transition-colors"
              >
                OK, j'ai compris
              </button>
              <a
                href="/confidentialite"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-lilac/40 text-white px-4 py-2.5 rounded-xl text-xs transition-colors"
              >
                Détails
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
