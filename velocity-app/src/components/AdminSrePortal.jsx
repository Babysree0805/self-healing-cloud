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
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  Database,
  ExternalLink,
  Sliders,
  WifiOff
} from 'lucide-react';

export const FAULT_DEFINITIONS = {
  CPU_SPIKE: {
    service: 'pricing-service',
    label: '⚡ CPU Core Saturation',
    shortLabel: 'CPU Spike',
    duration: 4.2,
    complexity: 'EASY',
    action: 'HPA CPU CFS Quota Optimization',
    impact: 'Passenger: Fare estimate 504 Timeout | Driver: Surge pricing throttled',
    kubectlCmd: 'kubectl top pod pricing-service-pod && kubectl scale --replicas=2 deploy/pricing-deployment',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300'
  },
  TRAFFIC_OVERLOAD: {
    service: 'ride-service',
    label: '🚦 Traffic Overload',
    shortLabel: 'Traffic Surge',
    duration: 5.5,
    complexity: 'EASY-MED',
    action: 'Ingress Rate Limiter & HPA Scale Replicas (1 -> 3)',
    impact: 'Passenger: Bike Taxi blocked (429 Rate Limit) | Auto & Cab allowed',
    kubectlCmd: 'kubectl scale deployment ride-deployment --replicas=3 -n ride-hailing-system',
    color: 'from-orange-500/20 to-amber-500/20 border-orange-500/50 text-orange-300'
  },
  SERVICE_CRASH: {
    service: 'driver-service',
    label: '💥 Container CrashLoopBackOff',
    shortLabel: 'Crash GPS',
    duration: 7.0,
    complexity: 'MEDIUM',
    action: 'Kubernetes Pod Delete & Container Restart',
    impact: 'Passenger: Live GPS radar offline | Driver: Duty toggle 503 CrashLoop',
    kubectlCmd: 'kubectl delete pod driver-service-pod-990 --grace-period=0 -n ride-hailing-system',
    color: 'from-rose-500/20 to-red-500/20 border-rose-500/50 text-rose-300'
  },
  NETWORK_PARTITION: {
    service: 'location-service',
    label: '🌐 Network Partition (Packet Loss)',
    shortLabel: 'Net Partition',
    duration: 8.2,
    complexity: 'MED-COMPLEX',
    action: 'Envoy Ingress Route Reset & Socket Remount',
    impact: 'Passenger: Dispatch packet drop (45%) | Driver: Fleet telemetry 504',
    kubectlCmd: 'kubectl rollout restart daemonset/envoy-proxy-network -n ride-hailing-system',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/50 text-purple-300'
  },
  DB_BOTTLENECK: {
    service: 'auth-service',
    label: '🔒 PostgreSQL Lock Contention',
    shortLabel: 'DB Lock',
    duration: 9.4,
    complexity: 'COMPLEX',
    action: 'PostgreSQL Lock Purge & Connection Pool Recycled',
    impact: 'Passenger & Driver: Login blocked (500 Internal Error) | Pool exhausted',
    kubectlCmd: 'kubectl exec -it postgres-0 -- pkill -u postgres -f "idle in transaction"',
    color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-300'
  },
  MEMORY_LEAK: {
    service: 'trip-service',
    label: '🧠 Unbounded Heap Memory Leak (OOM)',
    shortLabel: 'Memory Leak',
    duration: 10.0,
    complexity: 'COMPLEX',
    action: 'Canary Rollback to v1.1.9-stable & Cache Purge',
    impact: 'Driver: Instant cashout payout aborted (500 OOMKilled Exit Code 137)',
    kubectlCmd: 'kubectl rollout undo deployment/trip-deployment -n ride-hailing-system',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/50 text-pink-300'
  }
};

