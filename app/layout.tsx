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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise bg-black">{children}</body>
    </html>
  );
}
