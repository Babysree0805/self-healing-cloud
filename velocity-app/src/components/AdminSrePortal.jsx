import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Cpu,
  Layers,
  ArrowUpRight,
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
  Settings
} from 'lucide-react';

export const FAULT_DETAILS = {
  CPU_SPIKE: {
    service: 'pricing-service',
    port: 8005,
    name: '⚡ CPU Core Saturation',
    shortName: 'CPU Spike',
    duration: 4.2,
    symptom: '504 Gateway Timeout on dynamic fare calculation. CPU CFS quota > 95%.',
    rca: 'RCA Agent identified O(N^2) recursive surge pricing matchmaking thread contention during peak hour demand.',
    plan: 'Horizontal Pod Autoscaler (HPA) rebalances compute quota and scales deployment from 1 to 2 replicas.',
    kubectl: 'kubectl scale deployment pricing-deployment --replicas=2 -n ride-hailing-system',
    validation: 'Pricing latency normalized to 38ms. CFS throttle dropped to 0%. HTTP 200 OK.',
    stageTimeline: { monitoring: 0.8, anomaly: 1.6, rca: 2.6, planner: 3.4, execution: 4.2 }
  },
  TRAFFIC_OVERLOAD: {
    service: 'ride-service',
    port: 8002,
    name: '🚦 Ingress Traffic Surge',
    shortName: 'Traffic Overload',
    duration: 5.5,
    symptom: '429 Too Many Requests on Bike Taxi dispatch queue (>1,200 RPS burst).',
    rca: 'Ingress Envoy rate-limiter triggered on Bike Taxi route; Auto & Cab traffic isolated and preserved.',
    plan: 'Autonomous SRE triggers Horizontal Pod Autoscaling (HPA 1 -> 3 replicas) and flushes queue buffers.',
    kubectl: 'kubectl scale deployment ride-deployment --replicas=3 -n ride-hailing-system',
    validation: 'Replica count scaled to 3. Ingress buffer drain complete. 100% dispatch requests passing.',
    stageTimeline: { monitoring: 1.0, anomaly: 2.0, rca: 3.2, planner: 4.4, execution: 5.5 }
  },
  SERVICE_CRASH: {
    service: 'driver-service',
    port: 8003,
    name: '💥 Container CrashLoopBackOff',
    shortName: 'Crash GPS',
    duration: 7.0,
    symptom: '503 Service Unavailable on live GPS driver radar. Liveness probe failed 3 consecutive checks.',
    rca: 'Null pointer exception on unhandled missing driver telemetry packet in worker thread caused SIGSEGV exit.',
    plan: 'Kubernetes pod force termination triggers clean container rebuild from Docker registry image.',
    kubectl: 'kubectl delete pod driver-service-pod-990 --grace-period=0 -n ride-hailing-system',
    validation: 'Pod scheduled on worker node 2. Container liveness & readiness probes returned 200 OK.',
    stageTimeline: { monitoring: 1.2, anomaly: 2.5, rca: 4.0, planner: 5.5, execution: 7.0 }
  },
  NETWORK_PARTITION: {
    service: 'location-service',
    port: 8006,
    name: '🌐 Network Partition (Packet Loss)',
    shortName: 'Net Partition',
    duration: 8.2,
    symptom: '45% packet drop on driver geolocation WebSocket stream. Connection timeouts (504).',
    rca: 'Envoy service mesh sidecar routing table desynchronized on worker node 2 overlay network.',
    plan: 'Rolling restart of Envoy proxy daemonset and automatic route table re-synchronization.',
    kubectl: 'kubectl rollout restart daemonset/envoy-proxy-network -n ride-hailing-system',
    validation: 'Overlay network socket remounted. Packet loss reduced to 0.02%. Telemetry latency 42ms.',
    stageTimeline: { monitoring: 1.5, anomaly: 3.2, rca: 5.0, planner: 6.8, execution: 8.2 }
  },
  DB_BOTTLENECK: {
    service: 'auth-service',
    port: 8001,
    name: '🔒 PostgreSQL Lock Contention',
    shortName: 'DB Lock',
    duration: 9.4,
    symptom: '500 Internal Server Error: Connection pool exhausted (max_connections=100 reached). Logins blocked.',
    rca: 'Orphaned transaction locks on relational users table holding open idle database sessions.',
    plan: 'Autonomous SRE kills orphaned backend PIDs, resets connection pooler, and clears table contention.',
    kubectl: 'kubectl exec -it postgres-0 -- pkill -u postgres -f "idle in transaction"',
    validation: 'Active DB connections restored to 14/100. Auth authentication latency normalized to 28ms.',
    stageTimeline: { monitoring: 1.8, anomaly: 3.8, rca: 5.8, planner: 7.8, execution: 9.4 }
  },
  MEMORY_LEAK: {
    service: 'trip-service',
    port: 8004,
    name: '🧠 Unbounded Heap Memory Leak',
    shortName: 'Memory Leak',
    duration: 10.0,
    symptom: 'Pod OOMKilled (Exit Code 137). Memory usage reached 512MB cgroup container limit.',
    rca: 'Unbounded in-memory active trip object cache holding uncollected heap references.',
    plan: 'Canary automated rollback to stable revision v1.1.9-stable and cache eviction cycle purge.',
    kubectl: 'kubectl rollout undo deployment/trip-deployment -n ride-hailing-system',
    validation: 'Deployment rolled back to revision 1 (v1.1.9-stable). Memory stable at 128MB. Payouts nominal.',
    stageTimeline: { monitoring: 2.0, anomaly: 4.2, rca: 6.5, planner: 8.5, execution: 10.0 }
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
  const [activeNav, setActiveNav] = useState('overview'); // 'overview' | 'microservices' | 'incidents' | 'rca' | 'chaos' | 'kb'
  const [pods, setPods] = useState(BASE_PODS);
  const [activeFault, setActiveFault] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [activeAgentStage, setActiveAgentStage] = useState('monitoring'); // 'monitoring' | 'anomaly' | 'rca' | 'planner' | 'execution' | 'validation' | 'healed'
  const [activeReasoning, setActiveReasoning] = useState({
    title: 'Prometheus & OpenTelemetry Ingress Monitoring',
    detail: 'All 8 microservices report healthy synthetic HTTP probes and nominal p99 latencies (SLA 42ms). Zero active anomalies.',
    command: 'kubectl get pods -n ride-hailing-system -o wide',
    agentName: 'Monitoring Agent'
  });

  // Inject chaos on targeted microservice
  const handleInjectFault = (faultKey) => {
    const spec = FAULT_DETAILS[faultKey];
    if (!spec) return;

    setActiveFault({ key: faultKey, ...spec });
    setCountdown(spec.duration);
    setActiveAgentStage('anomaly');
    setActiveReasoning({
      title: `Anomaly Detected on ${spec.service}`,
      detail: spec.symptom,
      command: `kubectl top pod ${spec.service}-pod`,
      agentName: 'Anomaly Agent'
    });

    // Save to shared localStorage for live multi-page cross-talk
    localStorage.setItem('rydex_active_chaos', JSON.stringify({
      fault_type: faultKey,
      service: spec.service,
      expires_at: Date.now() + (spec.duration * 1000)
    }));

    // Update pod status for targeted service
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
  };

  // Live Agent Stage Progression & Countdown
  useEffect(() => {
    if (!activeFault || countdown <= 0) return;

    const elapsed = activeFault.duration - countdown;
    const timeline = activeFault.stageTimeline;

    if (elapsed >= timeline.execution) {
      setActiveAgentStage('validation');
      setActiveReasoning({
        title: `Validation Agent: Health Check Passed (200 OK)`,
        detail: activeFault.validation,
        command: `kubectl rollout status deployment/${activeFault.service.replace('-service', '-deployment')}`,
        agentName: 'Validation Agent'
      });
    } else if (elapsed >= timeline.planner) {
      setActiveAgentStage('execution');
      setActiveReasoning({
        title: `Execution Agent: Applying Kubectl Remediation`,
        detail: `Executing autonomous cloud action: ${activeFault.plan}`,
        command: activeFault.kubectl,
        agentName: 'Execution Agent'
      });
    } else if (elapsed >= timeline.rca) {
      setActiveAgentStage('planner');
      setActiveReasoning({
        title: `Recovery Planner: Remediation Strategy Selected`,
        detail: activeFault.plan,
        command: `cat /etc/sre-playbooks/${activeFault.key.toLowerCase()}.yaml`,
        agentName: 'Recovery Planner'
      });
    } else if (elapsed >= timeline.anomaly) {
      setActiveAgentStage('rca');
      setActiveReasoning({
        title: `Root Cause Agent: Trace Graph Diagnosed`,
        detail: activeFault.rca,
        command: `kubectl logs ${activeFault.service}-pod --tail=50`,
        agentName: 'Root Cause Agent'
      });
    }

    const t = setInterval(() => {
      setCountdown((prev) => {
        const next = Math.max(0, Math.round((prev - 0.2) * 10) / 10);
        if (next === 0) {
          // 100% FIXED & HEALED
          setPods(curr => curr.map(p => ({ ...p, status: 'Running' })));
          setActiveAgentStage('healed');
          localStorage.removeItem('rydex_active_chaos');

          setActiveReasoning({
            title: `Autonomous Self-Healing Completed in ${activeFault.duration}s!`,
            detail: `All 8 Kubernetes microservices nominal. Root cause resolved and validated with zero human intervention.`,
            command: 'kubectl get pods -n ride-hailing-system',
            agentName: 'SRE State Engine'
          });

          setTimeout(() => {
            setActiveFault(null);
            setActiveAgentStage('monitoring');
            setActiveReasoning({
              title: 'Prometheus & OpenTelemetry Ingress Monitoring',
              detail: 'All 8 microservices report healthy synthetic HTTP probes and nominal p99 latencies (SLA 42ms). Zero active anomalies.',
              command: 'kubectl get pods -n ride-hailing-system -o wide',
              agentName: 'Monitoring Agent'
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
      {/* Left Sidebar (Exact layout from Image 3) */}
      <aside className="w-56 md:w-64 bg-[#080B11] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Operations & Telemetry
          </div>
        </div>

        {/* Sidebar Nav Items */}
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

        {/* Target Workload Footer (Exact from Image 3) */}
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
        {/* Header & Status Indicator (Image 3) */}
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
                setActiveAgentStage('monitoring');
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

        {/* Top 4 Metrics Row (Image 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Card 1: Health Index */}
          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg relative">
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
              <span className="text-slate-400">
                {activeFault ? '7/8 Services Nominal' : '8/8 Services Nominal'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                activeFault ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {activeFault ? '↗ DEGRADED' : '↗ OPTIMAL'}
              </span>
            </div>
          </div>

          {/* Card 2: Active Pods */}
          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg relative">
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

          {/* Card 3: CPU Load */}
          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg relative">
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

          {/* Card 4: Throughput & Latency */}
          <div className="p-4 rounded-xl bg-[#0F1420] border border-white/10 shadow-lg relative">
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

        {/* LangGraph Multi-Agent Orchestration Flow (Exact from Image 3) */}
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

          {/* The 7 Agent Cards (Image 3) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Agent 1 */}
            <div className={`p-3 rounded-xl border transition-all text-center relative ${
              activeAgentStage === 'monitoring'
                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {activeAgentStage === 'monitoring' && (
                <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1 animate-pulse">
                  ACTIVE
                </div>
              )}
              <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-1">
                <Activity className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Monitoring Agent</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Prometheus & Ingress</div>
            </div>

            {/* Agent 2 */}
            <div className={`p-3 rounded-xl border transition-all text-center relative ${
              activeAgentStage === 'anomaly'
                ? 'bg-rose-600/20 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {activeAgentStage === 'anomaly' && (
                <div className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1 animate-ping">
                  BREACH
                </div>
              )}
              <div className="w-8 h-8 mx-auto rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Anomaly Agent</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Z-Score & Pattern Match</div>
            </div>

            {/* Agent 3 */}
            <div className={`p-3 rounded-xl border transition-all text-center relative ${
              activeAgentStage === 'rca'
                ? 'bg-amber-600/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {activeAgentStage === 'rca' && (
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                  REASONING
                </div>
              )}
              <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-1">
                <Search className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Root Cause Agent</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dependency & Trace Graph</div>
            </div>

            {/* Agent 4 */}
            <div className={`p-3 rounded-xl border transition-all text-center relative ${
              activeAgentStage === 'planner'
                ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {activeAgentStage === 'planner' && (
                <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                  PLANNING
                </div>
              )}
              <div className="w-8 h-8 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-1">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Recovery Planner</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Strategy & K8s Command</div>
            </div>

            {/* Agent 5 */}
            <div className={`p-3 rounded-xl border transition-all text-center relative ${
              activeAgentStage === 'execution'
                ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {activeAgentStage === 'execution' && (
                <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                  EXECUTING
                </div>
              )}
              <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-1">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Execution Agent</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Kubectl Action Controller</div>
            </div>

            {/* Agent 6 */}
            <div className={`p-3 rounded-xl border transition-all text-center relative ${
              activeAgentStage === 'validation' || activeAgentStage === 'healed'
                ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {(activeAgentStage === 'validation' || activeAgentStage === 'healed') && (
                <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                  VERIFIED
                </div>
              )}
              <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Validation Agent</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Health Probe & SLA Check</div>
            </div>

            {/* Agent 7 */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center text-slate-400">
              <div className="w-8 h-8 mx-auto rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-300 mb-1">
                <Database className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Knowledge Base</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Playbook Memory & State</div>
            </div>
          </div>

          {/* LIVE AGENT REASONING & RCA PANEL (Explicit User Request!) */}
          <div className="p-4 rounded-xl bg-[#080C14] border border-blue-500/30 space-y-2 mt-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                  LIVE RCA & SRE REASONING CONSOLE [{activeReasoning.agentName}]
                </span>
              </div>
              {countdown > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  AUTONOMOUS HEALING: {countdown.toFixed(1)}s REMAINING
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span>{activeReasoning.title}</span>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {activeReasoning.detail}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
                <Terminal className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{activeReasoning.command}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row (Exact from Image 3: CPU & Memory Telemetry + Ingress RPS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
          {/* Chart 1: Cluster CPU & Memory Telemetry (%) */}
          <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cluster CPU & Memory Telemetry (%)
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> CPU
                </span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Memory
                </span>
              </div>
            </div>

            {/* High-fidelity SVG Wave Chart */}
            <div className="h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="36" x2="500" y2="36" stroke="#1F2937" strokeDasharray="3 3" />
                <line x1="0" y1="72" x2="500" y2="72" stroke="#1F2937" strokeDasharray="3 3" />
                <line x1="0" y1="108" x2="500" y2="108" stroke="#1F2937" strokeDasharray="3 3" />
                <line x1="0" y1="144" x2="500" y2="144" stroke="#1F2937" strokeDasharray="3 3" />

                {/* Memory Curve */}
                <path
                  d="M0,130 Q100,125 200,132 T350,128 T500,130 L500,180 L0,180 Z"
                  fill="url(#memGradient)"
                />
                <path
                  d="M0,130 Q100,125 200,132 T350,128 T500,130"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2"
                />

                {/* CPU Curve (Surges up if CPU Spike active) */}
                <path
                  d={
                    activeFault?.key === 'CPU_SPIKE'
                      ? "M0,140 Q100,135 250,20 T400,25 T500,30 L500,180 L0,180 Z"
                      : "M0,140 Q100,135 200,142 T350,136 T500,138 L500,180 L0,180 Z"
                  }
                  fill="url(#cpuGradient)"
                  className="transition-all duration-500"
                />
                <path
                  d={
                    activeFault?.key === 'CPU_SPIKE'
                      ? "M0,140 Q100,135 250,20 T400,25 T500,30"
                      : "M0,140 Q100,135 200,142 T350,136 T500,138"
                  }
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  className="transition-all duration-500"
                />
              </svg>

              {/* X Axis Timestamps */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 font-mono">
                <span>10:00</span>
                <span>10:05</span>
                <span>10:10</span>
                <span>10:15</span>
                <span>10:20</span>
              </div>
            </div>
          </div>

          {/* Chart 2: API Ingress Throughput (RPS) */}
          <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                API Ingress Throughput (RPS)
              </h3>
              <span className="text-[11px] text-emerald-400">OpenTelemetry Gateway</span>
            </div>

            {/* High-fidelity SVG Ingress Wave */}
            <div className="h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="36" x2="500" y2="36" stroke="#1F2937" strokeDasharray="3 3" />
                <line x1="0" y1="72" x2="500" y2="72" stroke="#1F2937" strokeDasharray="3 3" />
                <line x1="0" y1="108" x2="500" y2="108" stroke="#1F2937" strokeDasharray="3 3" />
                <line x1="0" y1="144" x2="500" y2="144" stroke="#1F2937" strokeDasharray="3 3" />

                {/* Ingress Wave */}
                <path
                  d={
                    activeFault?.key === 'TRAFFIC_OVERLOAD'
                      ? "M0,100 Q120,95 240,15 T380,20 T500,25 L500,180 L0,180 Z"
                      : "M0,95 Q120,88 240,94 T380,90 T500,92 L500,180 L0,180 Z"
                  }
                  fill="url(#reqGradient)"
                  className="transition-all duration-500"
                />
                <path
                  d={
                    activeFault?.key === 'TRAFFIC_OVERLOAD'
                      ? "M0,100 Q120,95 240,15 T380,20 T500,25"
                      : "M0,95 Q120,88 240,94 T380,90 T500,92"
                  }
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  className="transition-all duration-500"
                />
              </svg>

              {/* X Axis Timestamps */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 font-mono">
                <span>10:00</span>
                <span>10:05</span>
                <span>10:10</span>
                <span>10:15</span>
                <span>10:20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chaos Engineering Fault Injection Lab (6 Fault Types) */}
        <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Chaos Simulation Lab (Inject Failures & Observe Live Healing)
              </h2>
            </div>
            <span className="text-[10px] text-slate-400">Click to inject failure into targeted service</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(FAULT_DETAILS).map(([key, spec]) => {
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
                      <span className="font-bold text-xs text-white">
                        {spec.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10">
                        Heals: {spec.duration}s
                      </span>
                    </div>

                    <div className="text-[11px] text-blue-300 mt-1">
                      Target: <span className="underline font-bold">{spec.service} (:{spec.port})</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {spec.symptom}
                    </div>
                  </div>

                  <button
                    onClick={() => handleInjectFault(key)}
                    disabled={countdown > 0}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow ${
                      isThisActive
                        ? 'bg-amber-400 text-black animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 text-white active:scale-95 disabled:opacity-40'
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

        {/* Kubernetes Pods Orchestration (kubectl get pods) */}
        <div className="p-5 rounded-xl bg-[#0F1420] border border-white/10 space-y-3 font-mono">
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
      </main>
    </div>
  );
};
