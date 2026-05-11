import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recrutement — Rejoindre Omniscale',
  description:
    "Closer, media buyer, vidéaste, designer, dev — on recrute en continu pour scaler des commerces. Candidate via le formulaire en ligne, réponse sous 5 jours ouvrés.",
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Recrutement — Rejoindre Omniscale',
    description:
      "Agence française qui scale les commerces physiques et e-commerce. Candidature directe en ligne.",
    type: 'website',
  },
};

export default function RecrutementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
