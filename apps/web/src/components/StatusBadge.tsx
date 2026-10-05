import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'change' | 'crawl' | 'changeset';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'status', size = 'md' }: StatusBadgeProps) {
  const s = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (type === 'change') {
    switch (s) {
      case 'ADDED':
        colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80';
        break;
      case 'MODIFIED':
        colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/80';
        break;
      case 'REMOVED':
        colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/80';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  } else if (type === 'crawl') {
    switch (s) {
      case 'SUCCESS':
        colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80';
        break;
      case 'RUNNING':
        colorClasses = 'bg-sky-950/70 text-sky-400 border-sky-800/80 animate-pulse';
        break;
      case 'FAILED':
        colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/80';
        break;
      case 'QUEUED':
        colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  } else if (type === 'changeset') {
    switch (s) {
      case 'DETECTED':
        colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/80';
        break;
      case 'REVIEWED':
        colorClasses = 'bg-sky-950/70 text-sky-400 border-sky-800/80';
        break;
      case 'ACKNOWLEDGED':
        colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80';
        break;
      case 'IGNORED':
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  } else {
    // Document lifecycle status
    switch (s) {
      case 'EFFECTIVE':
        colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80';
        break;
      case 'AMENDED':
        colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/80';
        break;
      case 'REPLACED':
        colorClasses = 'bg-purple-950/70 text-purple-400 border-purple-800/80';
        break;
      case 'EXPIRED':
      case 'REPEALED':
        colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/80';
        break;
      case 'NOT_YET_EFFECTIVE':
      case 'PUBLISHED':
        colorClasses = 'bg-blue-950/70 text-blue-400 border-blue-800/80';
        break;
      default:
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border tracking-wide font-mono',
        sizeClasses,
        colorClasses
      )}
    >
      {s.replace(/_/g, ' ')}
    </span>
  );
}
