'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Eye, DollarSign, Target } from 'lucide-react';
import { CLIENTS, formatNumber, formatCurrency } from '@/lib/mockData';
import Card from '@/components/dashboard/Card';

export default function AdminPerformancePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const ranked = [...CLIENTS]
    .map((c) => ({
      ...c,
      views: c.stats.instagramViews + c.stats.tiktokViews,
      roas: c.stats.adRevenue / Math.max(1, c.stats.adSpend),
    }))
    .sort((a, b) => b.views - a.views);

  const maxViews = Math.max(...ranked.map((r) => r.views));

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Performance</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Classement clients</h1>
        <p className="text-white/60 mt-2">Triés par vues cumulées sur les 30 derniers jours</p>
      </div>

      <Card title="Vues 30 derniers jours" icon={Eye}>
        <div className="space-y-4">
          {ranked.map((c, i) => (
            <div key={c.slug}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <a href={`/admin/clients/${c.slug}`} className="hover:text-lilac">
                  <span className="text-white/40 mr-2">#{i + 1}</span>
                  <span className="font-medium">{c.brand}</span>
                </a>
                <span className="font-mono">{formatNumber(c.views)} vues · ROAS x{c.roas.toFixed(1)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lilac to-omni-400"
                  style={{ width: `${(c.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
