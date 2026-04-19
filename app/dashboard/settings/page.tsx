'use client';
import { useEffect, useState } from 'react';
import { User, Building2, Shield } from 'lucide-react';
import { getSessionAsync, Session } from '@/lib/auth';
import { CLIENTS, ClientData, getClientBySlug } from '@/lib/mockData';

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (!s) return;
      setSession(s);
      setClient((s.clientSlug && getClientBySlug(s.clientSlug)) || CLIENTS[0]);
    });
  }, []);

  if (!session || !client) return <div className="p-12 text-white/60">Chargement…</div>;

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-3xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Paramètres</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Mon compte</h1>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <User size={18} className="text-lilac" /> Profil
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Nom" value={session.name} />
            <Row label="Email" value={session.email} />
            <Row label="Rôle" value={session.role === 'admin' ? 'Administrateur' : session.role === 'client' ? 'Client' : 'Lead'} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-lilac" /> Entreprise
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Marque" value={session.brand || client.brand} />
            <Row label="Secteur" value={client.sector} />
            <Row label="Ville" value={client.city} />
            <Row label="Client depuis" value={new Date(client.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Shield size={18} className="text-lilac" /> Sécurité
          </h2>
          <button className="text-sm text-lilac hover:underline">Changer mon mot de passe</button>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
