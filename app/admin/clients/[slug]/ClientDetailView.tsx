'use client';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Eye, Users, TrendingUp, DollarSign,
  Calendar, Activity, Building2, MapPin,
  Mail, Phone, Sparkles, Globe,
} from 'lucide-react';
import { findAdminClient, AdminClientRow } from '@/lib/adminClients';
import { ClientData, formatNumber, formatCurrency } from '@/lib/mockData';
import { fetchTodos, fetchEvents, subscribeClientChanges, Todo, Event } from '@/lib/sharedStore';
import StatCard from '@/components/dashboard/StatCard';
import Card from '@/components/dashboard/Card';
import SendActionsBar from '@/components/admin/SendActionsBar';
import ObjectivesEditor from '@/components/admin/ObjectivesEditor';
import ClientTodosCard from '@/components/admin/ClientTodosCard';
import ClientEventsCard from '@/components/admin/ClientEventsCard';

export default function ClientDetailView({ slug }: { slug: string }) {
  const [row, setRow] = useState<AdminClientRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [extras, setExtras] = useState<{ todos: Todo[]; events: Event[] }>({ todos: [], events: [] });

  useEffect(() => {
    findAdminClient(slug).then((r) => {
      setRow(r);
      setLoaded(true);
    });
  }, [slug]);

  // Pour les extras (tâches/RDV), on utilise client_slug s'il existe (pour bind avec le dashboard client),
  // sinon le user_id préfixé "user-" (cohérent avec dashboard/page.tsx)
  const extrasSlug = row?.profile?.userId
    ? (row.mockData?.slug || `user-${row.profile.userId}`)
    : row?.mockData?.slug || slug;

  useEffect(() => {
    if (!extrasSlug || !loaded) return;
    const refresh = async () => {
      const [todos, events] = await Promise.all([fetchTodos(extrasSlug), fetchEvents(extrasSlug)]);
      setExtras({ todos, events });
    };
    refresh();
    return subscribeClientChanges(extrasSlug, refresh);
  }, [extrasSlug, loaded]);

  if (!loaded) {
    return <main className="p-12 text-white/60">Chargement…</main>;
  }

  if (!row) {
    return (
      <main className="p-12 text-white/60">
        Client introuvable. <a href="/admin/clients" className="text-lilac hover:underline">Retour à la liste</a>
      </main>
    );
  }

  const client: ClientData | undefined = row.mockData;
  const isOnboarding = !row.hasMockStats;

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <a href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-lilac mb-6">
        <ArrowLeft size={14} /> Tous les clients
      </a>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-lilac/20 border border-lilac/30 flex items-center justify-center font-display font-bold text-2xl text-lilac">
            {row.brand.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-lilac mb-1 inline-flex items-center gap-2">
              Fiche client
              {isOnboarding && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase font-semibold inline-flex items-center gap-0.5">
                  <Sparkles size={10} /> Onboarding
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight">{row.brand}</h1>
            <div className="text-white/60 mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> {row.sector}</span>
              {row.city !== '—' && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {row.city}</span>}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isOnboarding ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-green-500/10 text-green-400 border border-green-500/30'
              }`}>● {isOnboarding ? 'En onboarding' : 'actif'}</span>
            </div>
          </div>
        </div>
        <SendActionsBar slug={extrasSlug} brand={row.brand} />
      </div>

      <Card title="Contact" icon={Users} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {row.profile && (
            <>
              <Field label="Référent" value={row.profile.name} />
              <Field label="Email" link={`mailto:${row.profile.email}`} value={row.profile.email} icon={Mail} />
              {row.profile.phone && <Field label="Téléphone" link={`tel:${row.profile.phone.replace(/\s/g, '')}`} value={row.profile.phone} icon={Phone} />}
              {row.profile.website && <Field label="Site web" link={row.profile.website.startsWith('http') ? row.profile.website : `https://${row.profile.website}`} value={row.profile.website} icon={Globe} external />}
              <Field label="CA mensuel" value={row.monthlyRevenue} />
              <Field label="Inscrit depuis" value={new Date(row.profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </>
          )}
          {!row.profile && client && (
            <>
              <Field label="Référent" value={client.contact.name} />
              <Field label="Email" link={`mailto:${client.contact.email}`} value={client.contact.email} icon={Mail} />
              <Field label="Téléphone" link={`tel:${client.contact.phone.replace(/\s/g, '')}`} value={client.contact.phone} icon={Phone} />
              <Field label="Closer" value={client.closer} />
              <Field label="CA mensuel" value={client.monthlyRevenue} />
              <Field label="Client depuis" value={new Date(client.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </>
          )}
        </div>
      </Card>

      {/* Stats — uniquement si on a des données mockData */}
      {client && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Vues 30j" value={formatNumber(row.views)} delta={42} icon={Eye} accent="lilac" />
            <StatCard label="Abonnés totaux" value={formatNumber(client.stats.instagramFollowers + client.stats.tiktokFollowers)} delta={18} icon={Users} accent="green" />
            <StatCard label="ROAS Meta" value={`x${row.roas.toFixed(1)}`} delta={12} icon={TrendingUp} accent="amber" />
            <StatCard label="CA pub 30j" value={formatCurrency(client.stats.adRevenue)} delta={28} icon={DollarSign} accent="pink" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ObjectivesEditor slug={extrasSlug} />
            <ClientTodosCard mockTodos={client.todos} extraTodos={extras.todos} />
          </div>
        </>
      )}

      {/* Pas de mock data : objectifs + tâches + RDV (tout vient de la DB) */}
      {!client && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ObjectivesEditor slug={extrasSlug} />
          <ClientTodosCard mockTodos={[]} extraTodos={extras.todos} />
        </div>
      )}

      {client && (
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
          <ClientEventsCard mockEvents={client.upcomingEvents} extraEvents={extras.events} />
        </div>
      )}

      {!client && (
        <div className="grid grid-cols-1 gap-6 mb-8">
          <ClientEventsCard mockEvents={[]} extraEvents={extras.events} />
        </div>
      )}

      {/* Vidéos uniquement si mock */}
      {client && (
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
      )}

      {!client && (
        <div className="rounded-2xl border border-dashed border-lilac/20 bg-lilac/5 p-6 text-sm text-white/70 text-center">
          <Sparkles className="text-lilac mx-auto mb-2" size={20} />
          Ce client est en phase d'onboarding. Stats sociales, objectifs et vidéos seront disponibles une fois ses comptes connectés et le suivi configuré.
        </div>
      )}
    </main>
  );
}

function Field({ label, value, link, icon: Icon, external }: { label: string; value: string; link?: string; icon?: React.ElementType; external?: boolean }) {
  const content = link ? (
    <a href={link} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
      className="font-medium text-lilac hover:underline inline-flex items-center gap-1.5">
      {Icon && <Icon size={13} />} {value}
    </a>
  ) : (
    <span className="font-medium">{value}</span>
  );
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-white/40 mb-1">{label}</div>
      {content}
    </div>
  );
}

