'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck, RefreshCw, ExternalLink, Mail, Phone, Filter,
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Bug, Sparkles,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { supabaseBrowser } from '@/lib/supabase/client';
import RoleGate from '@/components/RoleGate';

type BookingEvent = 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show';

interface Booking {
  id: string;
  external_id: string;
  source: string | null;
  event: BookingEvent;
  invitee_name: string | null;
  invitee_email: string | null;
  invitee_phone: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  closer: string | null;
  meeting_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  received_at: string;
  matched_user_id: string | null;
}

type FilterKey = 'all' | 'upcoming' | 'past' | BookingEvent;

const EVENT_META: Record<BookingEvent, { label: string; cls: string; Icon: any }> = {
  scheduled:   { label: 'Programmé',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   Icon: Calendar },
  rescheduled: { label: 'Reprogrammé', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', Icon: RefreshCw },
  cancelled:   { label: 'Annulé',      cls: 'bg-red-500/15 text-red-400 border-red-500/30',     Icon: XCircle },
  completed:   { label: 'Effectué',    cls: 'bg-green-500/15 text-green-400 border-green-500/30', Icon: CheckCircle2 },
  no_show:     { label: 'No-show',     cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30', Icon: AlertCircle },
};

export default function AdminBookingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { getSessionAsync().then(setSession); }, []);

  const loadBookings = async () => {
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from('bookings')
      .select('*')
      .order('scheduled_at', { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) console.error('[bookings] load error', error);
    setBookings((data as Booking[]) || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!session) return;
    loadBookings();
    // Realtime — on rafraîchit dès qu'un nouveau booking arrive
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`bookings-admin-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadBookings())
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [session]);

  const handleRefresh = async () => { setRefreshing(true); await loadBookings(); };

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      // Filter par status / time
      if (filter === 'upcoming') {
        if (!b.scheduled_at) return false;
        if (new Date(b.scheduled_at).getTime() < now) return false;
        if (b.event === 'cancelled') return false;
      } else if (filter === 'past') {
        if (!b.scheduled_at) return false;
        if (new Date(b.scheduled_at).getTime() >= now) return false;
      } else if (filter !== 'all') {
        if (b.event !== filter) return false;
      }
      // Search
      if (q) {
        const hay = `${b.invitee_name || ''} ${b.invitee_email || ''} ${b.invitee_phone || ''} ${b.utm_source || ''} ${b.utm_campaign || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, filter, search]);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = bookings.filter((b) => b.scheduled_at && new Date(b.scheduled_at).getTime() >= now && b.event !== 'cancelled').length;
    const completed = bookings.filter((b) => b.event === 'completed').length;
    const noShow = bookings.filter((b) => b.event === 'no_show').length;
    const cancelled = bookings.filter((b) => b.event === 'cancelled').length;
    const last30 = bookings.filter((b) => new Date(b.received_at).getTime() >= now - 30 * 86400_000).length;
    return { upcoming, completed, noShow, cancelled, last30, total: bookings.length };
  }, [bookings]);

  if (!session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role !== 'admin') {
    return <RoleGate userRole={session.role} allowed={['admin']} feature="RDV iClosed"><></></RoleGate>;
  }

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin · RDV iClosed</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Mes <span className="text-gradient">rendez-vous.</span>
          </h1>
          <p className="text-white/60 mt-2">
            Tous les appels réservés via iClosed. Mise à jour en temps réel — un email t'est envoyé à chaque nouveau RDV.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-lilac/30 text-sm transition-colors disabled:opacity-60 self-start"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <KpiTile label="À venir" value={stats.upcoming} accent="blue" />
        <KpiTile label="30 derniers jours" value={stats.last30} accent="lilac" />
        <KpiTile label="Effectués" value={stats.completed} accent="green" />
        <KpiTile label="No-show" value={stats.noShow} accent="orange" />
        <KpiTile label="Annulés" value={stats.cancelled} accent="red" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="inline-flex flex-wrap gap-1.5">
          {([
            { k: 'all',         l: 'Tous' },
            { k: 'upcoming',    l: 'À venir' },
            { k: 'past',        l: 'Passés' },
            { k: 'scheduled',   l: 'Programmés' },
            { k: 'completed',   l: 'Effectués' },
            { k: 'no_show',     l: 'No-show' },
            { k: 'cancelled',   l: 'Annulés' },
          ] as const).map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as FilterKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.k
                  ? 'bg-lilac text-ink'
                  : 'bg-white/[0.03] border border-white/10 text-white/70 hover:text-white'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <div className="md:ml-auto relative max-w-xs flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email, source…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-lilac/50"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-white/60">Chargement…</div>
      ) : filtered.length === 0 ? (
        <EmptyState totalBookings={bookings.length} filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}

      {/* Debug panel — visible uniquement à l'admin */}
      <DebugPanel onSeeded={loadBookings} />
    </main>
  );
}

