import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Cpu,
  Layers,
  TrendingUp,
  RefreshCw,
  Zap,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Clock,
  Flame,
  ArrowRight,
  Database,
  Radio,
  FileText,
  Search,
  Sliders,
  Play,
  RotateCcw,
  Check,
  TrendingDown
} from 'lucide-react';

export const FAULT_SPECS_EXPANDED = {
  DB_BOTTLENECK: {
    key: 'DB_BOTTLENECK',
    service: 'auth-service',
    port: 8001,
    name: '🔒 PostgreSQL Lock Contention',
    shortName: 'DB Lock',
    duration: 9.4,
    complexity: 'COMPLEX',
    symptom: 'Login on #login fails with 500 Database Connection Pool Exhausted (100 max reached). Driver IMPS cashout locked.',
    containment: 'Browsing, map navigation, and ride booking continue normally.',
    rca: 'RCA Agent identified orphaned idle transactions holding row-level locks on relational "users" and "trips" tables.',
    plan: 'Autonomous SRE kills orphaned backend PIDs, resets connection pooler, and clears table contention.',
    kubectl: 'kubectl exec -it postgres-0 -- pkill -u postgres -f "idle in transaction"',
    validation: 'Active DB connections restored to 14/100. Auth authentication latency normalized to 28ms.',
    playbookId: 'KB-AUTH-04',
    accuracy: '96.0%',
    timesApplied: 11
  },
  TRAFFIC_OVERLOAD: {
    key: 'TRAFFIC_OVERLOAD',
    service: 'ride-service',
    port: 8002,
    name: '🚦 Ingress Traffic Surge',
    shortName: 'Traffic Surge',
    duration: 5.5,
    complexity: 'EASY-MED',
    symptom: 'Booking a Bike Taxi fails with 429 Too Many Requests (Ingress rate limit exceeded on Bike queue).',
    containment: 'Booking Auto, Cab, or Parcel succeeds! Background polling stays active.',
    rca: 'Ingress Envoy rate-limiter triggered on Bike Taxi route; Auto & Cab traffic isolated and preserved.',
    plan: 'Autonomous SRE triggers Horizontal Pod Autoscaler (HPA 1 -> 3 replicas) and flushes queue buffers.',
    kubectl: 'kubectl scale deployment ride-deployment --replicas=3 -n ride-hailing-system',
    validation: 'Replica count scaled to 3. Ingress buffer drain complete. 100% dispatch requests passing.',
    playbookId: 'KB-RIDE-02',
    accuracy: '100.0%',
    timesApplied: 9
  },
  SERVICE_CRASH: {
    key: 'SERVICE_CRASH',
    service: 'driver-service',
    port: 8003,
    name: '💥 Container CrashLoopBackOff',
    shortName: 'Crash GPS',
    duration: 7.0,
    complexity: 'MEDIUM',
    symptom: 'Driver duty toggle fails with 503 Service Unavailable (Pod in CrashLoopBackOff). GPS radar pulses red.',
    containment: 'Passenger portal, fare pricing, and login work without issue.',
    rca: 'Null pointer exception on unhandled missing driver telemetry packet in worker thread caused SIGSEGV exit.',
    plan: 'Kubernetes pod force termination triggers clean container rebuild from Docker registry image.',
    kubectl: 'kubectl delete pod driver-service-pod-990 --grace-period=0 -n ride-hailing-system',
    validation: 'Pod scheduled on worker node 2. Container liveness & readiness probes returned 200 OK.',
    playbookId: 'KB-DRV-03',
    accuracy: '100.0%',
    timesApplied: 6
  },
  CPU_SPIKE: {
    key: 'CPU_SPIKE',
    service: 'pricing-service',
    port: 8005,
    name: '⚡ CPU Core Saturation',
    shortName: 'CPU Spike',
    duration: 4.2,
    complexity: 'EASY',
    symptom: 'Dynamic fare computation throttled (504 Gateway Timeout). Warning banner shown with fallback baseline fares.',
    containment: 'Driver portal, maps, and ride booking remain operational.',
    rca: 'RCA Agent identified O(N^2) recursive surge pricing matchmaking thread contention during peak hour demand.',
    plan: 'Horizontal Pod Autoscaler (HPA) rebalances compute quota and scales deployment from 1 to 2 replicas.',
    kubectl: 'kubectl scale deployment pricing-deployment --replicas=2 -n ride-hailing-system',
    validation: 'Pricing latency normalized to 38ms. CFS throttle dropped to 0%. HTTP 200 OK.',
    playbookId: 'KB-PRICE-01',
    accuracy: '98.5%',
    timesApplied: 14
  },
  NETWORK_PARTITION: {
    key: 'NETWORK_PARTITION',
    service: 'location-service',
    port: 8006,
    name: '🌐 Network Partition (Packet Loss)',
    shortName: 'Net Partition',
    duration: 8.2,
    complexity: 'MED-COMPLEX',
    symptom: 'Dispatch connection shows 504: 45% packet drop warning.',
    containment: 'Fares, logins, receipts, and order acceptance function normally.',
    rca: 'Envoy service mesh sidecar routing table desynchronized on worker node 2 overlay network.',
    plan: 'Rolling restart of Envoy proxy daemonset and automatic route table re-synchronization.',
    kubectl: 'kubectl rollout restart daemonset/envoy-proxy-network -n ride-hailing-system',
    validation: 'Overlay network socket remounted. Packet loss reduced to 0.02%. Telemetry latency 42ms.',
    playbookId: 'KB-LOC-05',
    accuracy: '94.2%',
    timesApplied: 8
  },
  MEMORY_LEAK: {
    key: 'MEMORY_LEAK',
    service: 'trip-service',
    port: 8004,
    name: '🧠 Unbounded Heap Memory Leak',
    shortName: 'Memory Leak',
    duration: 10.0,
    complexity: 'COMPLEX',
    symptom: 'Driver Instant Cashout fails with 500 OOMKilled (Exit Code 137).',
    containment: 'Captain online status, navigation, and passenger rides work normally.',
    rca: 'Unbounded in-memory active trip object cache holding uncollected heap references.',
    plan: 'Canary automated rollback to stable revision v1.1.9-stable and cache eviction cycle purge.',
    kubectl: 'kubectl rollout undo deployment/trip-deployment -n ride-hailing-system',
    validation: 'Deployment rolled back to revision 1 (v1.1.9-stable). Memory stable at 128MB. Payouts nominal.',
    playbookId: 'KB-TRIP-02',
    accuracy: '98.5%',
    timesApplied: 14
  }
};

