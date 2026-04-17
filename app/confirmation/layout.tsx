import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rendez-vous confirmé — Omniscale',
  description: 'Confirmation de votre appel découverte avec Omniscale.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
