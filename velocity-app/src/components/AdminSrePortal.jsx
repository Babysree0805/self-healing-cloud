import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Flame,
  RotateCcw,
  RefreshCw,
  Terminal,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  Database
} from 'lucide-react';
import { FAULT_SPECS } from './ChaosHealBar';

const INITIAL_PODS = [
  { pod_name: 'auth-service-pod-7d4f9b-256', service: 'auth-service', status: 'Running', cpu: '45m', mem: '120MB', node: 'k8s-worker-node-3', ip: '10.244.2.137', restarts: 0 },
  { pod_name: 'ride-service-pod-7d4f9b-586', service: 'ride-service', status: 'Running', cpu: '52m', mem: '135MB', node: 'k8s-worker-node-1', ip: '10.244.2.132', restarts: 0 },
  { pod_name: 'driver-service-pod-7d4f9b-990', service: 'driver-service', status: 'Running', cpu: '38m', mem: '110MB', node: 'k8s-worker-node-2', ip: '10.244.7.21', restarts: 0 },
  { pod_name: 'trip-service-pod-7d4f9b-962', service: 'trip-service', status: 'Running', cpu: '60m', mem: '148MB', node: 'k8s-worker-node-1', ip: '10.244.9.205', restarts: 0 },
  { pod_name: 'pricing-service-pod-7d4f9b-894', service: 'pricing-service', status: 'Running', cpu: '41m', mem: '115MB', node: 'k8s-worker-node-3', ip: '10.244.3.103', restarts: 0 },
  { pod_name: 'location-service-pod-7d4f9b-542', service: 'location-service', status: 'Running', cpu: '35m', mem: '95MB', node: 'k8s-worker-node-2', ip: '10.244.6.121', restarts: 0 },
  { pod_name: 'notification-service-pod-7d4f9b-851', service: 'notification-service', status: 'Running', cpu: '28m', mem: '88MB', node: 'k8s-worker-node-3', ip: '10.244.4.190', restarts: 0 },
  { pod_name: 'api-gateway-pod-7d4f9b-267', service: 'api-gateway', status: 'Running', cpu: '65m', mem: '160MB', node: 'k8s-worker-node-1', ip: '10.244.9.45', restarts: 0 },
];

