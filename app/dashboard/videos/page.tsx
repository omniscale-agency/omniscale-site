'use client';
import { useEffect, useState } from 'react';
import { Eye, Heart, MessageCircle, Share2, Video as VideoIcon } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { CLIENTS, ClientData, getClientBySlug, formatNumber } from '@/lib/mockData';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-fuchsia-500 to-orange-500',
  tiktok: 'from-cyan-400 to-pink-500',
  youtube: 'from-red-600 to-red-800',
};

export default function VideosPage() {
  const [client, setClient] = useState<ClientData | null>(null);
  const [filter, setFilter] = useState<'all' | 'instagram' | 'tiktok' | 'youtube'>('all');

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    const c = s.clientSlug ? getClientBySlug(s.clientSlug) : CLIENTS[0];
    setClient(c || CLIENTS[0]);
  }, []);

  if (!client) return <div className="p-12 text-white/60">Chargement…</div>;

  const visible = filter === 'all' ? client.videos : client.videos.filter(v => v.platform === filter);
  const totalViews = client.videos.reduce((s, v) => s + v.views, 0);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2">Bibliothèque</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Vidéos publiées</h1>
        <p className="text-white/60 mt-2">{client.videos.length} vidéos · {formatNumber(totalViews)} vues cumulées</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'tiktok', 'instagram', 'youtube'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              filter === f ? 'bg-lilac text-ink font-medium' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'Toutes' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((v) => (
          <div key={v.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-lilac/30 transition-colors">
            <div className="relative aspect-[9/16]">
              <div className={`absolute inset-0 bg-gradient-to-br ${PLATFORM_COLORS[v.platform]} opacity-30`} />
              <div className="absolute inset-0 placeholder-shimmer opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent" />
              <div className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/50 backdrop-blur">
                {v.platform}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-lilac/90 flex items-center justify-center">
                  <VideoIcon size={20} className="text-ink" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="font-medium text-sm mb-1 line-clamp-2 min-h-[2.5em]">{v.title}</div>
              <div className="text-xs text-white/40 mb-3">
                {new Date(v.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
              <div className="grid grid-cols-4 gap-1 text-xs text-white/70">
                <div className="flex flex-col items-center gap-0.5">
                  <Eye size={12} /> {formatNumber(v.views)}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <Heart size={12} /> {formatNumber(v.likes)}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <MessageCircle size={12} /> {formatNumber(v.comments)}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <Share2 size={12} /> {formatNumber(v.shares)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
