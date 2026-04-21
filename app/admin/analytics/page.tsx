'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, UserPlus, CalendarCheck, Users, TrendingUp, ArrowUpRight,
  Filter, RefreshCw, ExternalLink, Globe, Sparkles, ArrowDown,
} from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { supabaseBrowser } from '@/lib/supabase/client';
import RoleGate from '@/components/RoleGate';

type RangeKey = '24h' | '7d' | '30d' | '90d';
const RANGE_DAYS: Record<RangeKey, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
const RANGE_LABEL: Record<RangeKey, string> = { '24h': '24 heures', '7d': '7 jours', '30d': '30 jours', '90d': '90 jours' };

interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  event: string;
  properties: Record<string, any>;
  occurred_at: string;
}

interface Booking {
  id: string;
  external_id: string;
  event: string;
  invitee_name: string | null;
  invitee_email: string | null;
  scheduled_at: string | null;
  closer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  received_at: string;
  matched_user_id: string | null;
}

export default function AdminAnalyticsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [range, setRange] = useState<RangeKey>('7d');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { getSessionAsync().then((s) => setSession(s)); }, []);

  const loadData = async (r: RangeKey) => {
    const since = new Date(Date.now() - RANGE_DAYS[r] * 86400_000).toISOString();
    const sb = supabaseBrowser();
    const [evRes, bkRes] = await Promise.all([
      sb.from('analytics_events').select('*').gte('occurred_at', since).order('occurred_at', { ascending: false }).limit(5000),
      sb.from('bookings').select('*').gte('received_at', since).order('received_at', { ascending: false }).limit(500),
    ]);
    setEvents(evRes.data || []);
    setBookings(bkRes.data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (session) loadData(range); }, [session, range]);

  const handleRefresh = async () => { setRefreshing(true); await loadData(range); };

  const stats = useMemo(() => computeStats(events, bookings), [events, bookings]);

  if (!session) return <div className="p-12 text-white/60">Chargement…</div>;
  if (session.role !== 'admin') {
    return <RoleGate userRole={session.role} allowed={['admin']} feature="Analytics admin"><></></RoleGate>;
  }

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Admin · Analytics</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Performances <span className="text-gradient">site & funnel.</span>
          </h1>
          <p className="text-white/60 mt-2">Trafic, leads, bookings iClosed, sources, conversion.</p>
        </div>
        <div className="flex items-center gap-2">
          <RangePicker value={range} onChange={setRange} />
          <button onClick={handleRefresh} disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-lilac/30 text-sm transition-colors disabled:opacity-60">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-white/60">Chargement des stats…</div>
      ) : (
        <>
          {/* TOP KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={Eye} label="Pageviews" value={stats.pageviews.toLocaleString('fr-FR')} sub={`${stats.uniqueVisitors} visiteurs uniques`} accent="lilac" />
            <KpiCard icon={UserPlus} label="Signups" value={stats.signups.toLocaleString('fr-FR')} sub={`Conv. ${pct(stats.signups, stats.uniqueVisitors)}`} accent="green" />
            <KpiCard icon={CalendarCheck} label="Bookings iClosed" value={stats.bookingsScheduled.toLocaleString('fr-FR')} sub={`${stats.bookingsCompleted} effectués`} accent="amber" />
            <KpiCard icon={Users} label="Connexions sociales" value={stats.socialConnects.toLocaleString('fr-FR')} sub="OAuth réussies" accent="pink" />
          </div>

          {/* FUNNEL */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg inline-flex items-center gap-2">
                <Filter size={16} className="text-lilac" /> Funnel d'acquisition
              </h2>
              <span className="text-xs text-white/40">Sur {RANGE_LABEL[range]}</span>
            </div>
            <FunnelChart steps={[
              { label: 'Visiteurs uniques', value: stats.uniqueVisitors, color: '#B794E8' },
              { label: 'Signups', value: stats.signups, color: '#a78bfa' },
              { label: 'Bookings prog.', value: stats.bookingsScheduled, color: '#fbbf24' },
              { label: 'Bookings effectués', value: stats.bookingsCompleted, color: '#22d3ee' },
              { label: 'Comptes sociaux connectés', value: stats.uniqueSocialConnectors, color: '#34d399' },
            ]} />
          </div>

          {/* SOURCES + TOP PAGES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card title="Sources de trafic" icon={Globe}>
              <SourceTable rows={stats.topSources} />
            </Card>
            <Card title="Top pages" icon={Sparkles}>
              <SourceTable rows={stats.topPages} />
            </Card>
          </div>

          {/* RECENT BOOKINGS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg inline-flex items-center gap-2">
                <CalendarCheck size={16} className="text-lilac" /> Bookings récents (iClosed)
              </h2>
              <span className="text-xs text-white/40">{bookings.length} sur {RANGE_LABEL[range]}</span>
            </div>
            {bookings.length === 0 ? (
              <div className="py-10 text-center text-white/40 text-sm">
                Aucun booking encore. Configure le webhook iClosed pour qu'ils remontent ici en temps réel.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left pr-4">Lead</th>
                      <th className="text-left pr-4">Status</th>
                      <th className="text-left pr-4">Prog.</th>
                      <th className="text-left pr-4">Source</th>
                      <th className="text-left pr-4">Closer</th>
                      <th className="text-left pr-4">Lié</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 25).map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4 text-white/60 text-xs">{new Date(b.received_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="pr-4">
                          <div className="font-medium">{b.invitee_name || '—'}</div>
                          <div className="text-xs text-white/40">{b.invitee_email}</div>
                        </td>
                        <td className="pr-4"><BookingBadge event={b.event} /></td>
                        <td className="pr-4 text-white/60 text-xs">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="pr-4 text-xs">
                          {b.utm_source ? (
                            <div>
                              <div>{b.utm_source}</div>
                              {b.utm_campaign && <div className="text-white/40">{b.utm_campaign}</div>}
                            </div>
                          ) : <span className="text-white/30">direct</span>}
                        </td>
                        <td className="pr-4 text-xs text-white/60">{b.closer || '—'}</td>
                        <td className="pr-4">
                          {b.matched_user_id ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">✓ Compte</span> : <span className="text-white/30 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PostHog link */}
          <div className="rounded-2xl border border-dashed border-lilac/20 bg-lilac/5 p-6 text-sm text-white/70 text-center">
            <Sparkles className="text-lilac mx-auto mb-2" size={20} />
            Pour le drill-down complet (heatmaps, session replays, cohorts, A/B), va sur{' '}
            <a href="https://us.posthog.com" target="_blank" rel="noopener noreferrer" className="text-lilac hover:underline inline-flex items-center gap-1">
              PostHog Cloud <ExternalLink size={11} />
            </a>
            . Cette page sert de récap pour décisions rapides.
          </div>
        </>
      )}
    </main>
  );
}