const BASE_PODS = [
  { pod_name: 'auth-service-pod-7d4f9b-256', service: 'auth-service', port: 8001, status: 'Running', health: 100, cpu: '45m', cpu_pct: 18.2, mem: '120MB', latency: '28ms', error_rate: '0.0%', node: 'k8s-worker-node-3', ip: '10.244.2.137', restarts: 0 },
  { pod_name: 'ride-service-pod-7d4f9b-586', service: 'ride-service', port: 8002, status: 'Running', health: 100, cpu: '52m', cpu_pct: 22.1, mem: '135MB', latency: '42ms', error_rate: '0.0%', node: 'k8s-worker-node-1', ip: '10.244.2.132', restarts: 0 },
  { pod_name: 'driver-service-pod-7d4f9b-990', service: 'driver-service', port: 8003, status: 'Running', health: 100, cpu: '38m', cpu_pct: 16.4, mem: '110MB', latency: '35ms', error_rate: '0.0%', node: 'k8s-worker-node-2', ip: '10.244.7.21', restarts: 0 },
  { pod_name: 'trip-service-pod-7d4f9b-962', service: 'trip-service', port: 8004, status: 'Running', health: 100, cpu: '60m', cpu_pct: 26.5, mem: '148MB', latency: '48ms', error_rate: '0.0%', node: 'k8s-worker-node-1', ip: '10.244.9.205', restarts: 0 },
  { pod_name: 'pricing-service-pod-7d4f9b-894', service: 'pricing-service', port: 8005, status: 'Running', health: 100, cpu: '41m', cpu_pct: 19.0, mem: '115MB', latency: '32ms', error_rate: '0.0%', node: 'k8s-worker-node-3', ip: '10.244.3.103', restarts: 0 },
  { pod_name: 'location-service-pod-7d4f9b-542', service: 'location-service', port: 8006, status: 'Running', health: 100, cpu: '35m', cpu_pct: 15.8, mem: '95MB', latency: '24ms', error_rate: '0.0%', node: 'k8s-worker-node-2', ip: '10.244.6.121', restarts: 0 },
  { pod_name: 'notification-service-pod-7d4f9b-851', service: 'notification-service', port: 8007, status: 'Running', health: 100, cpu: '28m', cpu_pct: 12.3, mem: '88MB', latency: '19ms', error_rate: '0.0%', node: 'k8s-worker-node-3', ip: '10.244.4.190', restarts: 0 },
  { pod_name: 'api-gateway-pod-7d4f9b-267', service: 'api-gateway', port: 8000, status: 'Running', health: 100, cpu: '65m', cpu_pct: 28.4, mem: '160MB', latency: '15ms', error_rate: '0.0%', node: 'k8s-worker-node-1', ip: '10.244.9.45', restarts: 0 },
];

