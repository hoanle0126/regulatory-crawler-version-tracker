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
    default: 'border-slate-800 hover:border-slate-700',
    success: 'border-emerald-900/60 hover:border-emerald-700/80',
    warning: 'border-amber-900/60 hover:border-amber-700/80',
    danger: 'border-rose-900/60 hover:border-rose-700/80',
  };

  return (
    <div
      className={cn(
        'bg-slate-900/80 rounded-xl p-5 border transition-all duration-200 backdrop-blur-sm',
        borderVariants[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-slate-100 font-mono tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
            {badge}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          {trend && <span className="text-emerald-400 font-medium">{trend}</span>}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
}
