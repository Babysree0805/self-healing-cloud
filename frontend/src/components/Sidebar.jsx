import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  AlertOctagon,
  Bot,
  Zap,
  BookOpen,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const Sidebar = () => {
  const { activeIncidents, activeFaults } = useTelemetry();

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/microservices', label: 'Microservice Monitor', icon: Server },
    {
      to: '/incidents',
      label: 'Incident Management',
      icon: AlertOctagon,
      badge: activeIncidents.length > 0 ? activeIncidents.length : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { to: '/agents', label: 'Agent Reasoning Flow', icon: Bot, isAgent: true },
    {
      to: '/chaos',
      label: 'Chaos Simulation Lab',
      icon: Zap,
      badge: activeFaults.length > 0 ? 'ACTIVE' : null,
      badgeColor: 'bg-amber-500 text-black',
    },
    { to: '/knowledge-base', label: 'SRE Knowledge Base', icon: BookOpen },
  ];

  return (
    <aside className="w-64 border-r border-dark-border bg-dark-card/60 backdrop-blur-md flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <div className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 px-3 mb-2">
            Operations & Telemetry
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Microservices Workload Tag */}
        <div className="p-3 rounded-lg bg-dark-bg border border-dark-border text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>TARGET WORKLOAD</span>
            <span className="text-emerald-400">8 SERVICES</span>
          </div>
          <div className="text-[11px] text-slate-300 font-medium">
            Ride-Hailing Cloud Microservices
          </div>
          <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
            Auth, Ride, Driver, Trip, Pricing, Location, Notification & Gateway
          </div>
          <div className="pt-2 border-t border-dark-border grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <a
              href="http://localhost:5174#passenger"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
            >
              <span>🧑 Passenger</span>
              <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
            </a>
            <a
              href="http://localhost:5174#driver"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
            >
              <span>🛺 Driver</span>
              <ExternalLink className="w-2.5 h-2.5 text-amber-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-dark-border space-y-2 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="text-blue-400">LangGraph v0.0.30</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Runtime:</span>
          <span className="text-emerald-400">Kubernetes 1.29</span>
        </div>
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 pt-1"
        >
          <Terminal className="w-3 h-3" />
          <span>Swagger API Explorer</span>
          <ExternalLink className="w-2.5 h-2.5 ml-auto" />
        </a>
      </div>
    </aside>
  );
};
