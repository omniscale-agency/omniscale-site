'use client';
import { useEffect, useState } from 'react';
import {
  Eye, Users, TrendingUp, Heart, Sparkles, Calendar, CheckSquare,
  Video as VideoIcon, Target, Clock, Activity, ArrowUpRight,
} from 'lucide-react';
import { getSession, Session } from '@/lib/auth';
import { CLIENTS, ClientData, formatNumber, formatCurrency, getClientBySlug } from '@/lib/mockData';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';

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

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    setSession(s);
    const c = s.clientSlug ? getClientBySlug(s.clientSlug) : CLIENTS[0];
    setClient(c || CLIENTS[0]);
  }, []);

  if (!session || !client) {
    return <div className="p-12 text-white/60">Chargement…</div>;
  }

  const { stats } = client;
  const totalFollowers = stats.instagramFollowers + stats.tiktokFollowers;
  const totalFollowersGained = stats.instagramFollowersGained + stats.tiktokFollowersGained;
  const roas = stats.adRevenue / stats.adSpend;
  const todosOpen = client.todos.filter((t) => !t.done);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-lilac mb-2">Espace client · {client.brand}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Salut <span className="text-gradient">{session.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-white/60 mt-2">
            Voici un récap de tes performances sur les <strong className="text-white">30 derniers jours</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
            ● {client.status === 'actif' ? 'Compte actif' : client.status}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
            Closer : {client.closer}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Vues 30j"
          value={formatNumber(stats.instagramViews + stats.tiktokViews)}
          delta={42}
          icon={Eye}
          accent="lilac"
        />
        <StatCard
          label="Abonnés gagnés"
          value={`+${formatNumber(totalFollowersGained)}`}
          delta={18}
          icon={Users}
          accent="green"
        />
        <StatCard
          label="ROAS Meta"
          value={`x${roas.toFixed(1)}`}
          delta={12}
          icon={TrendingUp}
          accent="amber"
        />
        <StatCard
          label="Engagement"
          value={`${stats.engagementRate}%`}
          delta={3}
          icon={Heart}
          accent="pink"
        />
      </div>

      {/* Plateformes détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-orange-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">Instagram</div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-500 flex items-center justify-center text-xs font-bold">IG</div>
          </div>
          <div className="font-display text-2xl font-bold mb-1">{formatNumber(stats.instagramViews)} vues</div>
          <div className="text-sm text-white/60">{formatNumber(stats.instagramFollowers)} abonnés <span className="text-green-400">+{formatNumber(stats.instagramFollowersGained)}</span></div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-pink-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">TikTok</div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-xs font-bold">TT</div>
          </div>
          <div className="font-display text-2xl font-bold mb-1">{formatNumber(stats.tiktokViews)} vues</div>
          <div className="text-sm text-white/60">{formatNumber(stats.tiktokFollowers)} abonnés <span className="text-green-400">+{formatNumber(stats.tiktokFollowersGained)}</span></div>
        </div>

        <div className="rounded-2xl border border-lilac/20 bg-lilac/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">Pub Meta</div>
            <Sparkles className="text-lilac" size={18} />
          </div>
          <div className="font-display text-2xl font-bold mb-1">{formatCurrency(stats.adRevenue)}</div>
          <div className="text-sm text-white/60">généré sur {formatCurrency(stats.adSpend)} dépensés</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Objectifs */}
        <Card title="Objectifs en cours" icon={Target} className="lg:col-span-2">
          <div className="space-y-5">
            {client.objectives.map((o) => {
              const pct = Math.min(100, Math.round((o.current / o.target) * 100));
              return (
                <div key={o.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-white/80">{o.label}</span>
                    <span className="font-mono text-white/60">
                      {o.unit === '€' ? formatCurrency(o.current) : `${o.current}${o.unit}`}
                      <span className="text-white/30"> / {o.unit === '€' ? formatCurrency(o.target) : `${o.target}${o.unit}`}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lilac to-omni-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/40 mt-1">{pct}% atteint</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tâches */}
        <Card
          title="Tâches en cours"
          icon={CheckSquare}
          subtitle={`${todosOpen.length} en attente`}
          action={
            <a href="/dashboard/todos" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">
              Tout voir <ArrowUpRight size={12} />
            </a>
          }
        >
          <ul className="space-y-3">
            {todosOpen.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <div className="w-4 h-4 rounded border border-white/30 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{t.title}</div>
                  {t.dueDate && (
                    <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {t.priority === 'high' && <span className="ml-1 text-red-400">●</span>}
                    </div>
                  )}
                </div>
              </li>
            ))}
            {todosOpen.length === 0 && (
              <li className="text-sm text-white/50 italic">Aucune tâche en attente 🎉</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Activity + Calendar */}
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

        <Card
          title="Prochains RDV"
          icon={Calendar}
          subtitle="Synchro Google Calendar"
          action={
            <a href="/dashboard/calendar" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">
              Agenda <ArrowUpRight size={12} />
            </a>
          }
        >
          <ul className="space-y-3">
            {client.upcomingEvents.slice(0, 3).map((e) => {
              const d = eventDate(e.startsAt);
              return (
                <li key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-center w-12 shrink-0 rounded-lg bg-lilac/10 border border-lilac/30 py-1.5">
                    <div className="font-display font-bold text-lg leading-none text-lilac">{d.day}</div>
                    <div className="text-[10px] uppercase text-white/60">{d.mon}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{d.time} · {e.duration} min</div>
                    <div className="text-xs text-white/40">avec {e.with}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Vidéos publiées */}
      <Card
        title="Vidéos récentes"
        icon={VideoIcon}
        subtitle={`${client.videos.length} publiées sur les 30 derniers jours`}
        action={
          <a href="/dashboard/videos" className="text-xs text-lilac hover:underline inline-flex items-center gap-1">
            Tout voir <ArrowUpRight size={12} />
          </a>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {client.videos.slice(0, 6).map((v) => (
            <div key={v.id} className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-white/10">
              <div className={`absolute inset-0 bg-gradient-to-br ${PLATFORM_COLORS[v.platform]} opacity-30`} />
              <div className="absolute inset-0 placeholder-shimmer opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />
              <div className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/50 backdrop-blur">
                {v.platform}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="text-[11px] font-medium leading-tight line-clamp-2 mb-1">{v.title}</div>
                <div className="text-[10px] text-white/70 flex items-center gap-1.5">
                  <Eye size={10} /> {formatNumber(v.views)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
