import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omniscale — Agence marketing pour scaler vos commerces & e-commerce',
  description:
    "Omniscale scale les commerces physiques et e-commerce grâce aux réseaux sociaux, ads, sites internet et marketing d'influence.",
  metadataBase: new URL('https://omniscale.fr'),
  openGraph: {
    title: 'Omniscale — On scale ton business',
    description:
      "Boutiques, restaurants, e-commerce : on déploie social media, ads, sites et influence pour exploser ton chiffre.",
    url: 'https://omniscale.fr',
    siteName: 'Omniscale',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="noise bg-black">{children}</body>
    </html>
  );
}
