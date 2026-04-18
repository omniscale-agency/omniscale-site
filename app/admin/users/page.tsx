'use client';
import { useEffect, useState } from 'react';
import { Users, Shield, Sparkles, Crown, Search, Trash2, ChevronDown, AlertCircle } from 'lucide-react';
import { listUsers, updateUser, deleteUser, subscribeUsers, User, Role } from '@/lib/auth';
import { CLIENTS } from '@/lib/mockData';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setUsers(listUsers());
    refresh();
    return subscribeUsers(refresh);
  }, []);

  const visible = users
    .filter((u) => filter === 'all' || u.role === filter)
    .filter((u) => `${u.name} ${u.email} ${u.brand || ''}`.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    client: users.filter((u) => u.role === 'client').length,
    lead: users.filter((u) => u.role === 'lead').length,
  };

  const setRole = (email: string, role: Role) => {
    const patch: Partial<User> = { role };
    // si on passe en client et pas de slug, on lie à un dossier mockData libre par défaut
    if (role === 'client') {
      const u = users.find((x) => x.email === email);
      if (u && !u.clientSlug) patch.clientSlug = CLIENTS[0].slug;
    } else if (role === 'lead') {
      patch.clientSlug = undefined;
    }
    updateUser(email, patch);
  };

  const setClientSlug = (email: string, slug: string) => updateUser(email, { clientSlug: slug });

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Console admin</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Utilisateurs & <span className="text-gradient">rôles</span>
        </h1>
        <p className="text-white/60 mt-2">
          Gère les rôles : <strong className="text-white">Lead</strong> = accès limité (conseils + ressources). <strong className="text-white">Client</strong> = espace complet.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiBtn label="Tous" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} icon={Users} />
        <KpiBtn label="Admins" count={counts.admin} active={filter === 'admin'} onClick={() => setFilter('admin')} icon={Crown} accent="amber" />
        <KpiBtn label="Clients" count={counts.client} active={filter === 'client'} onClick={() => setFilter('client')} icon={Shield} accent="green" />
        <KpiBtn label="Leads" count={counts.lead} active={filter === 'lead'} onClick={() => setFilter('lead')} icon={Sparkles} accent="lilac" />
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher email, nom, marque..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-lilac/50" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-white/40">
              <tr className="border-b border-white/5">
                <th className="text-left p-4 font-normal">Utilisateur</th>
                <th className="text-left p-4 font-normal">Marque</th>
                <th className="text-left p-4 font-normal">Inscription</th>
                <th className="text-left p-4 font-normal">Rôle</th>
                <th className="text-left p-4 font-normal">Dossier client lié</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.email} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs border ${
                        u.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                        u.role === 'client' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                        'bg-lilac/15 text-lilac border-lilac/30'
                      }`}>
                        {u.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-white/40">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white/70">{u.brand || '—'}</td>
                  <td className="p-4 text-white/60 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.email, e.target.value as Role)}
                      disabled={u.email === 'admin@omniscale.fr'}
                      className={`bg-white/5 border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-lilac/50 cursor-pointer ${
                        u.role === 'admin' ? 'border-amber-500/30 text-amber-400' :
                        u.role === 'client' ? 'border-green-500/30 text-green-400' :
                        'border-lilac/30 text-lilac'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="lead">Lead</option>
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {u.role === 'client' ? (
                      <select
                        value={u.clientSlug || ''}
                        onChange={(e) => setClientSlug(u.email, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-lilac/50"
                      >
                        {CLIENTS.map((c) => <option key={c.slug} value={c.slug}>{c.brand}</option>)}
                      </select>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {u.email !== 'admin@omniscale.fr' && (
                      <button
                        onClick={() => setConfirmDelete(u.email)}
                        className="text-white/30 hover:text-red-400 p-2"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div className="p-12 text-center text-white/50">Aucun utilisateur dans ce filtre.</div>
        )}
      </div>

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-black border border-red-500/30 rounded-2xl p-6 max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-display font-bold text-lg mb-1">Supprimer cet utilisateur ?</h3>
                <p className="text-sm text-white/60">{confirmDelete} sera supprimé définitivement.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="text-sm px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10">Annuler</button>
              <button onClick={() => { deleteUser(confirmDelete); setConfirmDelete(null); }} className="text-sm px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function KpiBtn({ label, count, active, onClick, icon: Icon, accent = 'lilac' }: { label: string; count: number; active: boolean; onClick: () => void; icon: React.ElementType; accent?: 'lilac' | 'green' | 'amber' }) {
  const colors = {
    lilac: active ? 'border-lilac bg-lilac/15 text-lilac' : 'border-white/10 hover:border-lilac/30',
    green: active ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-white/10 hover:border-green-500/30',
    amber: active ? 'border-amber-500 bg-amber-500/15 text-amber-400' : 'border-white/10 hover:border-amber-500/30',
  };
  return (
    <button onClick={onClick} className={`p-4 rounded-2xl border transition-colors text-left ${colors[accent]}`}>
      <Icon size={16} className="mb-2" />
      <div className="text-xs uppercase tracking-widest text-white/50">{label}</div>
      <div className="font-display text-2xl font-bold">{count}</div>
    </button>
  );
}
