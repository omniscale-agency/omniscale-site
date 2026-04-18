'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Building2, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import Logo from '@/components/Logo';
import { register, getSession } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) router.replace(s.role === 'admin' ? '/admin' : '/dashboard');
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min).'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = register({ email: email.trim(), password, name: name.trim(), brand: brand.trim() || undefined });
      if (result.ok === false) { setError(result.error); setLoading(false); return; }
      router.push('/dashboard');
    }, 400);
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-omni-700/15 blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 16, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-lilac/10 blur-[160px]"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <a href="/" className="inline-flex items-center gap-3 mb-10 group">
          <div className="bg-lilac rounded-xl p-1.5 group-hover:rotate-12 transition-transform duration-500">
            <Logo size={28} color="#000000" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">omniscale</span>
        </a>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lilac/10 border border-lilac/30 mb-4">
          <Sparkles size={14} className="text-lilac" />
          <span className="text-xs text-lilac">Accès gratuit aux ressources scaling</span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Crée ton <span className="text-gradient">compte.</span>
        </h1>
        <p className="text-white/60 mb-8">
          Inscription gratuite. Tu auras accès à nos vidéos et conseils. Pour débloquer ton espace client complet, on activera ton accès après échange.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom complet" icon={User}>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Léa Martin"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30" />
          </Field>

          <Field label="Nom de ta marque (optionnel)" icon={Building2}>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Maison Léa"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30" />
          </Field>

          <Field label="Email" icon={Mail}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ton@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30" />
          </Field>

          <Field label="Mot de passe" icon={Lock}>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="6 caractères minimum"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30" />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" tabIndex={-1}>
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-3.5 rounded-xl hover:bg-white transition-colors disabled:opacity-60">
            {loading ? 'Création...' : (<>Créer mon compte <ArrowRight size={18} /></>)}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/50">
          Déjà inscrit ? <a href="/login" className="text-lilac hover:underline">Se connecter</a>
        </div>
      </motion.div>
    </main>
  );
}

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
