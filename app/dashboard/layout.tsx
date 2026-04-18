import type { Metadata } from 'next';
import AppSidebar from '@/components/AppSidebar';
import OnboardingTour from '@/components/OnboardingTour';

export const metadata: Metadata = {
  title: 'Espace client — Omniscale',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black">
      <AppSidebar variant="client" />
      <div className="flex-1 min-w-0">{children}</div>
      <OnboardingTour />
    </div>
  );
}
