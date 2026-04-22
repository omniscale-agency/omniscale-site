import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PostHogProvider } from '@/components/PostHogProvider';
import CookieBanner from '@/components/CookieBanner';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://omniscale.fr'),
  title: {
    default: 'Omniscale — Agence marketing pour scaler vos commerces & e-commerce',
    template: '%s · Omniscale',
  },
  description:
    "Omniscale scale les commerces physiques et e-commerce grâce aux réseaux sociaux, ads, sites internet et marketing d'influence. Boutiques, restaurants, e-commerce.",
  keywords: [
    'agence marketing', 'social media', 'ads meta', 'tiktok',
    'e-commerce', 'boutique', 'restaurant', 'influence', 'site internet',
    'omniscale', 'scaler commerce', 'marketing digital',
  ],
  authors: [{ name: 'Omniscale', url: 'https://omniscale.fr' }],
  creator: 'Omniscale',
  publisher: 'Omniscale',
  applicationName: 'Omniscale',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Omniscale — On scale ton business',
    description:
      "Boutiques, restaurants, e-commerce : on déploie social media, ads, sites et influence pour exploser ton chiffre.",
    url: 'https://omniscale.fr',
    siteName: 'Omniscale',
    locale: 'fr_FR',
    type: 'website',
    // OG image générée dynamiquement par app/opengraph-image.tsx (Next.js convention)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omniscale — On scale ton business',
    description: 'Social media, ads, sites, influence — pour boutiques et e-commerce.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise bg-black">
        <PostHogProvider>{children}</PostHogProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