const INITIAL_INCIDENTS = [
  { id: 'INC-2026-9041', service: 'trip-service', error: 'UNBOUNDED_HEAP_LEAK', detectedAt: '22:10:14', resolvedAt: '22:10:24', mttr: '10.0s', action: 'Canary Rollback to v1.1.9-stable', status: 'RESOLVED' },
  { id: 'INC-2026-9038', service: 'auth-service', error: 'POSTGRES_LOCK_CONTENTION', detectedAt: '21:45:20', resolvedAt: '21:45:29', mttr: '9.4s', action: 'PostgreSQL Lock Purge & Pool Recycled', status: 'RESOLVED' },
  { id: 'INC-2026-9032', service: 'driver-service', error: 'CONTAINER_CRASH_LOOP', detectedAt: '20:15:02', resolvedAt: '20:15:09', mttr: '7.0s', action: 'Kubernetes Pod Force Delete & Reinstantiation', status: 'RESOLVED' },
  { id: 'INC-2026-9029', service: 'ride-service', error: 'INGRESS_TRAFFIC_SURGE', detectedAt: '18:32:11', resolvedAt: '18:32:16', mttr: '5.5s', action: 'HPA Autoscaled Replicas (1 -> 3)', status: 'RESOLVED' },
  { id: 'INC-2026-9025', service: 'pricing-service', error: 'CPU_CORE_SATURATION', detectedAt: '16:04:40', resolvedAt: '16:04:44', mttr: '4.2s', action: 'CFS Quota Rebalance & Worker Scale', status: 'RESOLVED' },
];

