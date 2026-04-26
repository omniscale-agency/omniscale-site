'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Eye, Users, TrendingUp, Heart, Sparkles, Calendar, CheckSquare,
  Video as VideoIcon, Target, Clock, Activity, ArrowUpRight, BadgePlus,
} from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import RoleGate from '@/components/RoleGate';
import { CLIENTS, ClientData, formatNumber, formatCurrency, getClientBySlug } from '@/lib/mockData';
import { generateSeries, generateWithCompare, RangeKey, sumSeries, deltaPct, compareDelta } from '@/lib/timeseries';
import { fetchTodos, fetchEvents, subscribeClientChanges, Todo, Event } from '@/lib/sharedStore';
import { fetchObjectives, subscribeObjectives, Objective } from '@/lib/objectivesStore';
import {
  fetchMetrics, subscribeMetrics, ClientMetric, latestByMetric, trendForMetric,
} from '@/lib/metricsStore';
import { fetchRealSocialData, RealSocialData } from '@/lib/socialReal';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';
import RangePicker from '@/components/dashboard/RangePicker';
import AreaChartCard from '@/components/dashboard/AreaChartCard';
import StackedAreaChartCard from '@/components/dashboard/StackedAreaChartCard';
import MonthlyMetricsCard from '@/components/dashboard/MonthlyMetricsCard';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d} j`;
  if (d < 30) return `il y a ${Math.floor(d / 7)} sem`;
  return `il y a ${Math.floor(d / 30)} mois`;
}

function eventDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('fr-FR', { day: '2-digit' }),
    mon: d.toLocaleDateString('fr-FR', { month: 'short' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-fuchsia-500 to-orange-500',
  tiktok: 'from-cyan-400 to-pink-500',
  youtube: 'from-red-600 to-red-800',
};

export default function ClientDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [range, setRange] = useState<Exclude<RangeKey, 'custom'>>('30d');
  const [compare, setCompare] = useState(false);
  const [extraTodos, setExtraTodos] = useState<Todo[]>([]);
  const [extraEvents, setExtraEvents] = useState<Event[]>([]);
  const [dbObjectives, setDbObjectives] = useState<Objective[]>([]);
  const [dbMetrics, setDbMetrics] = useState<ClientMetric[]>([]);
  const [real, setReal] = useState<RealSocialData>({ connections: {}, videos: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSessionAsync().then(async (s) => {
      if (!s) return;
      setSession(s);
      // Si l'admin a mappé l'utilisateur à un dossier mockData → on charge les données démo
      // Sinon → on reste sans `client` et on affiche l'état "onboarding"
      const c = s.clientSlug ? getClientBySlug(s.clientSlug) : null;
      setClient(c || null);
      // Charge les vraies données sociales en parallèle
      const realData = await fetchRealSocialData();
      setReal(realData);
      setLoaded(true);
    });
  }, []);

  // slug pour l'agrégation des extras : soit clientSlug DB, soit user-id (compte sans mockData mappé)
  const extrasSlug = session?.clientSlug || (session?.userId ? `user-${session.userId}` : '');

  useEffect(() => {
    if (!extrasSlug) return;
    const refresh = async () => {
      const [t, e, o, m] = await Promise.all([
        fetchTodos(extrasSlug),
        fetchEvents(extrasSlug),
        fetchObjectives(extrasSlug),
        fetchMetrics(extrasSlug),
      ]);
      setExtraTodos(t);
      setExtraEvents(e);
      setDbObjectives(o);
      setDbMetrics(m);
    };
    refresh();
    const offChanges = subscribeClientChanges(extrasSlug, refresh);
    const offObj = subscribeObjectives(extrasSlug, refresh);
    const offMetrics = subscribeMetrics(extrasSlug, refresh);
    return () => { offChanges(); offObj(); offMetrics(); };
  }, [extrasSlug]);

  const series = useMemo(() => {
    if (!client) return [];
    return compare ? generateWithCompare(client.slug, range) : generateSeries(client.slug, range);
  }, [client, range, compare]);

  if (!loaded || !session) {
    return <div className="p-12 text-white/60">Chargement…</div>;
  }

  if (session.role === 'lead') {
    return (
      <RoleGate userRole={session.role} allowed={['client', 'admin']} feature="Tableau de bord performance">
        <></>
      </RoleGate>
    );
  }

  // Client sans dossier mockData mappé → affichage "onboarding"
  if (session.role === 'client' && !client) {
    return (
      <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Espace client · {session.brand || 'Mon entreprise'}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Bienvenue <span className="text-gradient">{session.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-white/60 mt-3 max-w-2xl">
            Ton compte est actif. L'équipe Omniscale prépare ton espace personnalisé. En attendant, voici ce que tu peux faire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a href="/dashboard/connections" className="rounded-2xl border border-white/10 bg-white/[0.02] hover:border-lilac/40 transition-colors p-6 group">
            <div className="w-12 h-12 rounded-xl bg-lilac/15 border border-lilac/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="text-lilac" size={20} />
            </div>
            <div className="font-display font-bold text-lg mb-1">Connecte tes réseaux</div>
            <p className="text-sm text-white/60">Insta, TikTok, YouTube — pour qu'on importe tes vraies stats et vidéos.</p>
          </a>
          <a href="/dashboard/settings" className="rounded-2xl border border-white/10 bg-white/[0.02] hover:border-lilac/40 transition-colors p-6 group">
            <div className="w-12 h-12 rounded-xl bg-lilac/15 border border-lilac/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="text-lilac" size={20} />
            </div>
            <div className="font-display font-bold text-lg mb-1">Complète tes infos</div>
            <p className="text-sm text-white/60">Secteur, ville, CA actuel — plus c'est précis, mieux on accompagne.</p>
          </a>
        </div>

        {/* KPIs réels saisis par l'admin (si présents) */}
        {dbMetrics.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Chiffres réels mis à jour par ton account manager
            </div>
            <MonthlyMetricsCard metrics={dbMetrics} />
          </div>
        )}

        {/* Tâches/RDV envoyés par admin (les extras) */}
        {(extraTodos.length > 0 || extraEvents.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {extraTodos.length > 0 && (
              <Card title="Tâches envoyées par Omniscale" icon={CheckSquare}>
                <ul className="space-y-3">
                  {extraTodos.filter(t => !t.done).map((t) => (
                    <li key={t.id} className="text-sm">• {t.title}</li>
                  ))}
                </ul>
              </Card>
            )}
            {extraEvents.length > 0 && (
              <Card title="Prochains RDV" icon={Calendar}>
                <ul className="space-y-3">
                  {extraEvents.map((e) => (
                    <li key={e.id} className="text-sm">
                      <strong>{e.title}</strong>
                      <div className="text-xs text-white/50">{new Date(e.startsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-dashed border-lilac/20 bg-lilac/5 p-6 text-sm text-white/70 text-center">
          <Sparkles className="text-lilac mx-auto mb-2" size={20} />
          Ton dashboard de performance complet (stats sociales, ROAS, vidéos publiées) sera activé une fois tes comptes sociaux connectés et le suivi configuré par notre équipe.
        </div>
      </main>
    );
  }

  // Si on arrive ici sans client (cas edge), bail.
  if (!client) return <div className="p-12 text-white/60">Chargement…</div>;

  const allTodos = [...extraTodos, ...client.todos];
  const allEvents = [...extraEvents, ...client.upcomingEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const todosOpen = allTodos.filter((t) => !t.done);

  const seedTotalViews = sumSeries(series, 'views');
  const seedViewsDelta = deltaPct(series, 'views');
  const seedAdRevenue = sumSeries(series, 'adRevenue');
  const seedAdSpend = sumSeries(series, 'adSpend');
  const seedRoas = seedAdSpend > 0 ? seedAdRevenue / seedAdSpend : 0;

  // === KPIs RÉELS (saisis par admin) > priorité sur les seed-mock ===
  const latestMetrics = latestByMetric(dbMetrics);
  const viewsTrend = trendForMetric(dbMetrics, 'views');
  const followersGainedTrend = trendForMetric(dbMetrics, 'followers_gained');
  const roasTrend = trendForMetric(dbMetrics, 'roas');
  const engagementTrend = trendForMetric(dbMetrics, 'engagement_rate');

  const totalViews = latestMetrics['views']?.value ?? seedTotalViews;
  const viewsDelta = viewsTrend.deltaPct ?? seedViewsDelta;
  const adRevenue = latestMetrics['ad_revenue']?.value ?? seedAdRevenue;
  const adSpend = latestMetrics['ad_spend']?.value ?? seedAdSpend;
  const roas = latestMetrics['roas']?.value ?? (adSpend > 0 ? adRevenue / adSpend : seedRoas);
  const engagementRate = latestMetrics['engagement_rate']?.value ?? client.stats.engagementRate;
  const followersGained = latestMetrics['followers_gained']?.value
    ?? (client.stats.instagramFollowersGained + client.stats.tiktokFollowersGained);

  // Badge "live" si on a au moins une métrique réelle
  const hasRealMetrics = dbMetrics.length > 0;

  const isFromDB = (id: string) => !id.match(/^t\d+$|^e\d+$/); // les IDs de mockData sont t1, e1...

  // === Données sociales réelles (override les mocks pour les plateformes connectées) ===
  const igReal = real.connections.instagram;
  const ttReal = real.connections.tiktok;
  const ytReal = real.connections.youtube;
  const igFollowers = igReal?.followers ?? client.stats.instagramFollowers;
  const igViews = igReal?.metrics?.totalViews ?? client.stats.instagramViews;
  const ttFollowers = ttReal?.followers ?? client.stats.tiktokFollowers;
  const ttViews = ttReal?.metrics?.totalViews ?? client.stats.tiktokViews;
  const realVideos = real.videos; // Si non-vide, override les vidéos mock

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Espace client · {session.brand || client.brand}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Salut <span className="text-gradient">{session.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-white/60 mt-2">Récap de tes performances — sélectionne la période ci-dessous.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker value={range} onChange={setRange} compare={compare} onCompareToggle={setCompare} />
          <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">● Compte actif</span>
        </div>
      </div>

      {hasRealMetrics && (
        <div className="mb-4 inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Chiffres réels mis à jour par ton account manager
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Vues" value={formatNumber(totalViews)} delta={viewsDelta} icon={Eye} accent="lilac" />
        <StatCard label="Abonnés gagnés" value={`+${formatNumber(Math.round(followersGained))}`} delta={followersGainedTrend.deltaPct ?? 18} icon={Users} accent="green" />
        <StatCard label="ROAS Meta" value={`x${roas.toFixed(1)}`} delta={roasTrend.deltaPct ?? deltaPct(series, 'adRevenue')} icon={TrendingUp} accent="amber" />
        <StatCard label="Engagement moyen" value={`${engagementRate}%`} delta={engagementTrend.deltaPct ?? 3} icon={Heart} accent="pink" />
      </div>

      {hasRealMetrics && (
        <div className="mb-8">
          <MonthlyMetricsCard metrics={dbMetrics} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AreaChartCard
          title="Vues totales" icon={Eye} data={series}
          series={[{ key: 'views', label: 'Vues', color: '#B794E8' }]}
          compareKey={compare ? 'prevViews' : undefined}
          total={formatNumber(totalViews)}
          delta={compare ? compareDelta(series, 'views', 'prevViews') : viewsDelta}
        />
        <StackedAreaChartCard
          title="Abonnés par plateforme" icon={Users} data={series}
          series={[
            { key: 'followersTiktok', label: 'TikTok', color: '#22d3ee' },
            { key: 'followersInstagram', label: 'Instagram', color: '#ec4899' },
            { key: 'followersYoutube', label: 'YouTube', color: '#ef4444' },
          ]}
          total={formatNumber(series[series.length - 1]?.followers || 0)}
          delta={deltaPct(series, 'followers')}
        />
        <AreaChartCard
          title="Performance pub Meta" icon={Sparkles} data={series}
          series={[
            { key: 'adRevenue', label: 'CA généré', color: '#fbbf24' },
            { key: 'adSpend', label: 'Dépensé', color: '#f87171' },
          ]}
          compareKey={compare ? 'prevAdRevenue' : undefined}
          compareLabel="CA période précédente"
          total={formatCurrency(adRevenue)}
          delta={compare ? compareDelta(series, 'adRevenue', 'prevAdRevenue') : deltaPct(series, 'adRevenue')}
          formatY={(v) => formatCurrency(v).replace('€', '€')}
        />
        <AreaChartCard
          title="Taux d'engagement" icon={Heart} data={series}
          series={[{ key: 'engagement', label: 'Engagement', color: '#ec4899' }]}
          compareKey={compare ? 'prevEngagement' : undefined}
          total={`${client.stats.engagementRate}%`} delta={3}
          formatY={(v) => `${v}%`}
        />
      </div>

      <div className={`grid grid-cols-1 ${ytReal ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-10`}>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-orange-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-white/60 font-semibold inline-flex items-center gap-1.5">Instagram {igReal && <LiveBadge />}</div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-500 flex items-center justify-center text-xs font-bold">IG</div>
          </div>
          <div className="font-display text-2xl font-bold mb-1">{formatNumber(igViews)} vues</div>
          <div className="text-sm text-white/60">
            {formatNumber(igFollowers)} abonnés
            {!igReal && <span className="text-green-400"> +{formatNumber(client.stats.instagramFollowersGained)}</span>}
            {igReal && <span className="text-white/40"> · @{igReal.username}</span>}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-pink-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-white/60 font-semibold inline-flex items-center gap-1.5">TikTok {ttReal && <LiveBadge />}</div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-xs font-bold">TT</div>
          </div>
          <div className="font-display text-2xl font-bold mb-1">{formatNumber(ttViews)} vues</div>
          <div className="text-sm text-white/60">
            {formatNumber(ttFollowers)} abonnés
            {!ttReal && <span className="text-green-400"> +{formatNumber(client.stats.tiktokFollowersGained)}</span>}
            {ttReal && <span className="text-white/40"> · @{ttReal.username}</span>}
          </div>
        </div>
        {ytReal && (
          <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-600/10 to-red-800/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-widest text-white/60 font-semibold inline-flex items-center gap-1.5">YouTube <LiveBadge /></div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xs font-bold">YT</div>
            </div>
            <div className="font-display text-2xl font-bold mb-1">{formatNumber(ytReal.metrics?.totalViews || 0)} vues</div>
            <div className="text-sm text-white/60">
              {formatNumber(ytReal.followers)} abonnés
              <span className="text-white/40"> · {ytReal.username}</span>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-lilac/20 bg-lilac/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">Pub Meta</div>
            <Sparkles className="text-lilac" size={18} />
          </div>
          <div className="font-display text-2xl font-bold mb-1">{formatCurrency(adRevenue)}</div>
          <div className="text-sm text-white/60">généré sur {formatCurrency(adSpend)} dépensés</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card title="Objectifs en cours" icon={Target} className="lg:col-span-2"
          action={<a href="/dashboard/objectives" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">Tout voir <ArrowUpRight size={12} /></a>}>
          {(() => {
            const objsToShow = dbObjectives.length > 0
              ? dbObjectives.map((o) => ({ key: o.id, label: o.label, current: o.current, target: o.target, unit: o.unit }))
              : client.objectives.map((o, i) => ({ key: `mock-${i}`, ...o }));
            if (objsToShow.length === 0) {
              return (
                <div className="text-sm text-white/50 italic py-4">
                  Pas encore d'objectifs définis. Ton account manager les fixera à ton onboarding.
                </div>
              );
            }
            return (
              <div className="space-y-5">
                {objsToShow.map((o) => {
                  const pct = Math.min(100, Math.round((o.current / Math.max(1, o.target)) * 100));
                  const fmt = (n: number) => o.unit === '€' ? formatCurrency(n) : `${n}${o.unit ? ' ' + o.unit : ''}`;
                  return (
                    <div key={o.key}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="text-white/80">{o.label}</span>
                        <span className="font-mono text-white/60">
                          {fmt(o.current)}
                          <span className="text-white/30"> / {fmt(o.target)}</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-lilac to-omni-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-white/40 mt-1">{pct}% atteint</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        <Card title="Tâches en cours" icon={CheckSquare} subtitle={`${todosOpen.length} en attente`}
          action={<a href="/dashboard/todos" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">Tout voir <ArrowUpRight size={12} /></a>}>
          <ul className="space-y-3">
            {todosOpen.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <div className="w-4 h-4 rounded border border-white/30 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-start gap-2">
                    {isFromDB(t.id) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-lilac/20 text-lilac font-semibold uppercase shrink-0 mt-0.5">
                        <BadgePlus size={10} className="inline mr-0.5" /> Nouveau
                      </span>
                    )}
                    <span>{t.title}</span>
                  </div>
                  {t.dueDate && (
                    <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {t.priority === 'high' && <span className="ml-1 text-red-400">●</span>}
                    </div>
                  )}
                </div>
              </li>
            ))}
            {todosOpen.length === 0 && <li className="text-sm text-white/50 italic">Aucune tâche en attente 🎉</li>}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card title="Activité récente" icon={Activity} className="lg:col-span-2">
          <ol className="relative space-y-5 ml-3 border-l border-white/10 pl-5">
            {client.activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[1.7rem] top-1 w-3 h-3 rounded-full bg-lilac ring-4 ring-black" />
                <div className="text-sm text-white/85">{a.label}</div>
                <div className="text-xs text-white/40 mt-0.5">{relativeTime(a.at)}</div>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Prochains RDV" icon={Calendar} subtitle="Synchro Google Calendar"
          action={<a href="/dashboard/calendar" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">Agenda <ArrowUpRight size={12} /></a>}>
          <ul className="space-y-3">
            {allEvents.slice(0, 4).map((e) => {
              const d = eventDate(e.startsAt);
              return (
                <li key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-center w-12 shrink-0 rounded-lg bg-lilac/10 border border-lilac/30 py-1.5">
                    <div className="font-display font-bold text-lg leading-none text-lilac">{d.day}</div>
                    <div className="text-[10px] uppercase text-white/60">{d.mon}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {isFromDB(e.id) && (<span className="text-[9px] px-1 py-0.5 rounded bg-lilac/20 text-lilac uppercase font-semibold">Nouveau</span>)}
                      <span>{e.title}</span>
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">{d.time} · {e.duration} min</div>
                    <div className="text-xs text-white/40">avec {e.with}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card title="Vidéos récentes" icon={VideoIcon}
        subtitle={realVideos.length > 0 ? `${realVideos.length} importées (live API)` : `${client.videos.length} publiées sur les 30 derniers jours`}
        action={<a href="/dashboard/videos" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">Tout voir <ArrowUpRight size={12} /></a>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(realVideos.length > 0 ? realVideos.slice(0, 6).map(v => ({
              id: v.id, title: v.title, platform: v.platform, views: v.views, thumb: v.thumbnailUrl, link: v.permalink,
            })) : client.videos.slice(0, 6).map(v => ({
              id: v.id, title: v.title, platform: v.platform, views: v.views, thumb: undefined, link: undefined,
            }))
          ).map((v) => (
            <a
              key={v.id}
              href={v.link || '#'}
              target={v.link ? '_blank' : undefined}
              rel={v.link ? 'noopener noreferrer' : undefined}
              className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-white/10 block"
            >
              {v.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumb} alt={v.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${PLATFORM_COLORS[v.platform]} opacity-30`} />
                  <div className="absolute inset-0 placeholder-shimmer opacity-20" />
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />
              <div className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/50 backdrop-blur">{v.platform}</div>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="text-[11px] font-medium leading-tight line-clamp-2 mb-1">{v.title}</div>
                <div className="text-[10px] text-white/70 flex items-center gap-1.5"><Eye size={10} /> {formatNumber(v.views)}</div>
              </div>
            </a>
          ))}
        </div>
      </Card>
    </main>
  );
}

function LiveBadge() {
  return (
    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Live
    </span>
  );
}
