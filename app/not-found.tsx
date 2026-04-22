import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-omni-700/15 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-lilac/10 blur-[160px]" />
      </div>

      <div className="relative max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
          <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
            <Logo size={28} color="#000000" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
        </Link>

        <div className="text-xs uppercase tracking-widest text-lilac mb-4">Erreur 404</div>
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-6">
          Page <span className="text-gradient">introuvable.</span>
        </h1>
        <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
          Cette page n'existe pas ou a été déplacée. Pas de panique, on te ramène à bon port.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-6 py-3 rounded-full text-sm hover:bg-white transition-colors"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-lilac/40 text-white px-6 py-3 rounded-full text-sm transition-colors"
          >
            Mon espace client
          </Link>
        </div>
      </div>
    </main>
  );
}
