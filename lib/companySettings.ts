'use client';

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
  defaultPaymentTerms: number; // jours
  defaultVatRate: number;      // %
  invoiceFooter: string;
}

const KEY = 'omniscale_company_v1';

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

export function getCompanySettings(): CompanySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as CompanySettings; } catch { return DEFAULT_SETTINGS; }
}

export function saveCompanySettings(settings: CompanySettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('omniscale-company-change'));
}

export function subscribeCompany(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const h = () => cb();
  window.addEventListener('omniscale-company-change', h);
  window.addEventListener('storage', h);
  return () => {
    window.removeEventListener('omniscale-company-change', h);
    window.removeEventListener('storage', h);
  };
}
