'use client';
import { Sparkles } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  cta,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-lilac/10 border border-lilac/30 flex items-center justify-center mx-auto mb-4">
        <Icon className="text-lilac" size={22} />
      </div>
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-white/60 max-w-md mx-auto mb-6">{description}</p>
      {cta && (
        <a
          href={cta.href}
          className="inline-flex items-center gap-2 bg-lilac text-ink font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-white transition-colors"
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
