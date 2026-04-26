'use client';
import { Play, Sparkles, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  YOUTUBE_VIDEOS, YOUTUBE_URL, YouTubeVideo,
  youtubeThumbnail, youtubeWatchUrl,
} from '@/lib/config';

interface Props {
  /** Override la liste si besoin (par défaut : YOUTUBE_VIDEOS du config). */
  videos?: Array<YouTubeVideo | null>;
  /** Affiche un header (titre + lien chaîne). Défaut : true. */
  showHeader?: boolean;
  /** Libellé du titre (override). */
  title?: string;
  /** Sous-titre (override). */
  subtitle?: string;
  /** Animations stagger (utile sur la home / confirmation). */
  animated?: boolean;
  className?: string;
}

export default function YouTubeVideosGrid({
  videos = YOUTUBE_VIDEOS,
  showHeader = true,
  title = 'Notre chaîne YouTube',
  subtitle = 'Cas clients, frameworks, breakdowns de campagnes',
  animated = false,
  className = '',
}: Props) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 ${className}`}>
      {showHeader && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display font-bold text-xl mb-1 inline-flex items-center gap-2">
              <Play size={18} className="text-lilac" /> {title}
            </h2>
            <p className="text-sm text-white/50">{subtitle}</p>
          </div>
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-lilac hover:underline shrink-0 inline-flex items-center gap-1"
          >
            <Youtube size={14} /> Voir la chaîne →
          </a>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {videos.map((v, i) =>
          v
            ? <VideoCard key={`${v.id}-${i}`} video={v} index={i} animated={animated} />
            : <PlaceholderCard key={`empty-${i}`} index={i} animated={animated} />
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, index, animated }: { video: YouTubeVideo; index: number; animated: boolean }) {
  const Wrap: any = animated ? motion.a : 'a';
  const wrapProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-50px' },
        transition: { duration: 0.5, delay: index * 0.08 },
      }
    : {};
  return (
    <Wrap
      {...wrapProps}
      href={youtubeWatchUrl(video.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-lilac/40 transition-colors block bg-gradient-to-br from-omni-700/20 to-black"
    >
      {/* Thumbnail YouTube haute-déf, fallback hq si maxres absent (onError) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={youtubeThumbnail(video.id, 'maxres')}
        onError={(e) => {
          // Fallback automatique sur hqdefault si la maxres n'existe pas (rare)
          const img = e.currentTarget;
          if (!img.src.includes('hqdefault')) img.src = youtubeThumbnail(video.id, 'hq');
        }}
        alt={video.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Gradient overlay pour la lisibilité du titre + du play */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
      {/* Play centré */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-lilac/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
          <Play size={18} fill="currentColor" className="text-ink ml-0.5" />
        </div>
      </div>
      {/* Titre en bas */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
        <div className="text-xs font-semibold leading-tight line-clamp-2 text-white">
          {video.title}
        </div>
      </div>
    </Wrap>
  );
}

function PlaceholderCard({ index, animated }: { index: number; animated: boolean }) {
  const Wrap: any = animated ? motion.div : 'div';
  const wrapProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-50px' },
        transition: { duration: 0.5, delay: index * 0.08 },
      }
    : {};
  return (
    <Wrap
      {...wrapProps}
      className="relative aspect-video rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-center p-4"
    >
      <div>
        <Sparkles className="text-lilac/40 mx-auto mb-1.5" size={18} />
        <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Bientôt</div>
      </div>
    </Wrap>
  );
}
