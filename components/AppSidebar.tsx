'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Video,
  Calendar,
  Target,
  Users,
  LogOut,
  Settings,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import Logo from './Logo';
import { getSession, logout, Session } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
}

const CLIENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Vue d\'ensemble', Icon: LayoutDashboard },
  { href: '/dashboard/objectives', label: 'Objectifs', Icon: Target },
  { href: '/dashboard/todos', label: 'Tâches', Icon: CheckSquare },
  { href: '/dashboard/videos', label: 'Vidéos', Icon: Video },
  { href: '/dashboard/calendar', label: 'Agenda', Icon: Calendar },
  { href: '/dashboard/settings', label: 'Paramètres', Icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Vue d\'ensemble', Icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', Icon: Users },
  { href: '/admin/performance', label: 'Performance', Icon: TrendingUp },
];

export default function AppSidebar({ variant }: { variant: 'client' | 'admin' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (variant === 'admin' && s.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    if (variant === 'client' && s.role !== 'client') {
      router.replace('/admin');
      return;
    }
    setSession(s);
  }, [router, variant]);

  if (!session) return null;

  const items = variant === 'admin' ? ADMIN_NAV : CLIENT_NAV;

  const onLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
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

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-lilac/15 text-white border border-lilac/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} className={active ? 'text-lilac' : ''} />
                {label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-lilac/20 border border-lilac/30 flex items-center justify-center font-semibold text-sm text-lilac">
              {session.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{session.name}</div>
              <div className="text-xs text-white/40 truncate">{session.email}</div>
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
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
        />
      )}
    </>
  );
}
