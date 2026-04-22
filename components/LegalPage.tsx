'use client';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-black text-white px-6 py-12 md:py-20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-omni-700/10 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-lilac/[0.05] blur-[160px]" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-3 mb-12 group">
          <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
            <Logo size={28} color="#000000" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
        </a>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-xs uppercase tracking-widest text-lilac mb-3">Légal</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">{title}</h1>
          {subtitle && <p className="text-white/60 text-lg mb-10">{subtitle}</p>}

          <div className="prose-omniscale text-white/80 space-y-6 leading-relaxed">
            {children}
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 text-sm text-white/40 flex flex-wrap gap-6">
            <a href="/mentions-legales" className="hover:text-lilac">Mentions légales</a>
            <a href="/cgu" className="hover:text-lilac">CGU</a>
            <a href="/confidentialite" className="hover:text-lilac">Confidentialité</a>
            <a href="/" className="hover:text-lilac ml-auto">← Retour au site</a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
