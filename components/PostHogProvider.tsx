'use client';
// PostHog client wrapper — initialise + tracke les pageviews en mode SPA Next.js,
// + identifie l'user après login via getSessionAsync().

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, capturePageview, identify } from '@/lib/analytics';
import { getSessionAsync } from '@/lib/auth';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Init au mount
  useEffect(() => {
    initPostHog();
    // Identify si déjà connecté
    getSessionAsync().then((s) => {
      if (s) {
        identify(s.userId, {
          email: s.email,
          name: s.name,
          role: s.role,
          brand: s.brand,
          sector: s.sector,
          city: s.city,
        });
      }
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      capturePageview(`${window.location.origin}${url}`);
    }
  }, [pathname, searchParams]);
  return null;
}