const BASE_PODS = [
  { pod_name: 'auth-service-pod-7d4f9b-256', service: 'auth-service', port: 8001, status: 'Running', cpu: '45m', mem: '120MB', node: 'k8s-worker-node-3', ip: '10.244.2.137', restarts: 0 },
  { pod_name: 'ride-service-pod-7d4f9b-586', service: 'ride-service', port: 8002, status: 'Running', cpu: '52m', mem: '135MB', node: 'k8s-worker-node-1', ip: '10.244.2.132', restarts: 0 },
  { pod_name: 'driver-service-pod-7d4f9b-990', service: 'driver-service', port: 8003, status: 'Running', cpu: '38m', mem: '110MB', node: 'k8s-worker-node-2', ip: '10.244.7.21', restarts: 0 },
  { pod_name: 'trip-service-pod-7d4f9b-962', service: 'trip-service', port: 8004, status: 'Running', cpu: '60m', mem: '148MB', node: 'k8s-worker-node-1', ip: '10.244.9.205', restarts: 0 },
  { pod_name: 'pricing-service-pod-7d4f9b-894', service: 'pricing-service', port: 8005, status: 'Running', cpu: '41m', mem: '115MB', node: 'k8s-worker-node-3', ip: '10.244.3.103', restarts: 0 },
  { pod_name: 'location-service-pod-7d4f9b-542', service: 'location-service', port: 8006, status: 'Running', cpu: '35m', mem: '95MB', node: 'k8s-worker-node-2', ip: '10.244.6.121', restarts: 0 },
  { pod_name: 'notification-service-pod-7d4f9b-851', service: 'notification-service', port: 8007, status: 'Running', cpu: '28m', mem: '88MB', node: 'k8s-worker-node-3', ip: '10.244.4.190', restarts: 0 },
  { pod_name: 'api-gateway-pod-7d4f9b-267', service: 'api-gateway', port: 8000, status: 'Running', cpu: '65m', mem: '160MB', node: 'k8s-worker-node-1', ip: '10.244.9.45', restarts: 0 },
];

