'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CheckSquare, Video, Calendar, Target, Users,
  LogOut, Settings, TrendingUp, Menu, X, Filter, Wallet, Receipt,
  Lightbulb, Plug, Sparkles, ArrowRight,
} from 'lucide-react';
import Logo from './Logo';
import { getSessionAsync, logout, Session, Role } from '@/lib/auth';
import { BOOKING_URL } from '@/lib/config';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Si défini : seuls ces rôles voient l'item activé. Sinon, l'item est affiché grisé avec un cadenas. */
  roles?: Role[];
  premium?: boolean; // affiche un badge "Client" sur l'item
}

const CLIENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Vue d\'ensemble', Icon: LayoutDashboard, premium: true },
  { href: '/dashboard/tips', label: 'Conseils scaling', Icon: Lightbulb }, // accessible aux leads
  { href: '/dashboard/connections', label: 'Mes comptes sociaux', Icon: Plug, premium: true },
  { href: '/dashboard/objectives', label: 'Objectifs', Icon: Target, premium: true },
  { href: '/dashboard/todos', label: 'Tâches', Icon: CheckSquare, premium: true },
  { href: '/dashboard/videos', label: 'Vidéos', Icon: Video, premium: true },
  { href: '/dashboard/calendar', label: 'Agenda', Icon: Calendar, premium: true },
  { href: '/dashboard/invoices', label: 'Factures', Icon: Receipt, premium: true },
  { href: '/dashboard/settings', label: 'Paramètres', Icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Vue d\'ensemble', Icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', Icon: Users },
  { href: '/admin/users', label: 'Utilisateurs & rôles', Icon: Users },
  { href: '/admin/leads', label: 'Leads & acquisition', Icon: Filter },
  { href: '/admin/finance', label: 'Trésorerie', Icon: Wallet },
  { href: '/admin/performance', label: 'Performance', Icon: TrendingUp },
  { href: '/admin/settings', label: 'Paramètres entreprise', Icon: Settings },
];

export default function AppSidebar({ variant }: { variant: 'client' | 'admin' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getSessionAsync().then((s) => {
      if (!s) { router.replace('/login'); return; }
      if (variant === 'admin' && s.role !== 'admin') { router.replace('/dashboard'); return; }
      if (variant === 'client' && s.role === 'admin') { router.replace('/admin'); return; }
      setSession(s);
    });
  }, [router, variant]);

  if (!session) return null;

  const items = variant === 'admin' ? ADMIN_NAV : CLIENT_NAV;
  const isLead = session.role === 'lead';

  const onLogout = async () => { await logout(); router.push('/login'); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-black/60 backdrop-blur border border-white/10 rounded-xl p-2.5"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-black border-r border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <a href={variant === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="bg-lilac rounded-xl p-1.5">
              <Logo size={24} color="#000000" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">omniscale</span>
          </a>
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/60" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {variant === 'admin' && (
          <div className="mx-6 mb-4 px-3 py-1.5 rounded-md bg-lilac/10 border border-lilac/30 text-xs text-lilac inline-flex items-center gap-1.5 self-start">
            <Settings size={12} /> Console admin
          </div>
        )}

        {variant === 'client' && isLead && (
          <div className="mx-6 mb-4 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 inline-flex items-center gap-1.5 self-start">
            <Sparkles size={12} /> Compte LEAD · accès limité
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {items.map(({ href, label, Icon, premium }) => {
            const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
            const locked = variant === 'client' && isLead && premium === true;
            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-lilac/15 text-white border border-lilac/30'
                    : locked
                    ? 'text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="inline-flex items-center gap-3 min-w-0">
                  <Icon size={18} className={active ? 'text-lilac' : ''} />
                  <span className="truncate">{label}</span>
                </span>
                {locked && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-wider shrink-0">
                    Client
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {variant === 'client' && isLead && (
          <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-br from-lilac/10 to-omni-700/10 border border-lilac/20">
            <div className="font-display font-bold text-sm mb-1">Débloquer ton espace</div>
            <p className="text-xs text-white/60 mb-3 leading-relaxed">
              Réserve un appel pour activer toutes les fonctionnalités.
            </p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-lilac text-ink font-semibold px-3 py-2 rounded-lg text-xs hover:bg-white transition-colors"
            >
              Réserver un appel <ArrowRight size={11} className="inline ml-1" />
            </a>
          </div>
        )}

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-lilac/20 border border-lilac/30 flex items-center justify-center font-semibold text-sm text-lilac">
              {session.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{session.name}</div>
              <div className="text-xs text-white/40 truncate">
                {session.role === 'admin' ? 'Admin' : session.role === 'client' ? 'Client' : 'Lead'} · {session.email}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full inline-flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </aside>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70 z-40 lg:hidden" />
      )}
    </>
  );
}