// ════════════════════════════════════════════════════════
// Panneau de debug — webhook logs + seed test booking
// ════════════════════════════════════════════════════════
interface WebhookLog {
  id: string;
  endpoint: string;
  status_code: number | null;
  result: string | null;
  body_preview: string | null;
  user_agent: string | null;
  ip: string | null;
  received_at: string;
}

function DebugPanel({ onSeeded }: { onSeeded: () => void }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<string>('');

  const loadLogs = async () => {
    const sb = supabaseBrowser();
    const { data } = await sb
      .from('webhook_logs')
      .select('*')
      .eq('endpoint', 'iclosed')
      .order('received_at', { ascending: false })
      .limit(20);
    setLogs((data as WebhookLog[]) || []);
  };

  useEffect(() => {
    if (open) loadLogs();
  }, [open]);

  const seed = async () => {
    setSeeding(true);
    try {
      const r = await fetch('/api/dev/seed-booking', { method: 'POST' });
      const j = await r.json();
      if (r.ok) {
        setToast('✓ Faux booking inséré. Tu devrais le voir apparaître dans la liste.');
        onSeeded();
      } else {
        setToast(`Erreur : ${j.error || r.status}`);
      }
    } catch (e: any) {
      setToast(`Erreur réseau : ${e?.message}`);
    }
    setSeeding(false);
    setTimeout(() => setToast(''), 6000);
  };

  return (
    <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="inline-flex items-center gap-2">
          <Bug size={16} className="text-amber-400" />
          <span className="font-semibold">Outils de debug iClosed</span>
          <span className="text-xs text-white/40">Logs webhook + test seed</span>
        </div>
        {open ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/5">
          {/* Section 1 : Test seed */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm inline-flex items-center gap-2">
                <Sparkles size={14} className="text-lilac" /> 1 · Vérifier que l'affichage marche
              </h3>
              <button
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
              >
                {seeding ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                Insérer un faux RDV
              </button>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Insère un booking de test directement en DB (bypass webhook). Si tu le vois apparaître
              dans la liste juste après → toute la chaîne d'affichage marche, le problème est uniquement
              côté iClosed (webhook pas configuré ou secret mismatch).
            </p>
            {toast && (
              <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300">
                {toast}
              </div>
            )}
          </div>

          {/* Section 2 : Webhook logs */}
          <div className="pt-5 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm inline-flex items-center gap-2">
                <Bug size={14} className="text-amber-400" /> 2 · Tentatives reçues sur le webhook
              </h3>
              <button
                onClick={loadLogs}
                className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-lilac/30 inline-flex items-center gap-1"
              >
                <RefreshCw size={10} /> Refresh
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="text-xs text-white/50 italic px-3 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                Aucune requête entrante loggée. Si t'es sûr d'avoir réservé un appel test sur iClosed
                et que rien n'apparaît ici, c'est que <strong>iClosed n'arrive pas à toucher l'endpoint</strong>
                (URL mal configurée, redirect 307/308 qui drop le POST).
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-80 overflow-y-auto">
                {logs.map((l) => (
                  <li key={l.id} className="text-xs rounded-lg bg-black/40 border border-white/5 p-2.5 font-mono">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded font-semibold ${
                        l.status_code === 200 ? 'bg-green-500/20 text-green-300' :
                        l.status_code === 401 ? 'bg-red-500/20 text-red-300' :
                        l.status_code === 400 ? 'bg-orange-500/20 text-orange-300' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {l.status_code}
                      </span>
                      <span className="text-white/80">{l.result}</span>
                      <span className="text-white/40 ml-auto">{new Date(l.received_at).toLocaleString('fr-FR')}</span>
                    </div>
                    {l.user_agent && (
                      <div className="text-white/50 truncate text-[10px]">UA: {l.user_agent}</div>
                    )}
                    {l.body_preview && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-white/40 text-[10px] hover:text-lilac">
                          Voir body ({l.body_preview.length} chars)
                        </summary>
                        <pre className="mt-1 text-[10px] text-white/60 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                          {l.body_preview}
                        </pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 3 : URL canonique */}
          <div className="pt-5 border-t border-white/5">
            <h3 className="font-semibold text-sm mb-2 inline-flex items-center gap-2">
              <ExternalLink size={14} className="text-lilac" /> 3 · URL exacte à mettre dans iClosed
            </h3>
            <p className="text-xs text-white/50 mb-2">
              Le domaine bare (omniscale.fr) renvoie un <strong>307 → www</strong>, et l'URL sans
              trailing slash renvoie un <strong>308 → /iclosed/</strong>. Beaucoup de webhook
              providers ne suivent pas les redirects et perdent le POST. Utilise l'URL canonique :
            </p>
            <code className="block px-3 py-2 rounded bg-black/60 border border-lilac/30 text-lilac text-xs break-all">
              https://www.omniscale.fr/api/webhooks/iclosed/
            </code>
            <p className="text-xs text-white/40 mt-2">
              Avec <strong>www</strong> ET <strong>trailing slash</strong>. Aucun redirect → aucun
              risque que iClosed lâche le POST en route.
            </p>
            <p className="text-xs text-white/40 mt-2">
              Pour le secret : ajoute le header <code className="text-lilac">X-Webhook-Secret: &lt;valeur&gt;</code>
              {' '}OU le query param <code className="text-lilac">?secret=&lt;valeur&gt;</code>, et mets la même
              valeur dans <code className="text-lilac">ICLOSED_WEBHOOK_SECRET</code> côté Vercel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent: 'blue' | 'lilac' | 'green' | 'orange' | 'red' }) {
  const colors: Record<string, string> = {
    blue:   'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    lilac:  'from-lilac/20 to-lilac/5 border-lilac/30 text-lilac',
    green:  'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400',
    red:    'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[accent]} p-4`}>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">{label}</div>
    </div>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const meta = EVENT_META[b.event];
  const Icon = meta.Icon;
  const scheduledDate = b.scheduled_at ? new Date(b.scheduled_at) : null;
  const isUpcoming = scheduledDate && scheduledDate.getTime() > Date.now() && b.event !== 'cancelled';
  return (
    <div className={`rounded-2xl border ${isUpcoming ? 'border-lilac/30 bg-lilac/5' : 'border-white/10 bg-white/[0.02]'} p-5 hover:border-lilac/40 transition-colors`}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Date block */}
        <div className="md:w-32 shrink-0">
          {scheduledDate ? (
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
              <div className="text-[10px] uppercase text-white/50">{scheduledDate.toLocaleDateString('fr-FR', { month: 'short' })}</div>
              <div className="font-display text-3xl font-bold text-lilac leading-none my-1">{scheduledDate.getDate()}</div>
              <div className="text-xs text-white/70">{scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              {b.duration_minutes && <div className="text-[10px] text-white/40 mt-1">{b.duration_minutes} min</div>}
            </div>
          ) : (
            <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center text-white/40 text-xs italic">
              Date non précisée
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider inline-flex items-center gap-1 ${meta.cls}`}>
              <Icon size={10} /> {meta.label}
            </span>
            {b.matched_user_id && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-semibold">
                ✓ Compte SaaS lié
              </span>
            )}
            {isUpcoming && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-lilac/20 text-lilac border border-lilac/40 font-semibold uppercase">
                À venir
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-lg mb-1">{b.invitee_name || 'Nom non renseigné'}</h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
            {b.invitee_email && (
              <a href={`mailto:${b.invitee_email}`} className="inline-flex items-center gap-1.5 hover:text-lilac">
                <Mail size={13} /> {b.invitee_email}
              </a>
            )}
            {b.invitee_phone && (
              <a href={`tel:${b.invitee_phone}`} className="inline-flex items-center gap-1.5 hover:text-lilac">
                <Phone size={13} /> {b.invitee_phone}
              </a>
            )}
            {b.closer && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-white/40">Closer :</span> <strong className="text-white/90">{b.closer}</strong>
              </span>
            )}
          </div>

          {(b.utm_source || b.utm_campaign || b.utm_medium) && (
            <div className="mt-2 text-xs text-white/50 inline-flex flex-wrap gap-x-3 gap-y-0.5">
              {b.utm_source   && <span>🌐 source : <strong className="text-white/80">{b.utm_source}</strong></span>}
              {b.utm_medium   && <span>· medium : <strong className="text-white/80">{b.utm_medium}</strong></span>}
              {b.utm_campaign && <span>· campagne : <strong className="text-white/80">{b.utm_campaign}</strong></span>}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {b.meeting_url && (
              <a href={b.meeting_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lilac/15 border border-lilac/30 text-lilac hover:bg-lilac/25 transition-colors">
                <ExternalLink size={12} /> Lien réunion
              </a>
            )}
            {b.invitee_email && (
              <a href={`mailto:${b.invitee_email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-lilac/30 transition-colors">
                <Mail size={12} /> Envoyer un mail
              </a>
            )}
            <span className="text-white/40 inline-flex items-center gap-1 ml-auto">
              <Clock size={11} /> reçu {new Date(b.received_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ totalBookings, filter }: { totalBookings: number; filter: FilterKey }) {
  if (totalBookings === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-lilac/30 bg-lilac/5 p-10 text-center">
        <CalendarCheck className="text-lilac mx-auto mb-3" size={32} />
        <h3 className="font-display font-bold text-xl mb-2">Aucun RDV pour l'instant</h3>
        <p className="text-sm text-white/60 max-w-md mx-auto mb-4">
          Dès qu'un prospect réserve un appel via iClosed, il apparaîtra ici en temps réel et tu
          recevras un email à <strong>omniscale1@gmail.com</strong>.
        </p>
        <p className="text-xs text-white/40">
          Vérifie que le webhook iClosed pointe vers <code className="text-lilac">https://omniscale.fr/api/webhooks/iclosed</code>.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/50 text-sm">
      Aucun RDV ne correspond au filtre « {filter} ».
    </div>
  );
}