export const AdminSrePortal = () => {
  const [pods, setPods] = useState(BASE_PODS);
  const [activeFault, setActiveFault] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [agentStep, setAgentStep] = useState('IDLE');
  const [logs, setLogs] = useState([
    { time: '22:15:00', level: 'INFO', msg: 'Kubernetes GKE cluster state synchronized: 8/8 pods Ready in namespace "ride-hailing-system".' },
    { time: '22:15:02', level: 'INFO', msg: 'Horizontal Pod Autoscaler (HPA) telemetry monitoring loop active. Target CPU: 75%.' },
    { time: '22:15:05', level: 'INFO', msg: 'LangGraph Autonomous SRE Agent initialized. Zero active anomalies.' },
  ]);

  // Inject chaos on targeted microservice
  const injectFault = (faultKey) => {
    const spec = FAULT_DEFINITIONS[faultKey];
    if (!spec) return;

    setActiveFault({ key: faultKey, ...spec });
    setCountdown(spec.duration);
    setAgentStep('ANOMALY');

    // Share fault state via localStorage so Passenger/Driver portals react immediately!
    localStorage.setItem('rydex_active_chaos', JSON.stringify({
      fault_type: faultKey,
      service: spec.service,
      expires_at: Date.now() + (spec.duration * 1000)
    }));

    // Update pod state for the targeted service
    setPods(prev => prev.map(p => {
      if (p.service === spec.service) {
        let newStatus = 'Degraded';
        if (faultKey === 'SERVICE_CRASH') newStatus = 'CrashLoopBackOff';
        if (faultKey === 'MEMORY_LEAK') newStatus = 'OOMKilled';
        if (faultKey === 'TRAFFIC_OVERLOAD') newStatus = 'Scaling (3 Replicas)';
        if (faultKey === 'DB_BOTTLENECK') newStatus = 'Lock Contention';
        if (faultKey === 'CPU_SPIKE') newStatus = 'CPU Throttled';
        if (faultKey === 'NETWORK_PARTITION') newStatus = 'Partitioned';
        return { ...p, status: newStatus, restarts: p.restarts + 1 };
      }
      return p;
    }));

    const now = new Date().toLocaleTimeString();
    setLogs(prev => [
      { time: now, level: 'CRITICAL', msg: `[FAULT DETECTED] ${spec.label} on service "${spec.service}". Triggering SRE agent.` },
      { time: now, level: 'WARN', msg: `[RCA ROOT CAUSE] ${spec.impact}` },
      { time: now, level: 'ACTION', msg: `[REMEDIATION] ${spec.kubectlCmd}` },
      ...prev.slice(0, 10)
    ]);

    // Progressive agent flow steps
    setTimeout(() => setAgentStep('RCA'), 800);
    setTimeout(() => setAgentStep('PLANNER'), 1800);
    setTimeout(() => setAgentStep('EXECUTION'), 2800);
  };

  // Countdown timer and autonomous self-healing recovery
  useEffect(() => {
    if (countdown <= 0) {
      if (activeFault) {
        // Pod healed back to Running
        setPods(prev => prev.map(p => ({ ...p, status: 'Running' })));
        setAgentStep('VALIDATED');
        localStorage.removeItem('rydex_active_chaos');

        const now = new Date().toLocaleTimeString();
        setLogs(prev => [
          { time: now, level: 'SUCCESS', msg: `[AUTONOMOUSLY HEALED] SRE Agent verified ${activeFault.service} healthy. Restored in ${activeFault.duration}s.` },
          ...prev.slice(0, 10)
        ]);
        setActiveFault(null);
        setTimeout(() => setAgentStep('IDLE'), 2500);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, Math.round((prev - 0.2) * 10) / 10));
    }, 200);

    return () => clearInterval(timer);
  }, [countdown, activeFault]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070A0F] text-slate-100 p-3 sm:p-5 md:p-6 space-y-5 pb-28 font-sans">
      {/* Header Banner */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFDE00] text-black flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(255,222,0,0.4)] shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-white tracking-wide">
                SRE Operations Command Center
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                GKE PRODUCTION
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Autonomous Self-Healing Kubernetes Infrastructure for Rydex Microservices
            </p>
          </div>
        </div>

        {/* Navigation Switchers to Passenger & Driver */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => (window.location.hash = 'passenger')}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-amber-300 hover:text-white transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <span>Passenger App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => (window.location.hash = 'driver')}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-emerald-400 hover:text-white transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <span>Captain App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cluster Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CLUSTER HEALTH</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {activeFault ? '87.5%' : '100%'}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${activeFault ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{activeFault ? 'Self-Healing Active' : 'All Systems Nominal'}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>K8S PODS RUNNING</span>
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
            Target SLA: &lt; 15s (Zero Downtime)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SRE AGENT</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">LangGraph</div>
          <div className="text-[10px] text-emerald-400 mt-1">
            Autonomous Multi-Agent Loop
          </div>
        </div>
      </div>

      {/* Active Incident Countdown Banner */}
      {activeFault && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/70 font-mono shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <span>{activeFault.label}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
                    TARGET: {activeFault.service}
                  </span>
                </div>
                <div className="text-xs text-amber-300/80 mt-1">
                  Impact: {activeFault.impact}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-amber-400 uppercase font-bold">Autonomous Healing In</div>
                <div className="text-2xl font-black text-amber-200">{countdown.toFixed(1)}s</div>
              </div>
              <div className="w-28 bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(countdown / activeFault.duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LangGraph Multi-Agent SRE Pipeline */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Autonomous SRE Agent Healing Pipeline
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">LangGraph State Machine</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className={`p-2.5 rounded-xl border transition-all ${
            agentStep !== 'IDLE' ? 'bg-blue-500/20 border-blue-400 text-blue-200 font-bold' : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="text-[10px] text-slate-400">STAGE 1</div>
            <div className="mt-0.5">Telemetry Monitor</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            agentStep === 'ANOMALY' ? 'bg-rose-500/30 border-rose-400 text-rose-200 font-bold animate-pulse' :
            agentStep !== 'IDLE' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="text-[10px] text-slate-400">STAGE 2</div>
            <div className="mt-0.5">Anomaly Detected</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            agentStep === 'RCA' ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold animate-pulse' :
            ['PLANNER', 'EXECUTION', 'VALIDATED'].includes(agentStep) ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="text-[10px] text-slate-400">STAGE 3</div>
            <div className="mt-0.5">Root Cause (RCA)</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            agentStep === 'PLANNER' ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold animate-pulse' :
            ['EXECUTION', 'VALIDATED'].includes(agentStep) ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="text-[10px] text-slate-400">STAGE 4</div>
            <div className="mt-0.5">Remediation Plan</div>
          </div>

          <div className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border transition-all ${
            agentStep === 'EXECUTION' ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold animate-pulse' :
            agentStep === 'VALIDATED' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="text-[10px] text-slate-400">STAGE 5</div>
            <div className="mt-0.5">Kubectl Restored ✓</div>
          </div>
        </div>
      </div>

      {/* Chaos Injection Lab — ALL 6 FAULTS WITH INDIVIDUAL SERVICE TARGETS */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Chaos Engineering Fault Injection Lab (6 Fault Types)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">Click any failure to test self-healing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(FAULT_DEFINITIONS).map(([key, spec]) => {
            const isThisActive = activeFault?.key === key;
            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isThisActive
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      {spec.shortLabel}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10">
                      Heals: {spec.duration}s
                    </span>
                  </div>

                  <div className="text-[11px] text-blue-300 font-mono mt-1">
                    Target: <span className="underline font-bold">{spec.service}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                    {spec.impact}
                  </div>
                </div>

                <button
                  onClick={() => injectFault(key)}
                  disabled={countdown > 0}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow ${
                    isThisActive
                      ? 'bg-amber-400 text-black animate-pulse'
                      : 'bg-white/10 hover:bg-white/20 text-white active:scale-95 disabled:opacity-40'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isThisActive ? `Healing (${countdown.toFixed(1)}s)...` : `Simulate ${spec.shortLabel}`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Kubernetes Pods Table — ALL 8 PODS FULLY VISIBLE */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Kubernetes Pod Orchestration (kubectl get pods -n ride-hailing-system)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">Total: {pods.length} Microservices</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Pod Name</th>
                <th className="py-2.5 px-3">Microservice</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Node</th>
                <th className="py-2.5 px-3">Cluster IP</th>
                <th className="py-2.5 px-3">CPU</th>
                <th className="py-2.5 px-3">Memory</th>
                <th className="py-2.5 px-3 text-right">Restarts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {pods.map((p) => {
                const isFailed = p.status !== 'Running';
                return (
                  <tr
                    key={p.pod_name}
                    className={`transition-colors ${
                      isFailed ? 'bg-rose-950/40 text-rose-200' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isFailed ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                      <span>{p.pod_name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-300">
                      {p.service} <span className="text-[10px] text-slate-500">(:{p.port})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isFailed
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{p.node}</td>
                    <td className="py-2.5 px-3 text-slate-400">{p.ip}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.cpu}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.mem}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      {p.restarts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SRE Agent Audit Terminal Logs */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-lg space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Autonomous SRE Agent Audit Log Stream
            </h2>
          </div>
          <span className="text-[10px] text-slate-500">Live Remediation Telemetry</span>
        </div>

        <div className="bg-[#05070B] p-3 rounded-xl border border-white/5 space-y-1.5 max-h-48 overflow-y-auto">
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed">
              <span className="text-slate-500 shrink-0">[{l.time}]</span>
              <span
                className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                  l.level === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300'
                    : l.level === 'WARN'
                    ? 'bg-amber-500/20 text-amber-300'
                    : l.level === 'ACTION'
                    ? 'bg-purple-500/20 text-purple-300'
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
