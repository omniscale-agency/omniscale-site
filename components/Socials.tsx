'use client';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import { INSTAGRAM_URL, LINKEDIN_URL, TIKTOK_URL, YOUTUBE_URL } from '@/lib/config';

// Icône TikTok (lucide n'en a pas)
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.84a8.16 8.16 0 0 0 4.77 1.52V6.91a4.85 4.85 0 0 1-1.84-.22z" />
    </svg>
  );
}

const socials = [
  { href: INSTAGRAM_URL, label: 'Instagram', Icon: Instagram },
  { href: TIKTOK_URL, label: 'TikTok', Icon: TikTokIcon },
  { href: YOUTUBE_URL, label: 'YouTube', Icon: Youtube },
  { href: LINKEDIN_URL, label: 'LinkedIn', Icon: Linkedin },
];

export default function Socials({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const cls =
    size === 'sm'
      ? 'w-9 h-9'
      : 'w-11 h-11';
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <div className="flex gap-3">
      {socials.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`${cls} rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:bg-lilac hover:text-ink hover:border-lilac transition-all`}
        >
          <Icon size={iconSize} />
        </a>
      ))}
    </div>
  );
}
