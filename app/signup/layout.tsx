import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte — Omniscale',
  description: 'Inscris-toi pour accéder aux ressources et conseils Omniscale',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
