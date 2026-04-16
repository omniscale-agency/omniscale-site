'use client';

const items = [
  'BOUTIQUES',
  'RESTAURANTS',
  'E-COMMERCE',
  'INFLUENCE',
  'ADS META',
  'TIKTOK',
  'BRANDING',
  'SITES WEB',
  'SEO',
  'CONTENU UGC',
];

export default function Marquee() {
  return (
    <div className="border-y border-white/10 bg-ink/50 backdrop-blur-sm py-6 overflow-hidden">
      <div className="marquee-track">
        {[...items, ...items].map((it, i) => (
          <div key={i} className="flex items-center gap-12 px-8">
            <span className="font-display text-2xl md:text-4xl font-bold text-white/80">{it}</span>
            <span className="text-lilac text-3xl">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
