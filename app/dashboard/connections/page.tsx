'use client';
import { useEffect, useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plug, CheckCircle2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import {
  getConnections,
  startOAuth,
  syncPlatform,
  disconnectPlatform,
  subscribeConnections,
  Connection,
  Platform,
} from '@/lib/connectionsStore';
import RoleGate from '@/components/RoleGate';

const PLATFORMS: Array<{ key: Platform; name: string; color: string; bg: string; icon: string; description: string }> = [
  { key: 'instagram', name: 'Instagram', color: 'text-pink-400', bg: 'from-fuchsia-500/15 to-orange-500/5', icon: 'IG', description: 'Stats Reels, posts, stories, abonnés gagnés en temps réel.' },
  { key: 'tiktok',    name: 'TikTok',    color: 'text-cyan-400', bg: 'from-cyan-400/15 to-pink-500/5',    icon: 'TT', description: 'Vues, partages, commentaires, taux de complétion par vidéo.' },
  { key: 'youtube',   name: 'YouTube',   color: 'text-red-400',  bg: 'from-red-600/15 to-red-800/5',      icon: 'YT', description: 'Vues, watch time, abonnés, monetisation par vidéo.' },
];

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-white/60">Chargement…</div>}>
      <ConnectionsInner />
    </Suspense>
  );
}

function ConnectionsInner() {
  const params = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [syncing, setSyncing] = useState<Platform | null>(null);
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => { getSessionAsync().then(setSession); }, []);

  useEffect(() => {
    if (!session) return;
    const refresh = async () => setConnections(await getConnections());
    refresh();
    return subscribeConnections(refresh);
  }, [session]);

  // Lit ?connected=instagram ou ?error=... du redirect callback
  useEffect(() => {
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) {
      setToast({ type: 'ok', msg: `Compte ${connected} connecté avec succès !` });
      // nettoie l'URL
      window.history.replaceState({}, '', '/dashboard/connections');
    } else if (error) {
      setToast({ type: 'err', msg: `Erreur OAuth : ${decodeURIComponent(error)}` });
      window.history.replaceState({}, '', '/dashboard/connections');
    }
    if (connected || error) {
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [params]);

  if (!session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role === 'lead') {
    return <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Connecter mes comptes sociaux"><></></RoleGate>;
  }

  const isConnected = (p: Platform) => connections.some((c) => c.platform === p);
  const getConnection = (p: Platform) => connections.find((c) => c.platform === p);

  const handleSync = async (p: Platform) => {
    setSyncing(p);
    const res = await syncPlatform(p);
    setSyncing(null);
    if (res.ok) {
      setToast({ type: 'ok', msg: `Sync ${p} OK ${res.videoCount ? `(${res.videoCount} vidéos)` : ''}` });
      startTransition(async () => setConnections(await getConnections()));
    } else {
      setToast({ type: 'err', msg: `Sync ${p} : ${res.error}` });
    }
    setTimeout(() => setToast(null), 5000);
  };

  const handleDisconnect = async (p: Platform) => {
    if (!confirm(`Déconnecter ${p} ? Les données importées seront supprimées.`)) return;
    const ok = await disconnectPlatform(p);
    if (ok) {
      setToast({ type: 'ok', msg: `${p} déconnecté.` });
      setConnections(await getConnections());
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Connexions</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Mes comptes sociaux</h1>
        <p className="text-white/60 mt-2 max-w-2xl">
          Connecte tes comptes Instagram, TikTok et YouTube en OAuth. Tes vraies stats et vidéos s'affichent automatiquement sur ton dashboard.
        </p>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 mb-6 flex gap-3 text-sm ${
            toast.type === 'ok'
              ? 'border-green-500/30 bg-green-500/10 text-green-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}>
          {toast.type === 'ok' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-400" /> : <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />}
          <div>{toast.msg}</div>
        </motion.div>
      )}

      <div className="space-y-4">
        {PLATFORMS.map((p) => {
          const conn = getConnection(p.key);
          const connected = isConnected(p.key);

          return (
            <div key={p.key} className={`rounded-2xl border ${connected ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-gradient-to-br ' + p.bg} p-6`}>
              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden ${connected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : `bg-white/10 ${p.color} border border-white/10`}`}>
                  {conn?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conn.avatarUrl} alt={conn.username} className="w-full h-full object-cover" />
                  ) : p.icon}
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
                    <div className="text-xs text-white/70 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-[10px] uppercase text-white/40">Compte</div>
                        <div className="text-white font-mono truncate">@{conn.username}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-white/40">Abonnés</div>
                        <div className="text-white font-mono">{(conn.followers || 0).toLocaleString('fr-FR')}</div>
                      </div>
                      {conn.metrics?.videoCount !== undefined && (
                        <div>
                          <div className="text-[10px] uppercase text-white/40">Vidéos</div>
                          <div className="text-white font-mono">{conn.metrics.videoCount.toLocaleString('fr-FR')}</div>
                        </div>
                      )}
                      {conn.metrics?.totalLikes !== undefined && (
                        <div>
                          <div className="text-[10px] uppercase text-white/40">Likes totaux</div>
                          <div className="text-white font-mono">{conn.metrics.totalLikes.toLocaleString('fr-FR')}</div>
                        </div>
                      )}
                      <div className="col-span-2 sm:col-span-4 text-[11px] text-white/40">
                        {conn.lastSyncedAt ? `Sync : ${new Date(conn.lastSyncedAt).toLocaleString('fr-FR')}` : 'Jamais sync'}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {connected ? (
                      <>
                        <button
                          onClick={() => handleSync(p.key)}
                          disabled={syncing === p.key}
                          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lilac text-ink font-semibold hover:bg-white transition-colors disabled:opacity-60">
                          <RefreshCw size={14} className={syncing === p.key ? 'animate-spin' : ''} />
                          {syncing === p.key ? 'Sync…' : 'Resynchroniser'}
                        </button>
                        <button
                          onClick={() => handleDisconnect(p.key)}
                          className="text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-400/40 hover:text-red-400 transition-colors">
                          Déconnecter
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startOAuth(p.key)}
                        className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lilac text-ink font-semibold hover:bg-white transition-colors">
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
        Connexion OAuth réelle via les APIs officielles : Instagram Login (Meta), TikTok Login Kit, YouTube Data v3.
      </div>
    </main>
  );
}
