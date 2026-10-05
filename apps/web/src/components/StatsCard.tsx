import React from 'react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  badge?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatsCard({
  title,
  value,
  subtext,
  icon,
  trend,
  badge,
  variant = 'default',
}: StatsCardProps) {
  const borderVariants = {
    default: 'border-[#ded7c8] hover:border-[#193354]',
    success: 'border-[#bbf7d0] hover:border-[#86efac]',
    warning: 'border-[#fde68a] hover:border-[#fcd34d]',
    danger: 'border-[#fecaca] hover:border-[#f87171]',
  };

  return (
    <div
      className={cn(
        'bg-[#fdfdfc] p-5 border transition-all duration-150 relative shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        borderVariants[variant]
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#f0ebd9] gap-2">
        <span className="text-[11px] font-sans font-semibold text-ink-600 uppercase tracking-wider whitespace-nowrap truncate">
          {title}
        </span>
        {icon && <div className="text-ink-500 shrink-0">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-serif font-bold text-ink-950 tracking-tight whitespace-nowrap">
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#f2eee5] border border-[#ded7c8] text-ink-700 font-medium whitespace-nowrap shrink-0">
            {badge}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-600">
          {trend && <span className="text-[#166534] font-medium font-mono">{trend}</span>}
          {subtext && <span className="font-serif italic text-ink-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
