'use client';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Singleton pour les composants client (évite de recréer à chaque render)
let _client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  if (!_client) _client = createClient();
  return _client;
}