// ============================================================
// Components
// ============================================================

function KpiCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub: string; accent: 'lilac' | 'green' | 'amber' | 'pink' }) {
  const colors: Record<string, string> = {
    lilac: 'from-lilac/20 to-lilac/5 border-lilac/30 text-lilac',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colors[accent]} p-5`}>
      <div className="flex items-start justify-between mb-2">
        <Icon size={20} />
      </div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-widest text-white/60 mt-1">{label}</div>
      <div className="text-xs text-white/50 mt-2">{sub}</div>
    </div>
  );
}

function FunnelChart({ steps }: { steps: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const fromPrev = i > 0 ? Math.round((s.value / Math.max(steps[i - 1].value, 1)) * 100) : 100;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-white/80">{s.label}</span>
              <span className="font-mono text-white/60">{s.value.toLocaleString('fr-FR')} <span className="text-white/30">· {fromPrev}%</span></span>
            </div>
            <div className="h-7 rounded-lg bg-white/5 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                className="h-full rounded-lg flex items-center px-3 text-xs font-semibold text-ink"
                style={{ backgroundColor: s.color }}>
                {pct}%
              </motion.div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center gap-2 text-xs text-white/30 mt-1.5 ml-1">
                <ArrowDown size={10} />
                <span>Drop : {s.value > 0 ? Math.round(((s.value - steps[i + 1].value) / s.value) * 100) : 0}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2"><Icon size={16} className="text-lilac" /> {title}</h2>
      {children}
    </div>
  );
}

function SourceTable({ rows }: { rows: Array<{ key: string; count: number; pct: number }> }) {
  if (rows.length === 0) return <div className="text-sm text-white/40 italic">Pas encore de données.</div>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white/80 truncate">{r.key}</span>
            <span className="font-mono text-white/60">{r.count} <span className="text-white/30">· {r.pct}%</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-lilac to-omni-400" style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RangePicker({ value, onChange }: { value: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {(Object.keys(RANGE_DAYS) as RangeKey[]).map((r) => (
        <button key={r} onClick={() => onChange(r)}
          className={`px-3 py-2 text-xs ${value === r ? 'bg-lilac text-ink font-semibold' : 'text-white/60 hover:bg-white/5'}`}>
          {r}
        </button>
      ))}
    </div>
  );
}

function BookingBadge({ event }: { event: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled: { label: 'Programmé', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    rescheduled: { label: 'Reprogrammé', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    cancelled: { label: 'Annulé', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    completed: { label: 'Effectué', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    no_show: { label: 'No-show', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  };
  const c = map[event] || { label: event, cls: 'bg-white/10 text-white/60 border-white/20' };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${c.cls}`}>{c.label}</span>;
}

