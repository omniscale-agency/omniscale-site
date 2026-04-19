'use client';
import { useEffect, useState } from 'react';
import { Building2, Banknote, FileText, Save, CheckCircle2 } from 'lucide-react';
import { fetchCompanySettings, saveCompanySettings, CompanySettings, DEFAULT_SETTINGS } from '@/lib/companySettings';

export default function AdminCompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchCompanySettings().then(setSettings); }, []);

  const update = (patch: Partial<CompanySettings>) => setSettings((p) => ({ ...p, ...patch }));

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCompanySettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-4xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Paramètres <span className="text-gradient">entreprise</span>
        </h1>
        <p className="text-white/60 mt-2">Ces infos sont utilisées sur toutes les factures et demandes de paiement.</p>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {/* Identité */}
        <Section title="Identité" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom commercial">
              <input value={settings.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Raison sociale (légal)">
              <input value={settings.legalName} onChange={(e) => update({ legalName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={settings.email} onChange={(e) => update({ email: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Téléphone">
              <input value={settings.phone} onChange={(e) => update({ phone: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Site web">
              <input value={settings.website} onChange={(e) => update({ website: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Adresse">
              <input value={settings.address} onChange={(e) => update({ address: e.target.value })} placeholder="123 rue Exemple" className={inputCls} />
            </Field>
            <Field label="Code postal">
              <input value={settings.zip} onChange={(e) => update({ zip: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Ville">
              <input value={settings.city} onChange={(e) => update({ city: e.target.value })} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Mentions légales */}
        <Section title="Mentions légales" icon={FileText}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="SIRET">
              <input value={settings.siret} onChange={(e) => update({ siret: e.target.value })} placeholder="123 456 789 00012" className={inputCls} />
            </Field>
            <Field label="Numéro de TVA intracommunautaire">
              <input value={settings.vatNumber} onChange={(e) => update({ vatNumber: e.target.value })} placeholder="FR12345678901" className={inputCls} />
            </Field>
            <Field label="Délai de paiement par défaut (jours)">
              <input type="number" value={settings.defaultPaymentTerms} onChange={(e) => update({ defaultPaymentTerms: parseInt(e.target.value) || 30 })} className={inputCls} />
            </Field>
            <Field label="Taux de TVA par défaut (%)">
              <input type="number" value={settings.defaultVatRate} onChange={(e) => update({ defaultVatRate: parseFloat(e.target.value) || 20 })} step={0.1} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Coordonnées bancaires */}
        <Section title="Coordonnées bancaires" icon={Banknote} subtitle="Affichées sur les factures pour faciliter le règlement par virement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Banque">
              <input value={settings.bankName} onChange={(e) => update({ bankName: e.target.value })} placeholder="Crédit Agricole" className={inputCls} />
            </Field>
            <Field label="BIC / SWIFT">
              <input value={settings.bic} onChange={(e) => update({ bic: e.target.value })} placeholder="AGRIFRPP" className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="IBAN">
                <input value={settings.iban} onChange={(e) => update({ iban: e.target.value })} placeholder="FR76 1234 5678 9012 3456 7890 123" className={inputCls + ' font-mono'} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Footer factures */}
        <Section title="Personnalisation factures" icon={FileText}>
          <Field label="Mention de bas de page">
            <textarea value={settings.invoiceFooter} onChange={(e) => update({ invoiceFooter: e.target.value })} rows={2} className={inputCls + ' resize-none'} />
          </Field>
        </Section>

        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-white/40">Sauvegardé localement (Phase 2 : DB Supabase).</p>
          <button type="submit" className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-6 py-3 rounded-xl hover:bg-white transition-colors">
            {saved ? (<><CheckCircle2 size={16} /> Enregistré</>) : (<><Save size={16} /> Enregistrer</>)}
          </button>
        </div>
      </form>
    </main>
  );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-lilac/50 text-sm';

function Section({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-lilac/10 border border-lilac/30 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-lilac" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">{title}</h2>
          {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
