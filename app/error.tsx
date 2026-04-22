'use client';
import { useEffect } from 'react';
import Logo from '@/components/Logo';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log côté client (PostHog autocapture remontera l'error_boundary)
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-red-700/15 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-lilac/10 blur-[160px]" />
      </div>

      <div className="relative max-w-2xl text-center">
        <a href="/" className="inline-flex items-center gap-3 mb-12 group">
          <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
            <Logo size={28} color="#000000" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
        </a>

        <div className="text-xs uppercase tracking-widest text-red-400 mb-4">Erreur</div>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tighter leading-none mb-6">
          Quelque chose s'est <span className="text-gradient">cassé.</span>
        </h1>
        <p className="text-white/60 text-lg mb-3 max-w-lg mx-auto">
          Pas d'inquiétude, on a été notifié. Tu peux retenter ou revenir plus tard.
        </p>
        {error.digest && (
          <p className="text-xs text-white/30 font-mono mb-10">Code : {error.digest}</p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-6 py-3 rounded-full text-sm hover:bg-white transition-colors"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-lilac/40 text-white px-6 py-3 rounded-full text-sm transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </main>
  );
}
