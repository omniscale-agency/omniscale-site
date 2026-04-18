'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, CheckCircle2, ExternalLink, X, Sparkles, AlertCircle } from 'lucide-react';
import { getSession, Session } from '@/lib/auth';
import { getConnections, connectPlatform, disconnectPlatform, subscribeConnections, Connection, Platform } from '@/lib/connectionsStore';
import RoleGate from '@/components/RoleGate';

const PLATFORMS: Array<{
  key: Platform;
  name: string;
  color: string;
  bg: string;
  icon: string;
  description: string;
}> = [
  { key: 'instagram', name: 'Instagram', color: 'text-pink-400', bg: 'from-fuchsia-500/15 to-orange-500/5', icon: 'IG', description: 'Stats Reels, posts, stories, abonnés gagnés en temps réel.' },
  { key: 'tiktok', name: 'TikTok', color: 'text-cyan-400', bg: 'from-cyan-400/15 to-pink-500/5', icon: 'TT', description: 'Vues, partages, commentaires, taux de complétion par vidéo.' },
  { key: 'youtube', name: 'YouTube', color: 'text-red-400', bg: 'from-red-600/15 to-red-800/5', icon: 'YT', description: 'Vues, watch time, abonnés, monetisation par vidéo.' },
];

export default function ConnectionsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [connections, setConnectionsState] = useState<Connection[]>([]);
  const [connectingFor, setConnectingFor] = useState<Platform | null>(null);

  useEffect(() => { setSession(getSession()); }, []);

  useEffect(() => {
    if (!session) return;
    const refresh = () => setConnectionsState(getConnections(session.email));
    refresh();
    return subscribeConnections(refresh);
  }, [session]);

  if (!session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Connecter mes comptes sociaux"><></></RoleGate>;
  }

  const isConnected = (p: Platform) => connections.some((c) => c.platform === p);
  const getConnection = (p: Platform) => connections.find((c) => c.platform === p);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Connexions</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Mes comptes sociaux</h1>
        <p className="text-white/60 mt-2 max-w-2xl">
          Connecte tes comptes Instagram, TikTok et YouTube pour voir tes vraies statistiques et tes vraies vidéos directement depuis ton dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-8 flex gap-3 text-sm">
        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <div>
          <strong className="text-amber-300">Mode démo :</strong> <span className="text-white/70">Pour l'instant la connexion est simulée. La vraie intégration OAuth (Instagram Graph API, TikTok Business API, YouTube Data API) sera activée en phase 2 — ça nécessite la validation des apps par chaque plateforme (1 à 2 semaines).</span>
        </div>
      </div>

      <div className="space-y-4">
        {PLATFORMS.map((p) => {
          const conn = getConnection(p.key);
          const connected = isConnected(p.key);

          return (
            <div key={p.key} className={`rounded-2xl border ${connected ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-gradient-to-br ' + p.bg} p-6`}>
              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${connected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : `bg-white/10 ${p.color} border border-white/10`}`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-xl">{p.name}</h3>
                    {connected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 inline-flex items-center gap-1">
                        <CheckCircle2 size={11} /> Connecté
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-4">{p.description}</p>
                  {conn && (
                    <div className="text-xs text-white/70 mb-4 space-y-1">
                      <div>Compte : <span className="text-white font-mono">@{conn.username}</span></div>
                      <div>Abonnés : <span className="text-white font-mono">{conn.followers.toLocaleString('fr-FR')}</span></div>
                      <div>Connecté le {new Date(conn.connectedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {connected ? (
                      <button
                        onClick={() => disconnectPlatform(session.email, p.key)}
                        className="text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-400/40 hover:text-red-400 transition-colors"
                      >
                        Déconnecter
                      </button>
                    ) : (
                      <button
                        onClick={() => setConnectingFor(p.key)}
                        className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lilac text-ink font-semibold hover:bg-white transition-colors"
                      >
                        <Plug size={14} /> Connecter mon compte {p.name}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/50 text-center">
        <Sparkles className="text-lilac mx-auto mb-2" size={20} />
        Une fois tes comptes connectés, tes <strong className="text-white">vraies stats</strong> et <strong className="text-white">vraies vidéos</strong> remplaceront les données démo dans ton dashboard.
      </div>

      <ConnectModal
        open={connectingFor !== null}
        platform={connectingFor}
        onClose={() => setConnectingFor(null)}
        onConnect={(username, followers) => {
          if (!connectingFor || !session) return;
          connectPlatform(session.email, connectingFor, username, followers);
          setConnectingFor(null);
        }}
      />
    </main>
  );
}

function ConnectModal({ open, platform, onClose, onConnect }: { open: boolean; platform: Platform | null; onClose: () => void; onConnect: (username: string, followers: number) => void }) {
  const [username, setUsername] = useState('');
  const [followers, setFollowers] = useState('');
  const [step, setStep] = useState<'auth' | 'redirecting' | 'done'>('auth');

  const platformInfo = PLATFORMS.find((p) => p.key === platform);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('redirecting');
    setTimeout(() => {
      onConnect(username.replace('@', ''), parseInt(followers) || 0);
      setUsername(''); setFollowers(''); setStep('auth');
    }, 1100);
  };

  return (
    <AnimatePresence>
      {open && platformInfo && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-black border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl inline-flex items-center gap-2">
                <Plug size={18} className="text-lilac" /> Connecter {platformInfo.name}
              </h3>
              <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>

            {step === 'auth' && (
              <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-white/60 mb-3">
                  Mode démo : entre les infos de ton compte {platformInfo.name} pour simuler la connexion. En prod, ce sera un vrai flow OAuth.
                </p>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Pseudo {platformInfo.name}</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={platform === 'youtube' ? '@ma-chaine' : '@mon_compte'}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">Nombre d'abonnés (approx.)</label>
                  <input
                    type="number"
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    required
                    placeholder="12000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-lilac/50 text-sm"
                  />
                </div>
                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-lilac text-ink font-semibold py-3 rounded-lg hover:bg-white transition-colors">
                  <ExternalLink size={14} /> Autoriser Omniscale
                </button>
                <p className="text-[11px] text-white/40 text-center">
                  En phase 2 : redirection OAuth réelle vers {platformInfo.name} → tokens stockés côté serveur.
                </p>
              </form>
            )}

            {step === 'redirecting' && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-lilac/20 border border-lilac/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <ExternalLink className="text-lilac" size={20} />
                </div>
                <p className="text-sm text-white/70">Connexion à {platformInfo.name}…</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