export const AdminSrePortal = () => {
  const [activeNav, setActiveNav] = useState('overview'); // 'overview' | 'microservices' | 'incidents' | 'rca' | 'chaos' | 'kb'
  const [pods, setPods] = useState(BASE_PODS);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [activeFault, setActiveFault] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [agentStep, setAgentStep] = useState('monitoring'); // 'monitoring' | 'anomaly' | 'rca' | 'planner' | 'execution' | 'validation' | 'healed'
  const [liveReasoningText, setLiveReasoningText] = useState({
    stage: 'Monitoring Agent [ACTIVE]',
    symptom: 'All synthetic probes passing. Target p99 latency 42ms nominal. Zero active SLA violations.',
    rca: 'No anomalies detected. Continuous trace analysis across all 8 microservices indicates nominal dependency graph.',
    plan: 'Maintain background Prometheus polling loop (1.5s interval). Keep HPA autoscaling thresholds armed.',
    kubectl: 'kubectl get pods -n ride-hailing-system -o wide',
    metrics: { cpu: '18.5%', memory: '128MB', latency: '42ms', errorRate: '0.0%' }
  });

  // Inject chaos on targeted microservice
  const handleInjectFault = (faultKey) => {
    const spec = FAULT_SPECS_EXPANDED[faultKey];
    if (!spec) return;

    setActiveFault({ ...spec });
    setCountdown(spec.duration);
    setAgentStep('anomaly');

    const nowStr = new Date().toLocaleTimeString();

    // Add to live Incidents list
    const newInc = {
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      service: spec.service,
      error: spec.key,
      detectedAt: nowStr,
      resolvedAt: 'Pending...',
      mttr: `${spec.duration}s (In Progress)`,
      action: spec.plan,
      status: 'REMEDIATING'
    };
    setIncidents(prev => [newInc, ...prev]);

    // Live Reasoning Text Update
    setLiveReasoningText({
      stage: 'Anomaly Agent [ALERT]',
      symptom: spec.symptom,
      rca: spec.rca,
      plan: spec.plan,
      kubectl: spec.kubectl,
      metrics: {
        cpu: faultKey === 'CPU_SPIKE' ? '98.4% (CRITICAL)' : '24.2%',
        memory: faultKey === 'MEMORY_LEAK' ? '512MB / 512MB (OOM)' : '140MB',
        latency: faultKey === 'NETWORK_PARTITION' ? '1,420ms (504)' : '54ms',
        errorRate: faultKey === 'DB_BOTTLENECK' ? '100% on /auth' : (faultKey === 'TRAFFIC_OVERLOAD' ? '429 on /rides/bike' : '12.4%')
      }
    });

    // Save to shared localStorage for live multi-page cross-talk
    localStorage.setItem('rydex_active_chaos', JSON.stringify({
      fault_type: faultKey,
      service: spec.service,
      expires_at: Date.now() + (spec.duration * 1000),
      duration: spec.duration
    }));
    window.dispatchEvent(new Event('storage'));

    // Update pod state for targeted service
    setPods(prev => prev.map(p => {
      if (p.service === spec.service) {
        let newStatus = 'Degraded';
        if (faultKey === 'SERVICE_CRASH') newStatus = 'CrashLoopBackOff';
        if (faultKey === 'MEMORY_LEAK') newStatus = 'OOMKilled';
        if (faultKey === 'TRAFFIC_OVERLOAD') newStatus = 'Scaling (3 Replicas)';
        if (faultKey === 'DB_BOTTLENECK') newStatus = 'Lock Contention';
        if (faultKey === 'CPU_SPIKE') newStatus = 'CPU Throttled';
        if (faultKey === 'NETWORK_PARTITION') newStatus = 'Partitioned';
        return { ...p, status: newStatus, health: 0, restarts: p.restarts + 1 };
      }
      return p;
    }));
  };

  // Live countdown timer and autonomous recovery
  useEffect(() => {
    if (!activeFault || countdown <= 0) return;

    const elapsed = activeFault.duration - countdown;

    // Transition steps based on elapsed seconds
    if (elapsed > 1.2 && elapsed < 2.5) {
      setAgentStep('rca');
    } else if (elapsed >= 2.5 && elapsed < 4.0) {
      setAgentStep('planner');
    } else if (elapsed >= 4.0 && elapsed < activeFault.duration - 0.8) {
      setAgentStep('execution');
    } else if (elapsed >= activeFault.duration - 0.8) {
      setAgentStep('validation');
    }

    const t = setInterval(() => {
      setCountdown((prev) => {
        const next = Math.max(0, Math.round((prev - 0.2) * 10) / 10);
        if (next === 0) {
          // 100% FIXED & HEALED
          setPods(curr => curr.map(p => ({ ...p, status: 'Running', health: 100 })));
          setAgentStep('healed');
          localStorage.removeItem('rydex_active_chaos');
          window.dispatchEvent(new Event('storage'));

          const nowStr = new Date().toLocaleTimeString();
          setIncidents(prevList => prevList.map(inc => {
            if (inc.status === 'REMEDIATING') {
              return { ...inc, resolvedAt: nowStr, mttr: `${activeFault.duration}s`, status: 'RESOLVED' };
            }
            return inc;
          }));

          setLiveReasoningText({
            stage: 'Validation Agent [200 OK - RESOLVED]',
            symptom: `Resolution verified: ${activeFault.validation}`,
            rca: `Root cause neutralized. Cluster health restored to 100%. Knowledge Base playbook confidence updated.`,
            plan: `Playbook marked as successfully applied. Auto-healing SLA achieved in ${activeFault.duration}s.`,
            kubectl: 'kubectl get pods -n ride-hailing-system (All 8 Running)',
            metrics: { cpu: '18.5%', memory: '128MB', latency: '42ms', errorRate: '0.0%' }
          });

          setTimeout(() => {
            setActiveFault(null);
            setAgentStep('monitoring');
            setLiveReasoningText({
              stage: 'Monitoring Agent [ACTIVE]',
              symptom: 'All synthetic probes passing. Target p99 latency 42ms nominal. Zero active SLA violations.',
              rca: 'No anomalies detected. Continuous trace analysis across all 8 microservices indicates nominal dependency graph.',
              plan: 'Maintain background Prometheus polling loop (1.5s interval). Keep HPA autoscaling thresholds armed.',
              kubectl: 'kubectl get pods -n ride-hailing-system -o wide',
              metrics: { cpu: '18.5%', memory: '128MB', latency: '42ms', errorRate: '0.0%' }
            });
          }, 3500);
        }
        return next;
      });
    }, 200);

    return () => clearInterval(t);
  }, [countdown, activeFault]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0A0D14] text-slate-100 font-sans select-none">
      {/* Left Sidebar (Image 3 Navigation) */}
      <aside className="w-56 md:w-64 bg-[#080B11] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Operations & Telemetry
          </div>
        </div>

        {/* 6 Sidebar Navigation Views */}
        <nav className="p-2 space-y-1 font-mono text-xs flex-1">
          <button
            onClick={() => setActiveNav('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'overview'
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('microservices')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'microservices'
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Microservice Monitor</span>
          </button>

          <button
            onClick={() => setActiveNav('incidents')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'incidents'
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Incident Management</span>
          </button>

          <button
            onClick={() => setActiveNav('rca')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'rca'
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Agent Reasoning Flow</span>
          </button>

          <button
            onClick={() => setActiveNav('chaos')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'chaos'
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Chaos Simulation Lab</span>
          </button>

          <button
            onClick={() => setActiveNav('kb')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'kb'
                ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>SRE Knowledge Base</span>
          </button>
        </nav>

        {/* Target Workload Widget */}
        <div className="p-3 m-2 rounded-xl bg-white/5 border border-white/10 font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>TARGET WORKLOAD</span>
            <span className="text-emerald-400 font-bold">8 SERVICES</span>
          </div>
          <div className="text-[11px] font-bold text-white mt-1">
            Ride-Hailing Cloud Microservices
          </div>
          <div className="text-[9px] text-slate-400 mt-1 leading-tight">
            Auth, Ride, Driver, Trip, Pricing, Location, Notification & Gateway
          </div>
        </div>
      </aside>

      {/* Main Operations Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-28">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Cluster Operations Overview</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                AUTONOMOUS HEALING ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time telemetry, Kubernetes pod runtime status, and AI SRE agent state
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setPods([...BASE_PODS]);
                setActiveFault(null);
                setCountdown(0);
                setAgentStep('monitoring');
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-slate-500 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => (window.location.hash = 'passenger')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1"
            >
              <span>Passenger App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => (window.location.hash = 'driver')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:text-white text-xs font-mono font-bold flex items-center gap-1"
            >
              <span>Captain App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>CLUSTER HEALTH INDEX</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {activeFault ? '87.5%' : '100%'}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-400">{activeFault ? '7/8 Services Nominal' : '8/8 Services Nominal'}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeFault ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {activeFault ? '↗ DEGRADED' : '↗ OPTIMAL'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ACTIVE KUBERNETES PODS</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {activeFault?.key === 'TRAFFIC_OVERLOAD' ? '10 Pods' : '8 Pods'}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-400">ALL Deployments Running</span>
              <span className="text-blue-400 font-bold">↘ 100% Scheduled</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>AVERAGE CPU LOAD</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {activeFault?.key === 'CPU_SPIKE' ? '98.4%' : '18.5%'}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-400">Cluster Core Utilization</span>
              <span className={`font-bold ${activeFault?.key === 'CPU_SPIKE' ? 'text-rose-400' : 'text-blue-400'}`}>
                {activeFault?.key === 'CPU_SPIKE' ? '↗ High Compute' : '↗ Normal'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>THROUGHPUT & LATENCY</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              420 <span className="text-sm font-normal text-slate-400">RPS</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-400">Avg Latency: 45ms</span>
              <span className="text-emerald-400 font-bold">↗ SLA Compliant</span>
            </div>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW DASHBOARD */}
        {activeNav === 'overview' && (
          <div className="space-y-6">
            {/* LangGraph 7-Node State Graph */}
            <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    LangGraph Multi-Agent Orchestration Flow
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                    COMPILED STATE GRAPH
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Active State Engine</span>
              </div>

              {/* 7 Agent Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className={`p-3 rounded-xl border text-center relative ${agentStep === 'monitoring' ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {agentStep === 'monitoring' && <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1 animate-pulse">ACTIVE</div>}
                  <Activity className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                  <div className="font-bold text-xs text-white">Monitoring Agent</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Prometheus & Ingress</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative ${agentStep === 'anomaly' ? 'bg-rose-600/20 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {agentStep === 'anomaly' && <div className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1 animate-ping">BREACH</div>}
                  <AlertTriangle className="w-5 h-5 mx-auto text-rose-400 mb-1" />
                  <div className="font-bold text-xs text-white">Anomaly Agent</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Z-Score & Pattern Match</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative ${agentStep === 'rca' ? 'bg-amber-600/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {agentStep === 'rca' && <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">REASONING</div>}
                  <Search className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                  <div className="font-bold text-xs text-white">Root Cause Agent</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dependency & Trace Graph</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative ${agentStep === 'planner' ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {agentStep === 'planner' && <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-1">PLANNING</div>}
                  <Sliders className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                  <div className="font-bold text-xs text-white">Recovery Planner</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Strategy & K8s Command</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative ${agentStep === 'execution' ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {agentStep === 'execution' && <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">EXECUTING</div>}
                  <Terminal className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
                  <div className="font-bold text-xs text-white">Execution Agent</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Kubectl Action Controller</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative ${agentStep === 'validation' || agentStep === 'healed' ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {(agentStep === 'validation' || agentStep === 'healed') && <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">VERIFIED</div>}
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                  <div className="font-bold text-xs text-white">Validation Agent</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Health Probe & SLA Check</div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center text-slate-400">
                  <Database className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                  <div className="font-bold text-xs text-white">Knowledge Base</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Playbook Memory & State</div>
                </div>
              </div>
            </div>

            {/* LIVE RCA & REASONING PANEL */}
            <div className="p-4 rounded-xl bg-[#080C14] border border-blue-500/30 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                  <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                    LIVE RCA & SRE REASONING CONSOLE [{liveReasoningText.stage}]
                  </span>
                </div>
                {countdown > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    HEALING COUNTDOWN: {countdown.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Live Diagnostic Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">SYMPTOM & ANOMALY</div>
                  <div className="text-white font-semibold">{liveReasoningText.symptom}</div>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">ROOT CAUSE ANALYSIS (RCA)</div>
                  <div className="text-amber-200">{liveReasoningText.rca}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs">
                <div className="text-slate-400 text-[10px] uppercase font-bold">REMEDIATION STRATEGY & COMMAND</div>
                <div className="text-purple-200">{liveReasoningText.plan}</div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400">
                  <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{liveReasoningText.kubectl}</span>
                </div>
              </div>
            </div>

            {/* SVG Telemetry Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
              <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span>Cluster CPU & Memory Telemetry (%)</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-blue-400">● CPU</span>
                    <span className="text-indigo-400">● Memory</span>
                  </div>
                </div>
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#1F2937" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#1F2937" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#1F2937" strokeDasharray="3 3" />
                    <path d="M0,110 Q100,105 200,112 T350,108 T500,110 L500,160 L0,160 Z" fill="#6366F1" fillOpacity="0.25" />
                    <path d="M0,110 Q100,105 200,112 T350,108 T500,110" fill="none" stroke="#6366F1" strokeWidth="2" />
                    <path d={activeFault?.key === 'CPU_SPIKE' ? "M0,120 Q100,115 250,15 T400,20 T500,25 L500,160 L0,160 Z" : "M0,120 Q100,115 200,122 T350,116 T500,118 L500,160 L0,160 Z"} fill="#3B82F6" fillOpacity="0.3" className="transition-all duration-500" />
                    <path d={activeFault?.key === 'CPU_SPIKE' ? "M0,120 Q100,115 250,15 T400,20 T500,25" : "M0,120 Q100,115 200,122 T350,116 T500,118"} fill="none" stroke="#3B82F6" strokeWidth="2.5" className="transition-all duration-500" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>10:00</span><span>10:05</span><span>10:10</span><span>10:15</span><span>10:20</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span>API Ingress Throughput (RPS)</span>
                  <span className="text-emerald-400 text-[11px]">OpenTelemetry Gateway</span>
                </div>
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#1F2937" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#1F2937" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#1F2937" strokeDasharray="3 3" />
                    <path d={activeFault?.key === 'TRAFFIC_OVERLOAD' ? "M0,85 Q120,80 240,10 T380,15 T500,20 L500,160 L0,160 Z" : "M0,80 Q120,75 240,82 T380,78 T500,80 L500,160 L0,160 Z"} fill="#10B981" fillOpacity="0.25" className="transition-all duration-500" />
                    <path d={activeFault?.key === 'TRAFFIC_OVERLOAD' ? "M0,85 Q120,80 240,10 T380,15 T500,20" : "M0,80 Q120,75 240,82 T380,78 T500,80"} fill="none" stroke="#10B981" strokeWidth="2.5" className="transition-all duration-500" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>10:00</span><span>10:05</span><span>10:10</span><span>10:15</span><span>10:20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MICROSERVICE MONITOR */}
        {activeNav === 'microservices' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Microservices Telemetry & Pod Health Matrix
              </h2>
              <span className="text-xs text-slate-400">Total: 8 Microservices</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pods.map((p) => {
                const isFailed = p.status !== 'Running';
                return (
                  <div key={p.service} className={`p-4 rounded-xl border transition-all ${
                    isFailed ? 'bg-rose-950/40 border-rose-600/70 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-[#0F1420] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{p.service}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFailed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 truncate">{p.pod_name}</div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">CPU LOAD</div>
                        <div className="font-bold text-white">{isFailed && activeFault?.key === 'CPU_SPIKE' ? '98.4%' : `${p.cpu_pct}%`}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">MEMORY</div>
                        <div className="font-bold text-white">{isFailed && activeFault?.key === 'MEMORY_LEAK' ? '512MB' : p.mem}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">LATENCY</div>
                        <div className="font-bold text-white">{isFailed && activeFault?.key === 'NETWORK_PARTITION' ? '1,420ms' : p.latency}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">RESTARTS</div>
                        <div className="font-bold text-amber-400">{p.restarts}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: INCIDENT MANAGEMENT */}
        {activeNav === 'incidents' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Incident Tracking & Self-Healing Audit Log
              </h2>
              <span className="text-xs text-slate-400">Average MTTR: 6.4s</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0F1420]">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Error Signature</th>
                    <th className="py-3 px-4">Detected At</th>
                    <th className="py-3 px-4">Fixed At</th>
                    <th className="py-3 px-4">Resolution Time (MTTR)</th>
                    <th className="py-3 px-4">Autonomous Remediation</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-white">{inc.id}</td>
                      <td className="py-3 px-4 text-blue-300">{inc.service}</td>
                      <td className="py-3 px-4 text-amber-300 font-semibold">{inc.error}</td>
                      <td className="py-3 px-4 text-slate-400">{inc.detectedAt}</td>
                      <td className="py-3 px-4 text-slate-400">{inc.resolvedAt}</td>
                      <td className="py-3 px-4 font-bold text-amber-400">{inc.mttr}</td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{inc.action}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: AGENT REASONING FLOW (Continuous RCA & Metrics) */}
        {activeNav === 'rca' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Autonomous SRE Continuous RCA Reasoning & Telemetry Metrics
              </h2>
              <span className="text-xs text-blue-400 font-bold">LangGraph Multi-Agent Engine</span>
            </div>

            {/* Continuous Live Steps */}
            <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-4">
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-black/40 border border-blue-500/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div>
                    <div className="font-bold text-white text-xs">Step 1: Ingress Telemetry & Metric Threshold Breach</div>
                    <div className="text-slate-300 text-xs mt-1">
                      Prometheus exporter sampled 1.5s sliding window telemetry: CPU {liveReasoningText.metrics.cpu}, Memory {liveReasoningText.metrics.memory}, Error Rate {liveReasoningText.metrics.errorRate}.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-black/40 border border-rose-500/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div>
                    <div className="font-bold text-white text-xs">Step 2: Anomaly Detection & Statistical Outlier Test</div>
                    <div className="text-slate-300 text-xs mt-1">
                      Z-score calculated at +3.82 standard deviations above historical 24h baseline. Anomaly confirmed on microservice cluster.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-black/40 border border-amber-500/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div>
                    <div className="font-bold text-white text-xs">Step 3: Root Cause Analysis (RCA Dependency Graph)</div>
                    <div className="text-amber-200 text-xs mt-1">
                      {liveReasoningText.rca}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-black/40 border border-purple-500/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div>
                    <div className="font-bold text-white text-xs">Step 4: Knowledge Base Retrieval & Remediation Planning</div>
                    <div className="text-purple-200 text-xs mt-1">
                      {liveReasoningText.plan}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-black/40 border border-emerald-500/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">5</div>
                  <div>
                    <div className="font-bold text-white text-xs">Step 5: Kubectl Execution & Post-Remediation Health Probe</div>
                    <div className="text-emerald-300 text-xs mt-1">
                      {liveReasoningText.kubectl}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: CHAOS SIMULATION LAB */}
        {activeNav === 'chaos' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Chaos Simulation Lab (6 Controlled Failure Types)
              </h2>
              <span className="text-xs text-slate-400">Click to inject failure into targeted service</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(FAULT_SPECS_EXPANDED).map(([key, spec]) => {
                const isThisActive = activeFault?.key === key;
                return (
                  <div key={key} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                    isThisActive ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-[#0F1420] border-white/10'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{spec.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10">
                          Heals: {spec.duration}s
                        </span>
                      </div>

                      <div className="text-[11px] text-blue-300 mt-1">
                        Target: <span className="underline font-bold">{spec.service} (:{spec.port})</span>
                      </div>

                      <div className="text-[11px] text-rose-300/90 mt-2 font-semibold">
                        Symptom: {spec.symptom}
                      </div>

                      <div className="text-[10px] text-emerald-300 mt-2 p-2 rounded bg-black/30 border border-white/5">
                        Containment: {spec.containment}
                      </div>
                    </div>

                    <button
                      onClick={() => handleInjectFault(key)}
                      disabled={countdown > 0}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow ${
                        isThisActive ? 'bg-amber-400 text-black animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white active:scale-95 disabled:opacity-40'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isThisActive ? `Self-Healing in ${countdown.toFixed(1)}s...` : `Simulate ${spec.shortName}`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: SRE KNOWLEDGE BASE (Continuous Learning) */}
        {activeNav === 'kb' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                SRE Continuous Knowledge Base & Learned Playbooks
              </h2>
              <span className="text-xs text-emerald-400">Reinforcement Learning Memory</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
              💡 <strong>Continuous Reinforcement Learning:</strong> When recurring anomalies occur, the LangGraph SRE Agent queries this memory bank to immediately execute the playbook with the highest historical accuracy score without repeating trial-and-error diagnosis.
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0F1420]">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Playbook ID</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Error Signature</th>
                    <th className="py-3 px-4">Root Cause Pattern</th>
                    <th className="py-3 px-4">Learned Recovery Action</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4 text-right">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.values(FAULT_SPECS_EXPANDED).map((kb) => (
                    <tr key={kb.playbookId} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-white">{kb.playbookId}</td>
                      <td className="py-3 px-4 text-blue-300">{kb.service}</td>
                      <td className="py-3 px-4 text-amber-300 font-semibold">{kb.key}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs">{kb.rca}</td>
                      <td className="py-3 px-4 text-purple-300 max-w-xs">{kb.plan}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{kb.accuracy}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">{kb.timesApplied}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
