import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — Omniscale',
  description: 'Espace client Omniscale',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
