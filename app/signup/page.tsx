'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Building2, ArrowRight, Eye, EyeOff, Sparkles, MapPin, Phone, Tag, Globe, TrendingUp, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { register, getSessionAsync } from '@/lib/auth';
import { sendEmail } from '@/lib/sendEmail';
import GoogleSignInButton from '@/components/GoogleSignInButton';

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

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Étape 1 — compte
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Étape 2 — entreprise
  const [brand, setBrand] = useState('');
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [website, setWebsite] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (s) router.replace(s.role === 'admin' ? '/admin' : '/dashboard');
    });
  }, [router]);

  const onStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min).'); return; }
    setStep(2);
  };

  const onFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register({
      email: email.trim(),
      password,
      name: name.trim(),
      brand: brand.trim() || undefined,
      sector: sector || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      monthlyRevenue: monthlyRevenue || undefined,
      website: website.trim() || undefined,
    });
    if (result.ok === false) { setError(result.error); setLoading(false); return; }

    // Fire-and-forget : welcome email au lead + notif admin
    const welcomeData = { name: name.trim() };
    const leadData = { name: name.trim(), email: email.trim(), brand: brand.trim(), sector, city: city.trim(), monthlyRevenue };
    Promise.all([
      sendEmail('welcome_lead', email.trim(), welcomeData).catch(() => {}),
      sendEmail('new_lead_admin', 'admin@omniscale.fr', leadData).catch(() => {}),
    ]);

    router.push('/dashboard');
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 12, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-omni-700/15 blur-[140px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 16, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-lilac/10 blur-[160px]" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg">
        <a href="/" className="inline-flex items-center gap-3 mb-10 group">
          <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
            <Logo size={28} color="#000000" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
        </a>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          <div className="h-1 flex-1 rounded-full bg-lilac" />
          <div className={`h-1 flex-1 rounded-full ${step === 2 ? 'bg-lilac' : 'bg-white/10'}`} />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lilac/10 border border-lilac/30 mb-4">
          <Sparkles size={14} className="text-lilac" />
          <span className="text-xs text-lilac">Étape {step} / 2 · Inscription gratuite</span>
        </div>

        {step === 1 && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Crée ton <span className="text-gradient">compte.</span>
            </h1>
            <p className="text-white/60 mb-8">
              Rejoins notre communauté de commerçants qui passent à l'échelle. Accès gratuit aux ressources et conseils.
            </p>

            <GoogleSignInButton label="S'inscrire avec Google" />

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs uppercase tracking-widest text-white/40">ou avec email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={onStep1Submit} className="space-y-4">
              <Field label="Nom complet" icon={User}>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ton prénom et nom" className={inputCls} />
              </Field>
              <Field label="Email" icon={Mail}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ton@email.com" className={inputCls} />
              </Field>
              <Field label="Mot de passe" icon={Lock}>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="6 caractères minimum" className={inputCls} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" tabIndex={-1}>
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              {error && (<motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                {error}
              </motion.div>)}

              <button type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-3.5 rounded-xl hover:bg-white transition-colors">
                Continuer <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Parle-nous de <span className="text-gradient">ton business.</span>
            </h1>
            <p className="text-white/60 mb-8">
              Quelques infos pour qu'on prépare ton accompagnement. Tout reste modifiable plus tard.
            </p>

            <form onSubmit={onFinalSubmit} className="space-y-4">
              <Field label="Nom de ta marque / commerce" icon={Building2}>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Maison Léa" className={inputCls} />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Secteur" icon={Tag}>
                  <select value={sector} onChange={(e) => setSector(e.target.value)} required className={inputCls + ' appearance-none pr-8'}>
                    <option value="">Choisis…</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Ville" icon={MapPin}>
                  <input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Lyon" className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Téléphone" icon={Phone}>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" className={inputCls} />
                </Field>
                <Field label="Site web (optionnel)" icon={Globe}>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="maisonlea.fr" className={inputCls} />
                </Field>
              </div>

              <Field label="CA mensuel actuel (estimé)" icon={TrendingUp}>
                <select value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} className={inputCls + ' appearance-none pr-8'}>
                  <option value="">Choisis…</option>
                  {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              {error && (<motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                {error}
              </motion.div>)}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors inline-flex items-center gap-1.5">
                  <ArrowLeft size={16} /> Retour
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-3.5 rounded-xl hover:bg-white transition-colors disabled:opacity-60">
                  {loading ? 'Création…' : (<>Créer mon compte <ArrowRight size={18} /></>)}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="mt-6 text-center text-sm text-white/50">
          Déjà inscrit ? <a href="/login" className="text-lilac hover:underline">Se connecter</a>
        </div>
      </motion.div>
    </main>
  );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30';

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10 pointer-events-none" size={18} />
        {children}
      </div>
    </div>
  );
}
