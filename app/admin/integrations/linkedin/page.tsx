'use client';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Linkedin, CheckCircle2, AlertCircle, LogOut, Send, Eye,
  RefreshCw, MessageSquare, Plug, Clock, ExternalLink, Sparkles,
  Calendar as CalendarIcon, Wand2, Trash2, Inbox, Bot,
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
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  linkedin_post_id?: string;
  error_message?: string;
  published_at?: string;
  scheduled_at?: string;
  created_at: string;
}

type Tab = 'compose' | 'ai' | 'scheduled' | 'history' | 'live' | 'messages';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; input: any; result?: string }>;
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
  const [tab, setTab] = useState<Tab>('ai');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const refresh = async () => {
    const sb = supabaseBrowser();
    const [acc, ps] = await Promise.all([
      sb.from('linkedin_account').select('*').eq('id', 1).maybeSingle(),
      sb.from('linkedin_posts').select('*').order('created_at', { ascending: false }).limit(50),
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

  useEffect(() => {
    const connected = params.get('connected');
    const error = params.get('error');
    const error_description = params.get('error_description');
    if (connected === 'true') {
      setToast({ type: 'ok', msg: 'Compte LinkedIn connecté avec succès !' });
      router.replace('/admin/integrations/linkedin');
    } else if (error) {
      setToast({ type: 'err', msg: `${error}${error_description ? ' — ' + error_description : ''}` });
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
    if (j.url) window.location.href = j.url;
    else setToast({ type: 'err', msg: j.error || 'Erreur OAuth' });
  };

  const disconnect = async () => {
    if (!confirm('Déconnecter le compte LinkedIn ?')) return;
    await fetch('/api/integrations/linkedin/disconnect', { method: 'POST' });
    setToast({ type: 'ok', msg: 'LinkedIn déconnecté' });
    setTimeout(() => setToast(null), 4000);
    refresh();
  };

  if (!loaded) return <main className="p-12 text-white/60">Chargement…</main>;

  const tokenExpired = account?.expires_at && new Date(account.expires_at).getTime() < Date.now();
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const historyPosts = posts.filter((p) => p.status !== 'scheduled');

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto">
      <div className="mb-8">
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
          Compte LinkedIn d'Omniscale connecté pour publier, programmer (via cron toutes les 5 min) et chatter avec l'IA pour rédiger des posts.
        </p>
      </div>

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

      {!account ? (
        <Card title="Connexion" icon={Plug}>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-center mx-auto mb-4">
              <Linkedin className="text-[#0A66C2]" size={28} />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Aucun compte LinkedIn connecté</h3>
            <button
              onClick={startConnect}
              className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors mt-2"
            >
              <Linkedin size={16} /> Connecter mon compte LinkedIn
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Profil compact */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-6 flex items-center gap-3">
            {account.picture_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={account.picture_url} alt={account.name} className="w-12 h-12 rounded-full border border-[#0A66C2]/40" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#0A66C2]/15 border border-[#0A66C2]/40 flex items-center justify-center font-bold text-sm text-[#0A66C2]">
                {account.name?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium">{account.name}</div>
              <div className="text-xs text-white/40 inline-flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-green-400" /> Connecté
                {tokenExpired && <span className="ml-2 text-red-400 font-semibold">TOKEN EXPIRÉ</span>}
              </div>
            </div>
            <button onClick={startConnect} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-lilac/40 inline-flex items-center gap-1.5">
              <RefreshCw size={11} /> Reconnecter
            </button>
            <button onClick={disconnect} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-red-400/40 hover:text-red-400 inline-flex items-center gap-1.5">
              <LogOut size={11} /> Déconnecter
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {([
              { k: 'ai',        l: 'Assistant IA',    Icon: Bot },
              { k: 'compose',   l: 'Publier maintenant', Icon: Send },
              { k: 'scheduled', l: `Programmés (${scheduledPosts.length})`, Icon: CalendarIcon },
              { k: 'live',      l: 'Mes posts LinkedIn', Icon: Linkedin },
              { k: 'history',   l: `Historique SaaS (${historyPosts.length})`, Icon: Eye },
              { k: 'messages',  l: 'Messages reçus',  Icon: Inbox },
            ] as { k: Tab; l: string; Icon: any }[]).map(({ k, l, Icon }) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                data-history-tab={k === 'history' ? '' : undefined}
                className={`px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 transition-colors ${
                  tab === k
                    ? 'bg-lilac text-ink font-semibold'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon size={14} /> {l}
              </button>
            ))}
          </div>

          {tab === 'ai' && <AiTab onToast={setToast} />}
          {tab === 'compose' && <ComposeTab tokenExpired={!!tokenExpired} onToast={setToast} />}
          {tab === 'scheduled' && <ScheduledTab posts={scheduledPosts} onToast={setToast} onRefresh={refresh} />}
          {tab === 'live' && <LivePostsTab profileUrl="https://www.linkedin.com/in/omniscale-agency-bb0b35405/recent-activity/all/" />}
          {tab === 'history' && <HistoryTab posts={historyPosts} />}
          {tab === 'messages' && <MessagesTab />}
        </>
      )}
    </main>
  );
}

// ════════════════════════════════════════════════════════
// Tab: Assistant IA
// ════════════════════════════════════════════════════════
function AiTab({ onToast }: { onToast: (t: { type: 'ok' | 'err'; msg: string } | null) => void }) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingTools, setStreamingTools] = useState<Array<{ name: string; input: any; result?: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingText, streamingTools]);

  const send = async () => {
    const txt = input.trim();
    if (!txt || streaming) return;
    const newMessages: AiMessage[] = [...messages, { role: 'user', content: txt }];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setStreamingText('');
    setStreamingTools([]);

    try {
      const res = await fetch('/api/integrations/linkedin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        onToast({ type: 'err', msg: j.error || `HTTP ${res.status}` });
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let finalText = '';
      let finalTools: Array<{ name: string; input: any; result?: string }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'text') {
              finalText += ev.text;
              setStreamingText((s) => s + ev.text);
            } else if (ev.type === 'tool_use') {
              const newTool = { name: ev.tool_name, input: ev.tool_input };
              finalTools = [...finalTools, newTool];
              setStreamingTools(finalTools);
            } else if (ev.type === 'tool_result') {
              finalTools = finalTools.map((t, i) =>
                i === finalTools.length - 1 && t.name === ev.tool_name
                  ? { ...t, result: ev.tool_result }
                  : t
              );
              setStreamingTools(finalTools);
            } else if (ev.type === 'error') {
              onToast({ type: 'err', msg: ev.error });
            }
          } catch {}
        }
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: finalText, toolCalls: finalTools },
      ]);
      setStreamingText('');
      setStreamingTools([]);
    } catch (e: any) {
      onToast({ type: 'err', msg: e?.message || 'Erreur réseau' });
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => {
    if (streaming) return;
    if (messages.length === 0 || confirm('Effacer la conversation ?')) {
      setMessages([]);
      setStreamingText('');
      setStreamingTools([]);
    }
  };

  const presetPrompts = [
    'Écris-moi un post LinkedIn sur l\'erreur n°1 que font les commerces sur Insta',
    'Crée 3 posts cette semaine sur les bénéfices de l\'IA en marketing, programme-les Lu/Me/Ve à 9h',
    'Voir mes posts programmés',
    'Rédige un retour d\'expérience client en 200 mots sur un commerce qui a x10 son CA',
  ];

  return (
    <Card title="Assistant IA — Rédaction & programmation" icon={Bot} subtitle="Claude Sonnet 4.6 + outils custom (create_draft, schedule_post, list_scheduled, cancel_scheduled)">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-4 max-h-[60vh] overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 && !streamingText && (
          <div className="py-8 text-center">
            <Wand2 size={32} className="mx-auto text-lilac mb-3" />
            <p className="text-white/60 text-sm mb-4">Demande-moi de rédiger un post, d'en programmer plusieurs, ou de gérer ton planning éditorial.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {presetPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-lilac/10 border border-lilac/30 text-lilac hover:bg-lilac/20"
                >
                  {p.length > 60 ? p.slice(0, 60) + '…' : p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {streaming && (streamingText || streamingTools.length > 0) && (
            <MessageBubble
              message={{
                role: 'assistant',
                content: streamingText || '…',
                toolCalls: streamingTools,
              }}
              streaming
            />
          )}
          {streaming && !streamingText && streamingTools.length === 0 && (
            <div className="text-white/40 text-xs italic flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin" /> L'assistant réfléchit…
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
          }}
          placeholder="Demande à l'assistant... (Cmd+Entrée pour envoyer)"
          rows={3}
          disabled={streaming}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-lilac/50 text-sm resize-none disabled:opacity-50"
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-5 py-3 rounded-xl text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {streaming ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
          <button
            onClick={reset}
            disabled={streaming}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 px-5 py-2 rounded-xl text-xs disabled:opacity-50"
            title="Effacer la conversation"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message, streaming }: { message: AiMessage; streaming?: boolean }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'bg-lilac text-ink' : 'bg-white/5 text-white border border-white/10'} rounded-2xl px-4 py-3`}>
        <div className="text-xs uppercase tracking-widest opacity-60 mb-1.5 inline-flex items-center gap-1.5">
          {isUser ? '👤 Toi' : <><Bot size={11} /> Assistant{streaming && <span className="ml-1 animate-pulse">●</span>}</>}
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {message.toolCalls.map((tc, i) => (
              <ToolCallBadge key={i} tool={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallBadge({ tool }: { tool: { name: string; input: any; result?: string } }) {
  const [open, setOpen] = useState(false);
  const labels: Record<string, { label: string; icon: any }> = {
    create_draft: { label: 'Brouillon créé', icon: Wand2 },
    schedule_post: { label: 'Post programmé', icon: CalendarIcon },
    list_scheduled: { label: 'Posts programmés listés', icon: Eye },
    cancel_scheduled: { label: 'Programmation annulée', icon: Trash2 },
  };
  const meta = labels[tool.name] || { label: tool.name, icon: Sparkles };
  const Icon = meta.icon;
  let parsed: any = null;
  try { parsed = tool.result ? JSON.parse(tool.result) : null; } catch {}
  const ok = parsed?.ok !== false && !parsed?.error;
  return (
    <div className={`text-xs rounded-lg border ${ok ? 'border-lilac/30 bg-lilac/5' : 'border-red-500/30 bg-red-500/5'} p-2`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon size={12} className={ok ? 'text-lilac' : 'text-red-400'} />
          <strong>{meta.label}</strong>
          {parsed?.error && <span className="text-red-400">— {parsed.error}</span>}
        </span>
        <span className="text-white/40">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <pre className="mt-2 text-[10px] text-white/60 whitespace-pre-wrap font-mono overflow-x-auto">
{`Input: ${JSON.stringify(tool.input, null, 2)}\n\nResult: ${tool.result || '(streaming...)'}`}
        </pre>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Tab: Compose (publier maintenant)
// ════════════════════════════════════════════════════════
function ComposeTab({ tokenExpired, onToast }: { tokenExpired: boolean; onToast: (t: { type: 'ok' | 'err'; msg: string } | null) => void }) {
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC');
  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    if (!text.trim()) return;
    setPublishing(true);
    try {
      const r = await fetch('/api/integrations/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), visibility }),
      });
      const j = await r.json();
      if (r.ok) {
        onToast({ type: 'ok', msg: `Publié sur LinkedIn ! ID: ${j.postId || '—'}` });
        setText('');
      } else {
        onToast({ type: 'err', msg: j.error || `Erreur ${r.status}` });
      }
    } catch (e: any) {
      onToast({ type: 'err', msg: e?.message || 'Erreur réseau' });
    }
    setPublishing(false);
    setTimeout(() => onToast(null), 8000);
  };

  return (
    <Card title="Publier maintenant" icon={Send} subtitle="Publication immédiate sur LinkedIn">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Rédige ton post (max 3000 caractères)…"
        rows={10}
        maxLength={3000}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-lilac/50 text-sm leading-relaxed font-mono"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'CONNECTIONS')}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="PUBLIC">🌍 Public</option>
            <option value="CONNECTIONS">👥 Réseau</option>
          </select>
          <span className="text-xs text-white/40">{text.length} / 3000</span>
        </div>
        <button
          onClick={publish}
          disabled={!text.trim() || publishing || tokenExpired}
          className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-50"
        >
          {publishing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          {publishing ? 'Publication…' : 'Publier maintenant'}
        </button>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// Tab: Scheduled
// ════════════════════════════════════════════════════════
function ScheduledTab({ posts, onToast, onRefresh }: { posts: LinkedInPost[]; onToast: (t: any) => void; onRefresh: () => void }) {
  const cancel = async (id: string) => {
    if (!confirm('Annuler ce post programmé ? Il repassera en brouillon.')) return;
    const sb = supabaseBrowser();
    const { error } = await sb.from('linkedin_posts').update({ status: 'draft', scheduled_at: null }).eq('id', id);
    if (error) onToast({ type: 'err', msg: error.message });
    else { onToast({ type: 'ok', msg: 'Programmation annulée' }); onRefresh(); }
    setTimeout(() => onToast(null), 4000);
  };

  return (
    <Card title="Posts programmés" icon={CalendarIcon} subtitle="Cron de publication toutes les 5 min">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          <CalendarIcon className="mx-auto mb-3 opacity-50" size={32} />
          <p>Aucun post programmé.</p>
          <p className="text-xs mt-2">Demande à l'assistant IA de te programmer des posts.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {posts.map((p) => (
            <li key={p.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm whitespace-pre-wrap line-clamp-3 text-white/90 mb-2">{p.text_content}</div>
                  <div className="text-xs text-white/40 inline-flex items-center gap-1.5">
                    <Clock size={11} className="text-lilac" />
                    Publication programmée :
                    <strong className="text-white">
                      {new Date(p.scheduled_at!).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
                    </strong>
                  </div>
                </div>
                <button
                  onClick={() => cancel(p.id)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-red-400/40 hover:text-red-400 inline-flex items-center gap-1.5"
                >
                  <Trash2 size={11} /> Annuler
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// Tab: History
// ════════════════════════════════════════════════════════
function HistoryTab({ posts }: { posts: LinkedInPost[] }) {
  if (posts.length === 0) {
    return (
      <Card title="Historique" icon={Eye}>
        <div className="text-center py-12 text-white/50">
          <p>Aucun post dans l'historique.</p>
        </div>
      </Card>
    );
  }
  return (
    <Card title="Historique des posts" icon={Eye} subtitle={`${posts.length} post(s) — drafts, publiés, échecs`}>
      <ul className="divide-y divide-white/5">
        {posts.map((p) => (
          <li key={p.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {p.status === 'published' && <CheckCircle2 size={16} className="text-green-400" />}
                {p.status === 'failed' && <AlertCircle size={16} className="text-red-400" />}
                {p.status === 'draft' && <Wand2 size={16} className="text-white/40" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm whitespace-pre-wrap line-clamp-3 text-white/90">{p.text_content}</div>
                <div className="text-xs text-white/40 mt-1 flex flex-wrap items-center gap-2">
                  <span>{new Date(p.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase text-[9px]">{p.status}</span>
                  {p.status === 'published' && p.linkedin_post_id && (
                    <a href={`https://www.linkedin.com/feed/update/${p.linkedin_post_id}`} target="_blank" rel="noopener noreferrer" className="text-lilac hover:underline inline-flex items-center gap-1">
                      <ExternalLink size={11} /> LinkedIn
                    </a>
                  )}
                  {p.status === 'failed' && p.error_message && <span className="text-red-400 truncate">⚠ {p.error_message}</span>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// Tab: Live posts — limité par l'API LinkedIn
// ════════════════════════════════════════════════════════
function LivePostsTab({ profileUrl }: { profileUrl: string }) {
  return (
    <Card
      title="Mes posts LinkedIn"
      icon={Linkedin}
      subtitle="Tous les posts publiés sur ton profil"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm leading-relaxed">
              <strong className="text-white block mb-1">Limitation API LinkedIn</strong>
              <p className="text-white/70 mb-2">
                LinkedIn ne permet pas de lister les posts d'un profil personnel via leur API
                publique. Le scope <code className="text-lilac">r_member_social</code> nécessaire
                est réservé aux partenaires « Marketing Developer Platform » (entreprises
                approuvées par LinkedIn, processus long et restrictif).
              </p>
              <p className="text-white/70">
                Du coup, deux solutions complémentaires :
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-colors p-5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Linkedin className="text-white" size={18} />
            </div>
            <div className="font-display font-bold mb-1 inline-flex items-center gap-1.5">
              Voir tous mes posts sur LinkedIn <ExternalLink size={13} />
            </div>
            <p className="text-xs text-white/60">
              Ouvre directement ton profil dans un nouvel onglet — tous tes posts y sont visibles
              avec stats, likes et commentaires.
            </p>
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const btn = (e.currentTarget as HTMLElement);
              const parent = btn.closest('main')?.querySelector('[data-history-tab]') as HTMLButtonElement | null;
              parent?.click();
            }}
            className="rounded-xl border border-lilac/30 bg-lilac/5 hover:bg-lilac/10 transition-colors p-5 group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-lilac flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Eye className="text-ink" size={18} />
            </div>
            <div className="font-display font-bold mb-1">
              Posts publiés via le SaaS
            </div>
            <p className="text-xs text-white/60">
              Onglet « Historique SaaS » : tous les posts que tu as publiés ou programmés depuis
              cette interface, avec leur statut (publié / échoué / brouillon) et lien direct.
            </p>
          </button>
        </div>

        <div className="text-xs text-white/40 text-center pt-2">
          Si LinkedIn ouvre un jour le scope <code>r_member_social</code> aux apps standard, on
          activera l'affichage live ici sans reconnexion supplémentaire.
        </div>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// Tab: Messages reçus (placeholder honnête)
// ════════════════════════════════════════════════════════
function MessagesTab() {
  return (
    <Card title="Messages reçus" icon={Inbox} subtitle="Inbox LinkedIn — voir limitation API ci-dessous">
      <div className="space-y-4 text-sm text-white/70">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">LinkedIn API ne permet pas de lire la messagerie</strong>
              <p className="mt-1 leading-relaxed">
                L'API officielle LinkedIn ne donne pas accès aux messages DM reçus pour les comptes personnels (uniquement réservé aux clients Recruiter/Sales Navigator à plusieurs k€/mois).
                Impossible donc d'afficher l'inbox automatiquement ici.
              </p>
            </div>
          </div>
        </div>
        <div>
          <strong className="text-white">Workaround possible (V2)</strong>
          <ul className="mt-2 space-y-1.5 list-disc pl-5">
            <li>Connecter l'inbox via une **extension navigateur** (lit la messagerie depuis ton onglet LinkedIn ouvert et la sync ici)</li>
            <li>Setup d'un **forward email** : LinkedIn t'envoie un email pour chaque DM → on parse les emails et on les affiche ici</li>
            <li>Outil tiers Phantombuster/Waalaxy (⚠️ risque de ban LinkedIn — déconseillé)</li>
          </ul>
        </div>
        <div className="text-xs text-white/40 pt-3 border-t border-white/10">
          En attendant, ouvre ta messagerie LinkedIn directement :
          <a href="https://www.linkedin.com/messaging/" target="_blank" rel="noopener noreferrer" className="ml-1 text-lilac hover:underline inline-flex items-center gap-1">
            <ExternalLink size={11} /> Inbox LinkedIn
          </a>
        </div>
      </div>
    </Card>
  );
}
