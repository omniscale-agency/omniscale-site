'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';
import { login, getSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [asAdmin, setAsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) {
      router.replace(s.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const session = login(email.trim(), password, asAdmin);
      if (!session) {
        setError(
          asAdmin
            ? 'Identifiants admin invalides.'
            : 'Email ou mot de passe incorrect.',
        );
        setLoading(false);
        return;
      }
      router.push(session.role === 'admin' ? '/admin' : '/dashboard');
    }, 400);
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center px-6 overflow-hidden">
      {/* Background blobs */}
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

        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Bon retour <span className="text-gradient">parmi nous.</span>
        </h1>
        <p className="text-white/60 mb-10">
          Connecte-toi à ton espace pour suivre tes performances en temps réel.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 outline-none focus:border-lilac/50 focus:bg-white/10 transition-colors text-white placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                tabIndex={-1}
                aria-label={showPwd ? 'Masquer' : 'Afficher'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Toggle admin */}
          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-lilac/30 cursor-pointer transition-colors group">
            <div className="relative">
              <input
                type="checkbox"
                checked={asAdmin}
                onChange={(e) => setAsAdmin(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-lilac transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className={asAdmin ? 'text-lilac' : 'text-white/40'} />
              <span className={asAdmin ? 'text-white font-medium' : 'text-white/70'}>
                Je suis un admin
              </span>
            </div>
          </label>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-3.5 rounded-xl hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : (
              <>
                Se connecter <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/40 space-y-1">
          <div className="font-semibold text-white/60 mb-1">Comptes de démo :</div>
          <div>👤 Client : <code className="text-lilac">lea@maisonlea.fr</code> / <code className="text-lilac">demo2026</code></div>
          <div>🛡️ Admin : <code className="text-lilac">admin@omniscale.fr</code> / <code className="text-lilac">admin2026</code> (cocher la case admin)</div>
        </div>

        <div className="mt-6 text-center text-sm text-white/60">
          Pas encore de compte ? <a href="/signup" className="text-lilac hover:underline font-medium">Créer un compte</a>
        </div>
        <div className="mt-3 text-center text-sm text-white/40">
          <a href="/" className="hover:text-lilac">← Retour au site</a>
        </div>
      </motion.div>
    </main>
  );
}
