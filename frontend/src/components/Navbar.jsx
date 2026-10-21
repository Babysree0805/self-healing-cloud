import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, AlertTriangle, Cpu, Radio, User, Clock, Terminal } from 'lucide-react';

export const Navbar = () => {
  const { overview, activeIncidents, isConnected } = useTelemetry();
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-dark-border bg-dark-bg/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Cluster Identification */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">SRE AUTO-HEAL</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                k8s-prod-us-west
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">LangGraph Multi-Agent Cloud Controller</p>
          </div>
        </div>
      </div>

      {/* Cluster Telemetry Quick Badges */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-dark-card border border-dark-border">
          <div className={`w-2 h-2 rounded-full ${overview.overall_health > 80 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
          <span className="text-slate-400">Cluster Health:</span>
          <span className={`font-bold ${overview.overall_health > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {overview.overall_health}%
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-dark-card border border-dark-border">
          <AlertTriangle className={`w-3.5 h-3.5 ${activeIncidents.length > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
          <span className="text-slate-400">Active Incidents:</span>
          <span className={`font-bold ${activeIncidents.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {activeIncidents.length}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-dark-card border border-dark-border">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Avg CPU:</span>
          <span className="font-bold text-slate-200">{overview.avg_cpu_usage}%</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Right User & Live Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          AGENT ENGINE ACTIVE
        </div>

        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-dark-border">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user.username}</div>
              <div className="text-[10px] font-mono text-blue-400 uppercase">{user.role}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="w-8 h-8 rounded-full bg-dark-card border border-dark-border hover:border-slate-600 flex items-center justify-center text-slate-300 transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
