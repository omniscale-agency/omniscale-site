'use client';
import { supabaseBrowser } from './supabase/client';

export interface CompanySettings {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  siret: string;
  vatNumber: string;
  iban: string;
  bic: string;
  bankName: string;
  defaultPaymentTerms: number;
  defaultVatRate: number;
  invoiceFooter: string;
}

export const DEFAULT_SETTINGS: CompanySettings = {
  name: 'Omniscale',
  legalName: 'Omniscale SAS',
  email: 'contact@omniscale.fr',
  phone: '+33 7 80 95 47 83',
  website: 'omniscale.fr',
  address: '',
  city: '',
  zip: '',
  country: 'France',
  siret: '',
  vatNumber: '',
  iban: '',
  bic: '',
  bankName: '',
  defaultPaymentTerms: 30,
  defaultVatRate: 20,
  invoiceFooter: 'Merci pour votre confiance — Omniscale.',
};

let _cached: CompanySettings | null = null;

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const sb = supabaseBrowser();
  const { data } = await sb.from('company_settings').select('data').eq('id', 1).single();
  const merged = { ...DEFAULT_SETTINGS, ...(data?.data || {}) } as CompanySettings;
  _cached = merged;
  return merged;
}

/** Sync — retourne le cache (DEFAULT au démarrage). À utiliser après fetchCompanySettings. */
export function getCompanySettings(): CompanySettings {
  return _cached || DEFAULT_SETTINGS;
}

export async function saveCompanySettings(settings: CompanySettings) {
  const sb = supabaseBrowser();
  await sb.from('company_settings').update({ data: settings, updated_at: new Date().toISOString() }).eq('id', 1);
  _cached = settings;
}

export function subscribeCompany(cb: () => void): () => void {
  const sb = supabaseBrowser();
  const uniq = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const ch = sb
    .channel(`company-changes-${uniq}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => cb())
    .subscribe();
  return () => { sb.removeChannel(ch); };
}

// Préload au démarrage côté client
if (typeof window !== 'undefined') {
  fetchCompanySettings().catch(() => {});
}
