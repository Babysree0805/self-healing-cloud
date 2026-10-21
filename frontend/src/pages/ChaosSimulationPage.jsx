import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { chaosApi } from '../services/api';
import {
  Zap,
  Cpu,
  Database,
  Flame,
  TrendingUp,
  WifiOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Smartphone,
} from 'lucide-react';

export const ChaosSimulationPage = () => {
  const { services, activeFaults, agentEvents, refreshData } = useTelemetry();
  const [selectedService, setSelectedService] = useState('trip-service');
  const [injectingType, setInjectingType] = useState(null);
  const [notification, setNotification] = useState(null);

  const chaosActions = [
    {
      id: 'CPU_SPIKE',
      title: 'Simulate CPU Spike',
      desc: 'Saturates worker threads with compute loop exceeding 95% CPU load.',
      icon: Cpu,
      color: 'rose',
      expectedAction: 'Horizontal Pod Scaling / Worker Recycle',
      velocityImpact: 'Fare estimation and category calculations lag and timeout',
    },
    {
      id: 'MEMORY_LEAK',
      title: 'Simulate Memory Leak',
      desc: 'Allocates unbounded in-memory cache chunks triggering OOM risk.',
      icon: Flame,
      color: 'amber',
      expectedAction: 'Pod Restart & Heap Cache Purge',
      velocityImpact: 'Trip tracking slows down, eventual OOMKill container reset',
    },
    {
      id: 'SERVICE_CRASH',
      title: 'Kill Service / Pod Crash',
      desc: 'Injects fatal container exception entering CrashLoopBackOff.',
      icon: Zap,
      color: 'rose',
      expectedAction: 'Kubernetes Pod Reconstitution',
      velocityImpact: 'Velocity App fails with HTTP 503: Booking requests cannot reach backend',
    },
    {
      id: 'TRAFFIC_OVERLOAD',
      title: 'Increase Traffic Overload',
      desc: 'Simulates 500+ RPS traffic storm causing gateway queue buffer exhaustion.',
      icon: TrendingUp,
      color: 'purple',
      expectedAction: 'Dynamic Scale-Up & Ingress Shedding',
      velocityImpact: 'Rate limit 429 & delay on Velocity rider dispatching',
    },
    {
      id: 'DB_BOTTLENECK',
      title: 'Database Bottleneck',
      desc: 'Simulates PostgreSQL lock contention and connection pool exhaustion.',
      icon: Database,
      color: 'amber',
      expectedAction: 'Connection Pool Reset & Pod Rollout',
      velocityImpact: 'Booking on Velocity App hangs and fails with HTTP 500 DB lock error!',
    },
    {
      id: 'NETWORK_PARTITION',
      title: 'Simulate Network Failure',
      desc: 'Simulates 45% packet loss and 504 Gateway Timeout errors.',
      icon: WifiOff,
      color: 'rose',
      expectedAction: 'Traffic Rerouting & Circuit Breaker',
      velocityImpact: 'Velocity client requests drop and timeout with 504 Gateway Timeout',
    },
  ];

  const handleInject = async (type) => {
    setInjectingType(type);
    try {
      let targetService = selectedService;
      if (type === 'DB_BOTTLENECK') {
        targetService = 'auth-service';
      }
      const res = await chaosApi.injectFault(targetService, type, 1.0, 60);
      setNotification({
        type: 'SUCCESS',
        message: `Injected '${type}' into ${targetService}. Velocity Ride App is immediately impacted. AI SRE Agents will detect & heal autonomously!`,
      });
      setTimeout(() => setNotification(null), 5000);
      refreshData();
    } catch (e) {
      setNotification({
        type: 'ERROR',
        message: `Failed to inject fault: ${e.message}`,
      });
    } finally {
      setInjectingType(null);
    }
  };

  const handleResetAll = async () => {
    try {
      await chaosApi.resetAll();
      setNotification({
        type: 'SUCCESS',
        message: 'All chaos faults cleared. Cluster restored to nominal state.',
      });
      setTimeout(() => setNotification(null), 4000);
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Chaos & Failure Simulation Lab</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Inject realistic cloud infrastructure faults to observe live failure in Velocity App and autonomous agentic self-healing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-[#FFDE00] hover:bg-[#ffe633] text-black text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open Velocity Ride App</span>
            <ExternalLink className="w-3 h-3 text-black" />
          </a>

          <button
            onClick={handleResetAll}
            className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border hover:border-slate-600 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Reset Faults</span>
          </button>
        </div>
      </div>

      {/* Real Infrastructure Linkage Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FFDE00] text-black text-xl font-black shrink-0 shadow-md">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Real Workload Linkage: Velocity Ride App (:5174)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Live Connected
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Injecting <b>DB_BOTTLENECK</b> or <b>SERVICE_CRASH</b> into <code>trip-service</code> will directly freeze bookings on Velocity until the AI SRE agent executes pod rollouts!
            </p>
          </div>
        </div>

        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-[#FFDE00] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Test in Velocity</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            notification.type === 'SUCCESS'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/80 border-rose-800 text-rose-300'
          }`}
        >
          {notification.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Target Service Selector Bar */}
      <div className="glass-panel p-4 rounded-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 uppercase">Target Microservice:</span>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
          >
            {services.map((s) => (
              <option key={s.service_name} value={s.service_name}>
                {s.display_name} ({s.service_name})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Active Faults:</span>
          <span className={`font-bold ${activeFaults.length > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {activeFaults.length} Active
          </span>
        </div>
      </div>

      {/* Chaos Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chaosActions.map((action) => {
          const Icon = action.icon;
          const isInjecting = injectingType === action.id;

          return (
            <div
              key={action.id}
              className="glass-panel rounded-xl border border-dark-border p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-400 uppercase">
                    1-Click Trigger
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {action.desc}
                  </p>
                </div>

                {/* Velocity Impact */}
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] font-mono space-y-1">
                  <div className="text-amber-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <span>⚡ Velocity App Impact</span>
                  </div>
                  <div className="text-slate-300 text-[10px]">{action.velocityImpact}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-bg border border-dark-border text-[11px] font-mono space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase">Autonomous AI SRE Remedy</div>
                  <div className="text-emerald-400">{action.expectedAction}</div>
                </div>
              </div>

              <button
                onClick={() => handleInject(action.id)}
                disabled={isInjecting}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-semibold text-xs font-mono tracking-wide flex items-center justify-center gap-2 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isInjecting ? 'Injecting Fault...' : `Simulate on ${selectedService}`}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Auto-Healing Stream Preview */}
      <div className="glass-panel p-5 rounded-xl border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Live Autonomous Auto-Heal Feedback Watcher
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Real-Time SRE Observer
          </span>
        </div>

        <div className="space-y-2">
          {agentEvents.slice(0, 5).map((ev, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-dark-bg border border-dark-border text-xs font-mono flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <span className="text-blue-400 font-bold">[{ev.agent_name}]</span>{' '}
                <span className="text-slate-300">{ev.reasoning}</span>
              </div>
              <span className="text-emerald-400 font-semibold shrink-0">{ev.result}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
