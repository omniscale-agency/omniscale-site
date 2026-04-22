'use client';
import { useEffect, useState } from 'react';
import { User, Building2, Shield, MapPin, Phone, Globe, TrendingUp, Tag, Save, CheckCircle2, Palette } from 'lucide-react';
import { getSessionAsync, updateUser, Session } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';

const SECTORS = [
  'Boutique de mode / Prêt-à-porter',
  'Restaurant / Bar / Café',
  'E-commerce',
  'Beauté / Cosmétiques',
  'Salon de coiffure / Esthétique',
  'Concept store / Décoration',
  'Bijouterie',
  'Boulangerie / Pâtisserie',
  'Marque DTC',
  'Service local',
  'Autre',
];

const REVENUE_RANGES = [
  '< 5 000 € / mois',
  '5 000 - 15 000 € / mois',
  '15 000 - 50 000 € / mois',
  '50 000 - 100 000 € / mois',
  '100 000 € + / mois',
  'Je préfère ne pas dire',
];

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [brand, setBrand] = useState('');
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (!s) return;
      setSession(s);
      setBrand(s.brand || '');
      setSector(s.sector || '');
      setCity(s.city || '');
      setPhone(s.phone || '');
      setWebsite(s.website || '');
      setMonthlyRevenue(s.monthlyRevenue || '');
    });
  }, []);

  if (!session) return <div className="p-12 text-white/60">Chargement…</div>;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser(session.email, { brand, sector, city, phone, website, monthlyRevenue });
    // Recharger la session pour propager les changements
    const fresh = await getSessionAsync();
    setSession(fresh);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-3xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Paramètres</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Mon compte</h1>
      </div>

      <div className="space-y-5">
        {/* Profil */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <User size={18} className="text-lilac" /> Profil
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Nom" value={session.name} />
            <Row label="Email" value={session.email} />
            <Row label="Rôle" value={session.role === 'admin' ? 'Administrateur' : session.role === 'client' ? 'Client' : 'Lead (accès limité)'} />
            <Row label="Inscrit depuis" value={new Date(session.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        </div>

        {/* Entreprise — éditable */}
        <form onSubmit={onSave} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-lilac" /> Mon entreprise
          </h2>
          <p className="text-sm text-white/50 mb-5">Ces infos sont synchronisées avec ton dashboard et l'équipe Omniscale.</p>

          <div className="space-y-4">
            <FormField label="Nom de la marque" icon={Building2}>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} placeholder="Maison Léa" />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Secteur" icon={Tag}>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                  <option value="">Choisis…</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Ville" icon={MapPin}>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Lyon" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Téléphone" icon={Phone}>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="06 12 34 56 78" />
              </FormField>
              <FormField label="Site web" icon={Globe}>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="maisonlea.fr" />
              </FormField>
            </div>

            <FormField label="CA mensuel actuel" icon={TrendingUp}>
              <select value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                <option value="">Non renseigné</option>
                {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-6 py-2.5 rounded-xl hover:bg-white transition-colors">
              {saved ? (<><CheckCircle2 size={16} /> Enregistré</>) : (<><Save size={16} /> Enregistrer</>)}
            </button>
          </div>
        </form>

        {/* Apparence */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
            <Palette size={18} className="text-lilac" /> Apparence
          </h2>
          <p className="text-sm text-white/50 mb-5">
            Choisis le thème qui te convient. "Système" suit les réglages de ton OS.
          </p>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Shield size={18} className="text-lilac" /> Sécurité
          </h2>
          <button className="text-sm text-lilac hover:underline">Changer mon mot de passe</button>
        </div>
      </div>
    </main>
  );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-2.5 outline-none focus:border-lilac/50 text-sm text-white placeholder:text-white/30';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10 pointer-events-none" size={16} />
        {children}
      </div>
    </div>
  );
}
