import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, icon: Icon, action, children, className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-lilac/10 border border-lilac/30 flex items-center justify-center">
                <Icon size={16} className="text-lilac" />
              </div>
            )}
            <h3 className="font-display font-bold text-lg">{title}</h3>
          </div>
          {subtitle && <p className="text-sm text-white/50 ml-10">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