export const AdminSrePortal = () => {
  const [pods, setPods] = useState(INITIAL_PODS);
  const [activeFault, setActiveFault] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [logs, setLogs] = useState([
    { time: '12:00:01', level: 'INFO', msg: 'Kubernetes GKE cluster state synchronized: 8/8 pods Ready.' },
    { time: '12:00:05', level: 'INFO', msg: 'LangGraph SRE Agent Autonomous Loop active. Telemetry polling at 1.5s.' },
  ]);

  // Handle fault injection & simulated autonomous healing
  const triggerChaos = (type) => {
    const spec = FAULT_SPECS[type];
    if (!spec) return;

    setActiveFault({ type, ...spec });
    setCountdown(spec.duration);

    // Update pod status for targeted service
    setPods(prev => prev.map(p => {
      if (p.service === spec.service) {
        let newStatus = 'Degraded';
        if (type === 'SERVICE_CRASH') newStatus = 'CrashLoopBackOff';
        if (type === 'MEMORY_LEAK') newStatus = 'OOMKilled';
        if (type === 'TRAFFIC_OVERLOAD') newStatus = 'HPA Scaling (2 Replicas)';
        if (type === 'DB_BOTTLENECK') newStatus = 'Lock Contention';
        return { ...p, status: newStatus, restarts: p.restarts + 1 };
      }
      return p;
    }));

    const now = new Date().toLocaleTimeString();
    setLogs(prev => [
      { time: now, level: 'CRITICAL', msg: `[Chaos Injected] ${spec.label} on ${spec.service}. Triggering LangGraph SRE RCA pipeline.` },
      { time: now, level: 'WARN', msg: `[SRE Agent] Root Cause identified. Autonomous remediation action: ${spec.action}.` },
      ...prev.slice(0, 8)
    ]);
  };

  // Countdown and Auto-Heal
  useEffect(() => {
    if (countdown <= 0) {
      if (activeFault) {
        // Heal back to Running
        setPods(prev => prev.map(p => ({ ...p, status: 'Running' })));
        const now = new Date().toLocaleTimeString();
        setLogs(prev => [
          { time: now, level: 'SUCCESS', msg: `[Autonomous Healed] SRE Agent verified cluster recovery. All 8 pods Healthy in ${activeFault.duration}s.` },
          ...prev.slice(0, 8)
        ]);
        setActiveFault(null);
      }
      return;
    }

    const t = setInterval(() => {
      setCountdown(prev => Math.max(0, Math.round((prev - 0.2) * 10) / 10));
    }, 200);

    return () => clearInterval(t);
  }, [countdown, activeFault]);

  return (
    <div className="h-full overflow-y-auto bg-[#070A0F] text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">SRE Operations Command Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                GKE PRODUCTION
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Autonomous Self-Healing Kubernetes Microservices Infrastructure
            </p>
          </div>
        </div>

        {/* Quick Nav to Passenger & Driver apps */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.location.hash = 'passenger')}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-amber-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>Passenger App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => (window.location.hash = 'driver')}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-emerald-400 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>Captain App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cluster Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CLUSTER HEALTH</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {activeFault ? '87.5%' : '100%'}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            {activeFault ? 'Remediating incident' : 'Zero active anomalies'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>K8S PODS</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {activeFault ? '7 / 8 Ready' : '8 / 8 Ready'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            3 Worker Nodes (us-central1)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AUTONOMOUS MTTR</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-2">6.4s</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Industry Avg: 15-45 mins
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SRE AGENT</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">LangGraph</div>
          <div className="text-[10px] text-emerald-400 mt-1">
            Auto-Remediation Active
          </div>
        </div>
      </div>

      {/* Active Fault Healing Status Banner */}
      {activeFault && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-600/60 font-mono shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-200">
                  {activeFault.label} Active on <span className="underline">{activeFault.service}</span>
                </div>
                <div className="text-xs text-amber-300/80 mt-0.5">
                  Action: {activeFault.action}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-amber-400 uppercase font-semibold">Self-Healing In</div>
                <div className="text-xl font-black text-amber-200">{countdown.toFixed(1)}s</div>
              </div>
              <div className="w-24 bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-200"
                  style={{ width: `${(countdown / activeFault.duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chaos Injection Controls */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Chaos Engineering Injection Lab</h2>
          </div>
          <span className="text-[10px] text-slate-400">Simulate pod failures & verify autonomous healing</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(FAULT_SPECS).map(([key, spec]) => (
            <button
              key={key}
              onClick={() => triggerChaos(key)}
              disabled={countdown > 0}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between gap-1 shadow-md ${
                activeFault?.type === key
                  ? 'bg-amber-500/30 border-amber-400 text-white animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white active:scale-95 disabled:opacity-50'
              }`}
            >
              <div className="text-xs font-semibold">{spec.label}</div>
              <div className="text-[10px] text-slate-400 font-normal">Heals in {spec.duration}s</div>
            </button>
          ))}
        </div>
      </div>

      {/* Kubernetes Pods Table */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Kubernetes Pods Orchestration (kubectl get pods)</h2>
          </div>
          <span className="text-[10px] text-slate-400">Namespace: ride-hailing-system</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase border-b border-white/10 bg-white/5">
              <tr>
                <th className="py-2.5 px-3">Pod Name</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Node</th>
                <th className="py-2.5 px-3">IP</th>
                <th className="py-2.5 px-3">CPU</th>
                <th className="py-2.5 px-3">Mem</th>
                <th className="py-2.5 px-3 text-right">Restarts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {pods.map((p) => {
                const isFailed = p.status !== 'Running';
                return (
                  <tr key={p.pod_name} className={`hover:bg-white/5 transition-colors ${isFailed ? 'bg-rose-950/30' : ''}`}>
                    <td className="py-2.5 px-3 font-bold text-white">{p.pod_name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.service}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isFailed
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{p.node}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.ip}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.cpu}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.mem}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">{p.restarts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SRE Agent Execution Log */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Autonomous SRE Agent Audit Stream</h2>
          </div>
          <span className="text-[10px] text-slate-500">Live Remediation Telemetry</span>
        </div>

        <div className="bg-[#05070B] p-3 rounded-xl border border-white/5 space-y-1.5 max-h-40 overflow-y-auto">
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed">
              <span className="text-slate-500 shrink-0">[{l.time}]</span>
              <span
                className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                  l.level === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300'
                    : l.level === 'WARN'
                    ? 'bg-amber-500/20 text-amber-300'
                    : l.level === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {l.level}
              </span>
              <span className="text-slate-300">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
