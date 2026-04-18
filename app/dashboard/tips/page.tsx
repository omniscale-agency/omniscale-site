'use client';
import { useEffect, useState } from 'react';
import { Lightbulb, Clock, ChevronDown, Sparkles, Play } from 'lucide-react';
import { TIPS, CATEGORY_LABELS, CATEGORY_COLORS, Tip } from '@/lib/tips';
import { getSession, Session } from '@/lib/auth';

export default function TipsPage() {
  const [openId, setOpenId] = useState<string | null>(TIPS[0]?.id || null);
  const [filter, setFilter] = useState<keyof typeof CATEGORY_LABELS | 'all'>('all');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => { setSession(getSession()); }, []);

  const visible = filter === 'all' ? TIPS : TIPS.filter((t) => t.category === filter);

  return (
    <main className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-lilac mb-2 inline-flex items-center gap-1.5">
          <Sparkles size={12} /> Bibliothèque ouverte
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Conseils <span className="text-gradient">scaling</span>
        </h1>
        <p className="text-white/60 mt-3 max-w-2xl">
          {session?.role === 'lead'
            ? 'Bienvenue 👋 Voici nos meilleurs conseils accessibles gratuitement. Quand tu deviendras client, tu débloqueras tout ton dashboard de pilotage.'
            : 'Tous nos conseils stratégiques mis à jour chaque semaine.'}
        </p>
      </div>

      {/* Bibliothèque vidéos teaser */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display font-bold text-xl mb-1 inline-flex items-center gap-2">
              <Play size={18} className="text-lilac" /> Notre chaîne YouTube
            </h2>
            <p className="text-sm text-white/50">Cas clients, frameworks, breakdowns de campagnes</p>
          </div>
          <a href="https://www.youtube.com/@omniscale.agency" target="_blank" rel="noopener noreferrer"
            className="text-sm text-lilac hover:underline">Voir la chaîne →</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-omni-700/20 to-black flex items-center justify-center group cursor-pointer hover:border-lilac/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-lilac/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={18} fill="currentColor" className="text-ink ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'all' ? 'bg-lilac text-ink font-medium' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Tous ({TIPS.length})
        </button>
        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === cat ? 'bg-lilac text-ink font-medium' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Liste tips */}
      <div className="space-y-3">
        {visible.map((tip) => (
          <TipCard key={tip.id} tip={tip} open={openId === tip.id} onToggle={() => setOpenId(openId === tip.id ? null : tip.id)} />
        ))}
      </div>
    </main>
  );
}

function TipCard({ tip, open, onToggle }: { tip: Tip; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${CATEGORY_COLORS[tip.category]} ${open ? 'border-lilac/40' : 'border-white/10'} transition-colors`}>
      <button onClick={onToggle} className="w-full text-left p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-black/30 backdrop-blur flex items-center justify-center shrink-0">
          <Lightbulb size={18} className="text-lilac" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-xs text-white/60">
            <span className="uppercase tracking-widest">{CATEGORY_LABELS[tip.category]}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><Clock size={11} /> {tip.readMinutes} min</span>
          </div>
          <h3 className="font-display font-bold text-lg mb-1">{tip.title}</h3>
          <p className="text-sm text-white/70 leading-relaxed">{tip.excerpt}</p>
        </div>
        <ChevronDown size={20} className={`text-white/50 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-6 pl-[4.5rem] space-y-3 text-sm text-white/85 leading-relaxed">
          {tip.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}
