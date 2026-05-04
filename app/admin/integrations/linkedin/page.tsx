'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Linkedin, CheckCircle2, AlertCircle, LogOut, Send, Eye, Users as UsersIcon,
  RefreshCw, MessageSquare, Plug, Sparkles, Clock, ExternalLink,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Card from '@/components/dashboard/Card';

interface LinkedInAccount {
  linkedin_id: string;
  name: string;
  email?: string;
  picture_url?: string;
  expires_at?: string;
  scope?: string;
  connected_at?: string;
}

interface LinkedInPost {
  id: string;
  text_content: string;
  status: 'draft' | 'published' | 'failed';
  linkedin_post_id?: string;
  error_message?: string;
  published_at?: string;
  created_at: string;
}

export default function LinkedInPage() {
  return (
    <Suspense fallback={<div className="p-12 text-white/60">Chargement…</div>}>
      <LinkedInInner />
    </Suspense>
  );
}

function LinkedInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [account, setAccount] = useState<LinkedInAccount | null>(null);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC');
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Refresh account + posts
  const refresh = async () => {
    const sb = supabaseBrowser();
    const [acc, ps] = await Promise.all([
      sb.from('linkedin_account').select('*').eq('id', 1).maybeSingle(),
      sb.from('linkedin_posts').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setAccount((acc.data as LinkedInAccount | null) || null);
    setPosts((ps.data as LinkedInPost[]) || []);
    setLoaded(true);
  };

  useEffect(() => {
    refresh();
    const sb = supabaseBrowser();
    const ch = sb
      .channel(`linkedin-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'linkedin_account' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'linkedin_posts' }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  // Toast OAuth callback
  useEffect(() => {
    const connected = params.get('connected');
    const error = params.get('error');
    const error_description = params.get('error_description');
    if (connected === 'true') {
      setToast({ type: 'ok', msg: 'Compte LinkedIn connecté avec succès !' });
      router.replace('/admin/integrations/linkedin');
    } else if (error) {
      const msg = `${error}${error_description ? ' — ' + error_description : ''}`;
      setToast({ type: 'err', msg });
      router.replace('/admin/integrations/linkedin');
    }
    if (connected || error) {
      const t = setTimeout(() => setToast(null), 7000);
      return () => clearTimeout(t);
    }
  }, [params, router]);

  const startConnect = async () => {
    setToast(null);
    const r = await fetch('/api/integrations/linkedin/auth');
    const j = await r.json();
    if (j.url) {
      window.location.href = j.url;
    } else {
      setToast({ type: 'err', msg: j.error || 'Erreur démarrage OAuth' });
    }
  };

  const disconnect = async () => {
    if (!confirm('Déconnecter le compte LinkedIn ? Le token sera supprimé. Tu pourras te reconnecter à tout moment.')) return;
    const r = await fetch('/api/integrations/linkedin/disconnect', { method: 'POST' });
    if (r.ok) {
      setToast({ type: 'ok', msg: 'LinkedIn déconnecté' });
      refresh();
    } else {
      const j = await r.json().catch(() => ({}));
      setToast({ type: 'err', msg: j.error || 'Erreur' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const publish = async () => {
    if (!text.trim()) return;
    setPublishing(true);
    setToast(null);
    try {
      const r = await fetch('/api/integrations/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), visibility }),
      });
      const j = await r.json();
      if (r.ok) {
        setToast({ type: 'ok', msg: `Publié sur LinkedIn ! ID: ${j.postId || '—'}` });
        setText('');
        refresh();
      } else {
        setToast({ type: 'err', msg: j.error || `Erreur ${r.status}` });
      }
    } catch (e: any) {
      setToast({ type: 'err', msg: e?.message || 'Erreur réseau' });
    }
    setPublishing(false);
    setTimeout(() => setToast(null), 8000);
  };

  if (!loaded) return <main className="p-12 text-white/60">Chargement…</main>;

  const tokenExpired = account?.expires_at && new Date(account.expires_at).getTime() < Date.now();

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2 inline-flex items-center gap-2">
          <Plug size={12} /> Intégrations
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight inline-flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-[#0A66C2] flex items-center justify-center">
            <Linkedin className="text-white" size={26} />
          </span>
          LinkedIn
        </h1>
        <p className="text-white/60 mt-3 max-w-2xl">
          Connecte le compte LinkedIn d'Omniscale pour publier des posts depuis le SaaS.
        </p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl border p-4 mb-6 flex gap-3 text-sm ${
              toast.type === 'ok'
                ? 'border-green-500/30 bg-green-500/10 text-green-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}>
            {toast.type === 'ok' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-400" /> : <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />}
            <div className="break-words">{toast.msg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compte connecté ou bouton de connexion */}
      {!account ? (
        <Card title="Connexion" icon={Plug}>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-center mx-auto mb-4">
              <Linkedin className="text-[#0A66C2]" size={28} />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Aucun compte LinkedIn connecté</h3>
            <p className="text-sm text-white/60 max-w-md mx-auto mb-6">
              Connecte-toi avec ton compte LinkedIn Omniscale pour publier des posts directement depuis le SaaS.
              Scopes requis : profil, email, publication de posts.
            </p>
            <button
              onClick={startConnect}
              className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
            >
              <Linkedin size={16} /> Connecter mon compte LinkedIn
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Profil connecté */}
          <Card title="Compte connecté" icon={CheckCircle2}>
            <div className="flex items-start gap-4">
              {account.picture_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={account.picture_url} alt={account.name} className="w-16 h-16 rounded-full border-2 border-[#0A66C2]/40" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#0A66C2]/15 border-2 border-[#0A66C2]/40 flex items-center justify-center font-bold text-lg text-[#0A66C2]">
                  {account.name?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-lg">{account.name}</div>
                {account.email && <div className="text-sm text-white/60">{account.email}</div>}
                <div className="text-xs text-white/40 mt-2 inline-flex items-center gap-1.5">
                  <Clock size={11} /> Token expire le {account.expires_at ? new Date(account.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  {tokenExpired && <span className="ml-2 text-red-400 font-semibold">EXPIRÉ — reconnecte-toi</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={startConnect}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-lilac/40 hover:text-lilac inline-flex items-center gap-1.5"
                  title="Renouveler le token"
                >
                  <RefreshCw size={12} /> Reconnecter
                </button>
                <button
                  onClick={disconnect}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-red-400/40 hover:text-red-400 inline-flex items-center gap-1.5"
                >
                  <LogOut size={12} /> Déconnecter
                </button>
              </div>
            </div>
          </Card>

          {/* Composer un post */}
          <div className="mt-6">
            <Card title="Publier un post" icon={Send} subtitle="Texte uniquement (image bientôt)">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Quoi de neuf, Omniscale ? (max 3000 caractères, supporte les retours à la ligne, hashtags, emojis…)"
                rows={8}
                maxLength={3000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-lilac/50 text-sm leading-relaxed font-mono"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-white/60 inline-flex items-center gap-2">
                    Visibilité :
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'CONNECTIONS')}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-lilac/50"
                    >
                      <option value="PUBLIC">🌍 Public</option>
                      <option value="CONNECTIONS">👥 Réseau seulement</option>
                    </select>
                  </label>
                  <span className="text-xs text-white/40">
                    {text.length} / 3000
                  </span>
                </div>
                <button
                  onClick={publish}
                  disabled={!text.trim() || publishing || tokenExpired}
                  className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors disabled:opacity-50"
                >
                  {publishing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {publishing ? 'Publication…' : 'Publier maintenant'}
                </button>
              </div>
            </Card>
          </div>

          {/* Historique des posts */}
          {posts.length > 0 && (
            <div className="mt-6">
              <Card title="Historique des posts" icon={Eye} subtitle={`${posts.length} post(s) via le SaaS`}>
                <ul className="divide-y divide-white/5">
                  {posts.map((p) => (
                    <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {p.status === 'published' && <CheckCircle2 size={16} className="text-green-400" />}
                          {p.status === 'failed' && <AlertCircle size={16} className="text-red-400" />}
                          {p.status === 'draft' && <Clock size={16} className="text-white/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm whitespace-pre-wrap line-clamp-3 text-white/90">{p.text_content}</div>
                          <div className="text-xs text-white/40 mt-1 flex flex-wrap items-center gap-2">
                            <span>{new Date(p.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {p.status === 'published' && p.linkedin_post_id && (
                              <a
                                href={`https://www.linkedin.com/feed/update/${p.linkedin_post_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lilac hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink size={11} /> Voir sur LinkedIn
                              </a>
                            )}
                            {p.status === 'failed' && p.error_message && (
                              <span className="text-red-400 truncate">⚠ {p.error_message}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Section honnête sur la messagerie */}
      <div className="mt-6">
        <Card title="Messages prospects" icon={MessageSquare} subtitle="Pas d'auto-send via API officielle — workflow assisté à venir">
          <div className="space-y-4 text-sm text-white/70">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Pourquoi pas d'envoi automatique ?</strong>
                  <p className="mt-1 leading-relaxed">
                    LinkedIn n'expose <strong>pas</strong> la messagerie via leur API officielle pour les comptes personnels (réservé aux clients Sales Navigator/Recruiter à plusieurs k€/mois).
                    Les outils tiers qui automatisent (Phantombuster, Waalaxy, La Growth Machine…) violent les ToS LinkedIn et risquent de faire <strong className="text-red-400">bannir le compte Omniscale</strong>. On évite.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <strong className="text-white">Approche assistée (à venir)</strong>
              <ul className="mt-2 space-y-1.5 text-white/70 list-disc pl-5">
                <li>Import CSV de prospects (nom + URL LinkedIn + entreprise)</li>
                <li>Templates de messages personnalisables avec variables (`{'{nom}'}`, `{'{entreprise}'}`)</li>
                <li>Daily queue : "Aujourd'hui, contacte ces 10 prospects"</li>
                <li>Clic prospect → ouvre son profil LinkedIn dans un nouvel onglet, message pré-rempli copié dans le presse-papiers, t'as plus qu'à coller + envoyer (3 secondes)</li>
                <li>Tracking : marqué comme contacté, sort de la queue, stats hebdo</li>
              </ul>
              <p className="mt-3 text-xs text-white/40">
                Cette feature sera ajoutée en V2. En attendant, utilise ton workflow LinkedIn habituel.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notes techniques */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs text-white/50">
        <strong className="text-white/70">⚙ Notes techniques</strong>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          <li>Token OAuth stocké chiffré côté serveur (table <code className="text-lilac">public.linkedin_account</code>, RLS admin only).</li>
          <li>Chaque post est tracé dans <code className="text-lilac">public.linkedin_posts</code> (status: draft/published/failed) pour debug.</li>
          <li>Le token LinkedIn expire après 60 jours — tu seras notifié à 7 jours pour renouveler.</li>
          <li>Pour révoquer côté LinkedIn : <a href="https://www.linkedin.com/psettings/permitted-services" target="_blank" rel="noopener noreferrer" className="text-lilac hover:underline">Settings → Permitted services</a>.</li>
        </ul>
      </div>
    </main>
  );
}