// ============================================================
// Stats compute
// ============================================================

function pct(num: number, denom: number): string {
  if (denom === 0) return '—';
  return `${Math.round((num / denom) * 100)}%`;
}

function computeStats(events: AnalyticsEvent[], bookings: Booking[]) {
  const pageviewEvents = events.filter((e) => e.event === 'page_view' || e.event === '$pageview');
  const signupEvents = events.filter((e) => e.event === 'lead_signup');
  const socialConnectEvents = events.filter((e) => e.event === 'social_connected');

  // Visiteurs uniques = distinct anonymous_id OU user_id sur les pageviews
  const visitorIds = new Set<string>();
  pageviewEvents.forEach((e) => {
    const id = e.user_id || e.anonymous_id;
    if (id) visitorIds.add(id);
  });

  // Sources
  const sourceCounts = new Map<string, number>();
  pageviewEvents.forEach((e) => {
    const src = e.properties.utm_source || extractRefSource(e.properties.referrer) || 'direct';
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
  });
  const topSources = topNRanked(sourceCounts, 8);

  // Top pages
  const pageCounts = new Map<string, number>();
  pageviewEvents.forEach((e) => {
    const p = e.properties.path || e.properties.url || '/';
    pageCounts.set(p, (pageCounts.get(p) || 0) + 1);
  });
  const topPages = topNRanked(pageCounts, 8);

  // Bookings counts par event
  const bookingsScheduled = bookings.filter((b) => b.event === 'scheduled' || b.event === 'rescheduled').length;
  const bookingsCompleted = bookings.filter((b) => b.event === 'completed').length;

  // Comptes uniques ayant connecté >=1 plateforme
  const uniqueSocialConnectors = new Set(socialConnectEvents.map((e) => e.user_id).filter(Boolean)).size;

  return {
    pageviews: pageviewEvents.length,
    uniqueVisitors: visitorIds.size,
    signups: signupEvents.length,
    bookingsScheduled,
    bookingsCompleted,
    socialConnects: socialConnectEvents.length,
    uniqueSocialConnectors,
    topSources,
    topPages,
  };
}

function topNRanked(map: Map<string, number>, n: number): Array<{ key: string; count: number; pct: number }> {
  const total = Array.from(map.values()).reduce((s, c) => s + c, 0);
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count, pct: total ? Math.round((count / total) * 100) : 0 }));
}

function extractRefSource(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const u = new URL(referrer);
    const host = u.hostname.replace(/^www\./, '');
    if (host.includes('google')) return 'google';
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('linkedin')) return 'linkedin';
    if (host.includes('twitter') || host.includes('x.com') || host.includes('t.co')) return 'twitter';
    if (host.includes('youtube')) return 'youtube';
    if (host.includes('reddit')) return 'reddit';
    return host;
  } catch {
    return null;
  }
}
