'use client';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Eye, Users, TrendingUp, DollarSign, Target,
  CheckSquare, Square, Calendar, Activity, Building2, MapPin,
  Mail, Phone, Sparkles,
} from 'lucide-react';
import { getClientBySlug, ClientData, formatNumber, formatCurrency } from '@/lib/mockData';
import { getExtraTodos, getExtraEvents, subscribe } from '@/lib/sharedStore';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';
import SendActionsBar from '@/components/admin/SendActionsBar';

export default function ClientDetailView({ slug }: { slug: string }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [extras, setExtras] = useState({ todos: [] as ClientData['todos'], events: [] as ClientData['upcomingEvents'] });

  useEffect(() => {
    setClient(getClientBySlug(slug) || null);
  }, [slug]);

  useEffect(() => {
    const refresh = () => setExtras({ todos: getExtraTodos(slug), events: getExtraEvents(slug) });
    refresh();
    return subscribe(refresh);
  }, [slug]);

  if (!client) {
    return (
      <main className="p-12 text-white/60">
        Client introuvable. <a href="/admin/clients" className="text-lilac hover:underline">Retour à la liste</a>
      </main>
    );
  }

  const views = client.stats.instagramViews + client.stats.tiktokViews;
  const roas = client.stats.adRevenue / Math.max(1, client.stats.adSpend);
  const totalFollowers = client.stats.instagramFollowers + client.stats.tiktokFollowers;

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <a href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-lilac mb-6">
        <ArrowLeft size={14} /> Tous les clients
      </a>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-lilac/20 border border-lilac/30 flex items-center justify-center font-display font-bold text-2xl text-lilac">
            {client.brand.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-lilac mb-1">Fiche client</div>
            <h1 className="font-display text-4xl font-bold tracking-tight">{client.brand}</h1>
            <div className="text-white/60 mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> {client.sector}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {client.city}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                client.status === 'actif'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>● {client.status}</span>
            </div>
          </div>
        </div>
        <SendActionsBar slug={client.slug} brand={client.brand} />
      </div>

      {/* Contact */}
      <Card title="Contact" icon={Users} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Référent</div>
            <div className="font-medium">{client.contact.name}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Email</div>
            <a href={`mailto:${client.contact.email}`} className="font-medium text-lilac hover:underline inline-flex items-center gap-1.5">
              <Mail size={13} /> {client.contact.email}
            </a>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Téléphone</div>
            <a href={`tel:${client.contact.phone.replace(/\s/g, '')}`} className="font-medium text-lilac hover:underline inline-flex items-center gap-1.5">
              <Phone size={13} /> {client.contact.phone}
            </a>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Closer</div>
            <div className="font-medium">{client.closer}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">CA mensuel</div>
            <div className="font-medium">{client.monthlyRevenue}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Client depuis</div>
            <div className="font-medium">{new Date(client.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Vues 30j" value={formatNumber(views)} delta={42} icon={Eye} accent="lilac" />
        <StatCard label="Abonnés totaux" value={formatNumber(totalFollowers)} delta={18} icon={Users} accent="green" />
        <StatCard label="ROAS Meta" value={`x${roas.toFixed(1)}`} delta={12} icon={TrendingUp} accent="amber" />
        <StatCard label="CA pub 30j" value={formatCurrency(client.stats.adRevenue)} delta={28} icon={DollarSign} accent="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Objectifs */}
        <Card title="Objectifs" icon={Target}>
          <div className="space-y-4">
            {client.objectives.map((o) => {
              const pct = Math.min(100, Math.round((o.current / o.target) * 100));
              return (
                <div key={o.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-white/80">{o.label}</span>
                    <span className="font-mono text-white/60">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-lilac to-omni-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tâches */}
        <Card title="Tâches" icon={CheckSquare} subtitle={`${[...extras.todos, ...client.todos].filter(t => !t.done).length} ouvertes`}>
          <ul className="space-y-2.5 max-h-72 overflow-y-auto">
            {[...extras.todos, ...client.todos].map((t) => (
              <li key={t.id} className="flex items-start gap-3 text-sm">
                {t.done ? <CheckSquare className="text-lilac mt-0.5 shrink-0" size={16} /> : <Square className="text-white/40 mt-0.5 shrink-0" size={16} />}
                <div className={`flex-1 ${t.done ? 'line-through text-white/40' : ''}`}>
                  {t.id.startsWith('admin-') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-lilac/20 text-lilac uppercase font-semibold mr-1.5">Envoyée</span>
                  )}
                  {t.title}
                  {t.assignee && <span className="text-xs text-white/40 ml-2">· {t.assignee}</span>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Activité + Calendrier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Activité récente" icon={Activity}>
          <ol className="relative space-y-4 ml-3 border-l border-white/10 pl-5">
            {client.activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[1.7rem] top-1 w-3 h-3 rounded-full bg-lilac ring-4 ring-black" />
                <div className="text-sm">{a.label}</div>
                <div className="text-xs text-white/40 mt-0.5">
                  {new Date(a.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Prochains RDV" icon={Calendar}>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {[...extras.events, ...client.upcomingEvents].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).map((e) => {
              const d = new Date(e.startsAt);
              return (
                <li key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div className="text-center w-12 shrink-0 rounded-lg bg-lilac/10 border border-lilac/30 py-1.5">
                    <div className="font-display font-bold text-lg leading-none text-lilac">{d.toLocaleDateString('fr-FR', { day: '2-digit' })}</div>
                    <div className="text-[10px] uppercase text-white/60">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {e.id.startsWith('admin-') && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-lilac/20 text-lilac uppercase font-semibold">Envoyé</span>
                      )}
                      <span>{e.title}</span>
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">
                      {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {e.duration} min
                    </div>
                    <div className="text-xs text-white/40">avec {e.with}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Vidéos */}
      <Card title="Vidéos publiées (30j)" icon={Sparkles}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-white/40">
              <tr className="border-b border-white/5">
                <th className="text-left p-3 font-normal">Titre</th>
                <th className="text-left p-3 font-normal">Plateforme</th>
                <th className="text-left p-3 font-normal">Date</th>
                <th className="text-right p-3 font-normal">Vues</th>
                <th className="text-right p-3 font-normal">Likes</th>
                <th className="text-right p-3 font-normal">Comm.</th>
                <th className="text-right p-3 font-normal">Partages</th>
              </tr>
            </thead>
            <tbody>
              {client.videos.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3 font-medium">{v.title}</td>
                  <td className="p-3 text-white/70 capitalize">{v.platform}</td>
                  <td className="p-3 text-white/60">{new Date(v.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(v.views)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(v.likes)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(v.comments)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(v.shares)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
