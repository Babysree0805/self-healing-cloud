import React from 'react';

export const HealthBadge = ({ status, size = 'normal' }) => {
  const normalized = (status || 'HEALTHY').toUpperCase();

  const styles = {
    HEALTHY: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    DEGRADED: 'bg-amber-950/80 text-amber-400 border-amber-800/60 animate-pulse',
    CRITICAL: 'bg-rose-950/80 text-rose-400 border-rose-800/60 animate-pulse',
    RECOVERING: 'bg-blue-950/80 text-blue-400 border-blue-800/60 animate-pulse',
    RESOLVED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    RUNNING: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    CRASHLOOPBACKOFF: 'bg-rose-950/90 text-rose-400 border-rose-800 animate-bounce',
    OOMKILLED: 'bg-rose-950/90 text-rose-400 border-rose-800',
    PENDING: 'bg-amber-950/80 text-amber-300 border-amber-800',
    TERMINATING: 'bg-slate-900 text-slate-400 border-slate-700',
  };

  const currentStyle = styles[normalized] || 'bg-slate-900 text-slate-300 border-slate-700';

  const dotColors = {
    HEALTHY: 'bg-emerald-400',
    DEGRADED: 'bg-amber-400',
    CRITICAL: 'bg-rose-500',
    RECOVERING: 'bg-blue-400',
    RESOLVED: 'bg-emerald-400',
    RUNNING: 'bg-emerald-400',
    CRASHLOOPBACKOFF: 'bg-rose-500',
    OOMKILLED: 'bg-rose-500',
    PENDING: 'bg-amber-400',
    TERMINATING: 'bg-slate-500',
  };

  const dotColor = dotColors[normalized] || 'bg-slate-400';

  const sizeClasses = size === 'small' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium border ${sizeClasses} ${currentStyle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {normalized}
    </span>
  );
};
