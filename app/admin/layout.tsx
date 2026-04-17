import type { Metadata } from 'next';
import AppSidebar from '@/components/AppSidebar';

export const metadata: Metadata = {
  title: 'Console admin — Omniscale',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black">
      <AppSidebar variant="admin" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
