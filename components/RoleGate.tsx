'use client';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Role } from '@/lib/auth';
import { BOOKING_URL } from '@/lib/config';

interface Props {
  userRole: Role | null;
  allowed: Role[];
  /** Titre + description affichés si bloqué (pour rendre visible la fonctionnalité) */
  feature: string;
  children: React.ReactNode;
}

export default function RoleGate({ userRole, allowed, feature, children }: Props) {
  if (userRole && allowed.includes(userRole)) return <>{children}</>;

  return (
    <main className="p-6 md:p-12 max-w-3xl mx-auto">
      <div className="rounded-3xl border border-lilac/30 bg-gradient-to-br from-lilac/10 to-transparent p-8 md:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-lilac/20 border border-lilac/40 flex items-center justify-center mx-auto mb-6">
          <Lock className="text-lilac" size={28} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lilac/15 border border-lilac/30 text-xs text-lilac mb-4">
          <Sparkles size={12} /> Réservé aux clients Omniscale
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {feature}
        </h2>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          Cette section est débloquée pour les clients en accompagnement actif. En attendant, profite des conseils gratuits dans la section <strong className="text-white">Conseils scaling</strong>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-6 py-3 rounded-full hover:bg-white transition-colors"
          >
            Réserver un appel découverte <ArrowRight size={16} />
          </a>
          <a
            href="/dashboard/tips"
            className="inline-flex items-center gap-2 text-white/80 hover:text-lilac border border-white/15 hover:border-lilac/40 px-6 py-3 rounded-full transition-all"
          >
            Voir les conseils gratuits
          </a>
        </div>
      </div>
    </main>
  );
}
