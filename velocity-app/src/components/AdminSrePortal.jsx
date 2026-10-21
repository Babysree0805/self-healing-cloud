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
    name: 'PostgreSQL Lock Contention',
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
    name: 'Ingress Traffic Surge',
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
    name: 'Container CrashLoopBackOff',
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
    name: 'CPU Core Saturation',
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
    name: 'Network Partition (Packet Loss)',
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
    name: 'Unbounded Heap Memory Leak',
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

export const RCA_PIPELINE_DETAILS = {
  MEMORY_LEAK: {
    faultKey: 'MEMORY_LEAK',
    service: 'trip-service',
    port: 8004,
    title: 'Trip Service Unbounded Heap Memory Leak (OOMKilled)',
    sla: 10.0,
    steps: [
      {
        step: 1,
        agent: 'Monitoring Agent',
        role: 'Telemetry Ingress Watcher',
        whatDoing: 'Sampling Prometheus sliding-window telemetry for trip-service cgroup containers. Real-time RSS memory reached 512MB limit.',
        metrics: [
          { label: 'Cgroup Memory', val: '512MB / 512MB (100% OOM)', color: 'text-rose-400' },
          { label: 'P99 Latency', val: '1,450ms (SLO Breach)', color: 'text-amber-400' },
          { label: 'Ingress Throughput', val: '420 RPS', color: 'text-blue-400' },
          { label: 'Exit Status', val: 'SIGSEGV OOMKilled (137)', color: 'text-rose-400' },
        ],
        reasoning: 'Sliding-window Prometheus scraping detected heap saturation beyond the 512MB quota, causing worker process SIGSEGV crash. Triggered alert to Anomaly Detection Agent.'
      },
      {
        step: 2,
        agent: 'Anomaly Detection Agent',
        role: 'Statistical Outlier & Variance Verifier',
        whatDoing: 'Evaluating rolling variance and statistical Z-score across 3 consecutive sliding windows (4.5s total). Validating persistent monotonic escalation.',
        metrics: [
          { label: 'Calculated Z-Score', val: '+4.32σ (Critical > 3.0σ)', color: 'text-rose-400' },
          { label: 'Memory Velocity', val: '+42MB/sec Unbounded', color: 'text-rose-400' },
          { label: 'Outlier Confidence', val: '99.9% True Positive', color: 'text-emerald-400' },
          { label: 'Historical Baseline', val: '128MB Stable', color: 'text-slate-300' },
        ],
        reasoning: 'Monotonic heap growth persistent across 3 sampling intervals proves an architectural memory leak rather than a transient traffic burst.'
      },
      {
        step: 3,
        agent: 'Root Cause Analysis (RCA) Agent',
        role: 'Distributed Span & Heap DAG Analyzer',
        whatDoing: 'Traversing OpenTelemetry distributed call graph. Tracing instant cashout execution to trip completion cache retaining uncollected object references.',
        metrics: [
          { label: 'Root Cause Node', val: 'trip-service:8004 (Active Cache)', color: 'text-amber-400' },
          { label: 'Heap Retained Size', val: '384MB in ActiveTripCache', color: 'text-rose-400' },
          { label: 'Blast Radius', val: 'Isolated to Settlement (Cashout)', color: 'text-emerald-400' },
          { label: 'Trace ID', val: 'tr-mem-9902-8f1a', color: 'text-blue-400' },
        ],
        reasoning: 'RCA Agent proved the memory leak is confined to trip-service active cache. Upstream Auth, Ride booking, and Gateway containers remain operational.'
      },
      {
        step: 4,
        agent: 'Recovery Planner Agent',
        role: 'SRE Knowledge Base Matcher',
        whatDoing: 'Querying SRE Reinforcement Knowledge Base. Correlating signature UNBOUNDED_HEAP_LEAK with historical recovery playbooks.',
        metrics: [
          { label: 'Selected Playbook', val: 'KB-TRIP-02', color: 'text-purple-400' },
          { label: 'Historical Accuracy', val: '98.5% (14 Executions)', color: 'text-emerald-400' },
          { label: 'Action Strategy', val: 'Canary Rollback to v1.1.9-stable', color: 'text-purple-300' },
          { label: 'Recovery SLA', val: '10.0s Automated Target', color: 'text-amber-400' },
        ],
        reasoning: 'Rollback to tested revision v1.1.9-stable flushes the leaked memory cache and eliminates bug regression without losing persistent trip records.'
      },
      {
        step: 5,
        agent: 'Execution Agent',
        role: 'Kubernetes Action Controller',
        whatDoing: 'Synthesizing and dispatching rolling undo command to Kubernetes cluster control plane API.',
        metrics: [
          { label: 'Kubectl Command', val: 'kubectl rollout undo deployment/trip-deployment -n ride-hailing-system', color: 'text-emerald-400', isCode: true },
          { label: 'API Response', val: '200 OK (DeploymentRolledBack)', color: 'text-emerald-400' },
          { label: 'Dispatch Latency', val: '142ms', color: 'text-blue-400' },
        ],
        reasoning: 'Automated controller dispatches zero-downtime canary rollback directly to the node scheduler, eliminating human MTTR triage delay.'
      },
      {
        step: 6,
        agent: 'Validation Agent',
        role: 'Synthetic Health Probes & SLA Checker',
        whatDoing: 'Executing synthetic HTTP liveness & readiness probes against port 8004. Simulating driver cashout settlement transaction.',
        metrics: [
          { label: 'Probe Status', val: '200 OK (Readiness Passed)', color: 'text-emerald-400' },
          { label: 'Normalized Memory', val: '128MB / 512MB (25% Safe)', color: 'text-emerald-400' },
          { label: 'Restored Latency', val: '32ms (Baseline Nominal)', color: 'text-blue-400' },
          { label: 'Cashout Operation', val: 'UNBLOCKED & FUNCTIONAL', color: 'text-emerald-400' },
        ],
        reasoning: 'Synthetic probes confirm 100% endpoint availability, memory stabilized at 128MB, and IMPS payout settlement verified functional.'
      },
      {
        step: 7,
        agent: 'Knowledge Base Reinforcement Agent',
        role: 'Playbook Learning & Ledger Memory',
        whatDoing: 'Logging completed incident audit trail into SRE Knowledge Base. Incrementing playbook execution counter and recording final MTTR.',
        metrics: [
          { label: 'Playbook Updated', val: 'KB-TRIP-02 (Times: 15x)', color: 'text-purple-400' },
          { label: 'Reinforced Accuracy', val: '98.5% Confirmed', color: 'text-emerald-400' },
          { label: 'Final MTTR', val: '10.0s (SLA Compliant)', color: 'text-amber-400' },
          { label: 'Cluster Health Index', val: '100% NOMINAL', color: 'text-emerald-400' },
        ],
        reasoning: 'Reinforces autonomous self-healing model so future trip-service memory leaks will automatically trigger KB-TRIP-02 without diagnostic trial.'
      }
    ]
  },
  DB_BOTTLENECK: {
    faultKey: 'DB_BOTTLENECK',
    service: 'auth-service',
    port: 8001,
    title: 'PostgreSQL Relational Lock Contention & Pool Exhaustion',
    sla: 9.4,
    steps: [
      {
        step: 1,
        agent: 'Monitoring Agent',
        role: 'Telemetry Ingress Watcher',
        whatDoing: 'Scraping PgBouncer connection pooler on postgres-0. Active client connections reached 100/100 maximum ceiling.',
        metrics: [
          { label: 'Active Connections', val: '100 / 100 (Max Capacity)', color: 'text-rose-400' },
          { label: 'Connection Queue', val: '48 Clients Blocked', color: 'text-rose-400' },
          { label: 'Auth Endpoint', val: '500 Pool Exhausted', color: 'text-rose-400' },
          { label: 'Auth Latency', val: '2,800ms (p99)', color: 'text-amber-400' },
        ],
        reasoning: 'Relational connection pool saturation prevents rider login and driver payout settlements from acquiring a SQL execution slot.'
      },
      {
        step: 2,
        agent: 'Anomaly Detection Agent',
        role: 'Statistical Outlier & Variance Verifier',
        whatDoing: 'Measuring transaction queue accumulation rate. Z-Score calculated at +3.95σ above 24h baseline.',
        metrics: [
          { label: 'Calculated Z-Score', val: '+3.95σ (Critical > 3.0σ)', color: 'text-rose-400' },
          { label: 'Client Wait Time', val: '2,400ms Average', color: 'text-amber-400' },
          { label: 'Anomaly Category', val: 'DB_POOL_EXHAUSTION', color: 'text-rose-400' },
          { label: 'Historical Baseline', val: '14 Active Connections', color: 'text-slate-300' },
        ],
        reasoning: 'Persistent connection backlog for >3s confirms structural lock contention rather than ordinary user login traffic.'
      },
      {
        step: 3,
        agent: 'Root Cause Analysis (RCA) Agent',
        role: 'Distributed Span & Lock Graph Analyzer',
        whatDoing: 'Executing lock dependency analysis on pg_stat_activity. Isolating orphaned transactions holding row-level locks on "users" and "trips".',
        metrics: [
          { label: 'Root Cause Node', val: 'postgres-0 (auth-service)', color: 'text-amber-400' },
          { label: 'Locked Relational Tables', val: 'users, trips', color: 'text-rose-400' },
          { label: 'Orphaned PIDs', val: 'PID 1842, 1847 (idle in transaction)', color: 'text-rose-400' },
          { label: 'Containment', val: 'Ride booking & map telemetry intact', color: 'text-emerald-400' },
        ],
        reasoning: 'Orphaned backend worker thread crashed without releasing its relational row locks, causing cascading connection queue lockup.'
      },
      {
        step: 4,
        agent: 'Recovery Planner Agent',
        role: 'SRE Knowledge Base Matcher',
        whatDoing: 'Retrieving playbook KB-AUTH-04 from Knowledge Base. Formulating targeted PID termination and connection pooler reset.',
        metrics: [
          { label: 'Selected Playbook', val: 'KB-AUTH-04', color: 'text-purple-400' },
          { label: 'Historical Accuracy', val: '96.0% (11 Executions)', color: 'text-emerald-400' },
          { label: 'Recovery Strategy', val: 'pkill idle in transaction & pool recycle', color: 'text-purple-300' },
          { label: 'Recovery SLA', val: '9.4s Automated Target', color: 'text-amber-400' },
        ],
        reasoning: 'Killing orphaned idle processes releases row locks instantly without the heavy downtime of a full PostgreSQL container restart.'
      },
      {
        step: 5,
        agent: 'Execution Agent',
        role: 'Kubernetes Action Controller',
        whatDoing: 'Dispatching administrative command inside postgres-0 pod to terminate blocked transactions.',
        metrics: [
          { label: 'Kubectl Command', val: 'kubectl exec -it postgres-0 -- pkill -u postgres -f "idle in transaction"', color: 'text-emerald-400', isCode: true },
          { label: 'PIDs Terminated', val: '2 Orphaned PIDs Killed', color: 'text-emerald-400' },
          { label: 'Execution Latency', val: '98ms', color: 'text-blue-400' },
        ],
        reasoning: 'Releases lock contention immediately, unlocking connection slots for queued passenger and driver requests.'
      },
      {
        step: 6,
        agent: 'Validation Agent',
        role: 'Synthetic Health Probes & SLA Checker',
        whatDoing: 'Executing synthetic authentication challenge to auth-service:8001 and querying active connection count.',
        metrics: [
          { label: 'Active Connections', val: '14 / 100 (Nominal Pool)', color: 'text-emerald-400' },
          { label: 'Auth Latency', val: '28ms (Within 50ms SLO)', color: 'text-blue-400' },
          { label: 'HTTP Status', val: '200 OK (Auth Verified)', color: 'text-emerald-400' },
          { label: 'Driver IMPS Payout', val: 'UNBLOCKED', color: 'text-emerald-400' },
        ],
        reasoning: 'Active database connections dropped back to 14/100; synthetic authentication returns 200 OK in 28ms.'
      },
      {
        step: 7,
        agent: 'Knowledge Base Reinforcement Agent',
        role: 'Playbook Learning & Ledger Memory',
        whatDoing: 'Logging successful incident resolution into SRE memory. Incrementing playbook KB-AUTH-04 execution count.',
        metrics: [
          { label: 'Playbook Updated', val: 'KB-AUTH-04 (Times: 12x)', color: 'text-purple-400' },
          { label: 'Reinforced Accuracy', val: '96.0% Confirmed', color: 'text-emerald-400' },
          { label: 'Final MTTR', val: '9.4s (SLA Compliant)', color: 'text-amber-400' },
          { label: 'Cluster Health Index', val: '100% NOMINAL', color: 'text-emerald-400' },
        ],
        reasoning: 'Maintains verified playbook parameters in knowledge base for sub-10 second resolution of future database lock contention.'
      }
    ]
  },
  TRAFFIC_OVERLOAD: {
    faultKey: 'TRAFFIC_OVERLOAD',
    service: 'ride-service',
    port: 8002,
    title: 'Ingress Traffic Surge & Bike Taxi Rate Limit (429)',
    sla: 5.5,
    steps: [
      {
        step: 1,
        agent: 'Monitoring Agent',
        role: 'Telemetry Ingress Watcher',
        whatDoing: 'Monitoring Envoy ingress gateway metrics. Bike taxi dispatch queue experiencing 429 Too Many Requests.',
        metrics: [
          { label: 'Ingress Throughput', val: '840 RPS (2x Surge)', color: 'text-rose-400' },
          { label: 'HTTP Error Code', val: '429 Rate Limit Exceeded', color: 'text-rose-400' },
          { label: 'Queue Buffer', val: '820 Requests Buffered', color: 'text-amber-400' },
          { label: 'Replicas Running', val: '1 Replica (Choked)', color: 'text-amber-400' },
        ],
        reasoning: 'Sudden rush-hour surge exceeded the single pod queue capacity on the bike dispatch route.'
      },
      {
        step: 2,
        agent: 'Anomaly Detection Agent',
        role: 'Statistical Outlier & Variance Verifier',
        whatDoing: 'Computing traffic ingress acceleration rate. Z-Score calculated at +4.80σ above historical baseline.',
        metrics: [
          { label: 'Calculated Z-Score', val: '+4.80σ (Critical)', color: 'text-rose-400' },
          { label: 'Surge Acceleration', val: '+240% Ingress Burst', color: 'text-rose-400' },
          { label: 'Auto & Cab Impact', val: '0% (Isolated Routes)', color: 'text-emerald-400' },
          { label: 'Queue Fill Rate', val: '94% Full', color: 'text-amber-400' },
        ],
        reasoning: 'Statistical confirmation indicates localized route surge rather than volumetric DDoS.'
      },
      {
        step: 3,
        agent: 'Root Cause Analysis (RCA) Agent',
        role: 'Distributed Span & Route Analyzer',
        whatDoing: 'Inspecting Envoy ingress routing table. Rate limiter actively choking Bike route while Auto and Cab traffic passes normally.',
        metrics: [
          { label: 'Throttled Service', val: 'ride-service:8002 (/rides/bike)', color: 'text-amber-400' },
          { label: 'Fault Containment', val: 'Auto, Cab & Parcel 100% OK', color: 'text-emerald-400' },
          { label: 'Ingress Envoy Mesh', val: 'Local Rate Limiter Engaged', color: 'text-blue-400' },
        ],
        reasoning: 'RCA Agent isolated surge to the Bike queue; fault containment preserved other vehicle modes.'
      },
      {
        step: 4,
        agent: 'Recovery Planner Agent',
        role: 'SRE Knowledge Base Matcher',
        whatDoing: 'Retrieving playbook KB-RIDE-02 from Knowledge Base. Formulating HPA horizontal scaling sequence.',
        metrics: [
          { label: 'Selected Playbook', val: 'KB-RIDE-02', color: 'text-purple-400' },
          { label: 'Historical Accuracy', val: '100.0% (9 Executions)', color: 'text-emerald-400' },
          { label: 'Scaling Target', val: 'Scale Replicas from 1 -> 3', color: 'text-purple-300' },
          { label: 'Recovery SLA', val: '5.5s Automated Target', color: 'text-amber-400' },
        ],
        reasoning: 'Scaling to 3 pod replicas triples compute capacity, instantly draining the ingress queue.'
      },
      {
        step: 5,
        agent: 'Execution Agent',
        role: 'Kubernetes Action Controller',
        whatDoing: 'Executing Kubernetes horizontal scale command on ride-deployment.',
        metrics: [
          { label: 'Kubectl Command', val: 'kubectl scale deployment ride-deployment --replicas=3 -n ride-hailing-system', color: 'text-emerald-400', isCode: true },
          { label: 'Replicas Scheduled', val: '3/3 Pods Ready', color: 'text-emerald-400' },
          { label: 'Execution Latency', val: '110ms', color: 'text-blue-400' },
        ],
        reasoning: 'HPA command scales pods instantly across worker nodes 1 and 2.'
      },
      {
        step: 6,
        agent: 'Validation Agent',
        role: 'Synthetic Health Probes & SLA Checker',
        whatDoing: 'Dispatching synthetic booking requests across all 3 replicas. Verifying buffer drain and 200 OK responses.',
        metrics: [
          { label: 'HTTP Status', val: '200 OK (All Rides Passing)', color: 'text-emerald-400' },
          { label: 'Buffer Queue Depth', val: '0 (Fully Drained)', color: 'text-emerald-400' },
          { label: 'Dispatch Latency', val: '38ms (Nominal)', color: 'text-blue-400' },
          { label: 'Active Pods', val: '10 Total Scheduled', color: 'text-blue-400' },
        ],
        reasoning: 'All 3 pod replicas passing health probes; Bike taxi bookings unblocked with 200 OK.'
      },
      {
        step: 7,
        agent: 'Knowledge Base Reinforcement Agent',
        role: 'Playbook Learning & Ledger Memory',
        whatDoing: 'Updating playbook KB-RIDE-02 audit record in Knowledge Base.',
        metrics: [
          { label: 'Playbook Updated', val: 'KB-RIDE-02 (Times: 10x)', color: 'text-purple-400' },
          { label: 'Reinforced Accuracy', val: '100.0% Confirmed', color: 'text-emerald-400' },
          { label: 'Final MTTR', val: '5.5s (SLA Compliant)', color: 'text-amber-400' },
          { label: 'Cluster Health Index', val: '100% NOMINAL', color: 'text-emerald-400' },
        ],
        reasoning: 'Reinforces 100% confidence for automated Horizontal Pod Autoscaling on ride-service.'
      }
    ]
  },
  SERVICE_CRASH: {
    faultKey: 'SERVICE_CRASH',
    service: 'driver-service',
    port: 8003,
    title: 'Driver Service Container CrashLoopBackOff (SIGSEGV)',
    sla: 7.0,
    steps: [
      {
        step: 1,
        agent: 'Monitoring Agent',
        role: 'Telemetry Ingress Watcher',
        whatDoing: 'Kubelet container runtime reports driver-service pod terminated with SIGSEGV (Exit Code 137). Pod state: CrashLoopBackOff.',
        metrics: [
          { label: 'Pod Status', val: 'CrashLoopBackOff', color: 'text-rose-400' },
          { label: 'HTTP Status', val: '503 Service Unavailable', color: 'text-rose-400' },
          { label: 'Exit Code', val: 'SIGSEGV (Exit Code 137)', color: 'text-rose-400' },
          { label: 'Driver Duty Toggle', val: 'REJECTED (Offline)', color: 'text-rose-400' },
        ],
        reasoning: 'Pod process crash triggers immediate Kubernetes node event and liveness probe failure.'
      },
      {
        step: 2,
        agent: 'Anomaly Detection Agent',
        role: 'Statistical Outlier & Variance Verifier',
        whatDoing: 'Verifying pod liveness probe failure. Z-score calculated at +5.12σ.',
        metrics: [
          { label: 'Calculated Z-Score', val: '+5.12σ (Critical Crash)', color: 'text-rose-400' },
          { label: 'Liveness Probe', val: 'FAILED (Connection Refused)', color: 'text-rose-400' },
          { label: 'Restart Count', val: '1 Container Restart', color: 'text-amber-400' },
        ],
        reasoning: 'Zero socket response on port 8003 confirms container death rather than network latency.'
      },
      {
        step: 3,
        agent: 'Root Cause Analysis (RCA) Agent',
        role: 'Distributed Span & Stack Trace Analyzer',
        whatDoing: 'Analyzing container stderr logs. Null pointer exception on unhandled missing driver telemetry packet caused unrecoverable crash.',
        metrics: [
          { label: 'Root Cause Node', val: 'driver-service-pod-990', color: 'text-amber-400' },
          { label: 'Exception', val: 'NullPointerException in Worker', color: 'text-rose-400' },
          { label: 'Containment', val: 'Passenger & Pricing Unaffected', color: 'text-emerald-400' },
        ],
        reasoning: 'RCA Agent identified bad worker state; clean container re-instantiation will restore service.'
      },
      {
        step: 4,
        agent: 'Recovery Planner Agent',
        role: 'SRE Knowledge Base Matcher',
        whatDoing: 'Retrieving playbook KB-DRV-03 from Knowledge Base. Planning immediate pod force termination and recreation.',
        metrics: [
          { label: 'Selected Playbook', val: 'KB-DRV-03', color: 'text-purple-400' },
          { label: 'Historical Accuracy', val: '100.0% (6 Executions)', color: 'text-emerald-400' },
          { label: 'Action Strategy', val: 'Kubernetes Pod Force Delete', color: 'text-purple-300' },
          { label: 'Recovery SLA', val: '7.0s Automated Target', color: 'text-amber-400' },
        ],
        reasoning: 'Force pod deletion triggers ReplicaSet controller to immediately spin up a fresh healthy pod.'
      },
      {
        step: 5,
        agent: 'Execution Agent',
        role: 'Kubernetes Action Controller',
        whatDoing: 'Executing pod force deletion command against Kubernetes cluster.',
        metrics: [
          { label: 'Kubectl Command', val: 'kubectl delete pod driver-service-pod-990 --grace-period=0 -n ride-hailing-system', color: 'text-emerald-400', isCode: true },
          { label: 'ReplicaSet Action', val: 'New Pod Scheduled on Node 2', color: 'text-emerald-400' },
          { label: 'Execution Latency', val: '125ms', color: 'text-blue-400' },
        ],
        reasoning: 'Replaces faulted container with clean image from Docker registry in <2 seconds.'
      },
      {
        step: 6,
        agent: 'Validation Agent',
        role: 'Synthetic Health Probes & SLA Checker',
        whatDoing: 'Verifying liveness & readiness probes on new pod. Testing driver duty toggle endpoint.',
        metrics: [
          { label: 'HTTP Status', val: '200 OK (Pod Running)', color: 'text-emerald-400' },
          { label: 'Pod Health', val: '100% Ready (1/1)', color: 'text-emerald-400' },
          { label: 'Driver Duty Toggle', val: 'UNBLOCKED & FUNCTIONAL', color: 'text-emerald-400' },
        ],
        reasoning: 'Readiness probe returned HTTP 200 OK within 35ms; Captain duty switch functional.'
      },
      {
        step: 7,
        agent: 'Knowledge Base Reinforcement Agent',
        role: 'Playbook Learning & Ledger Memory',
        whatDoing: 'Logging incident recovery into Knowledge Base. Incrementing KB-DRV-03 count to 7x.',
        metrics: [
          { label: 'Playbook Updated', val: 'KB-DRV-03 (Times: 7x)', color: 'text-purple-400' },
          { label: 'Reinforced Accuracy', val: '100.0% Confirmed', color: 'text-emerald-400' },
          { label: 'Final MTTR', val: '7.0s (SLA Compliant)', color: 'text-amber-400' },
          { label: 'Cluster Health Index', val: '100% NOMINAL', color: 'text-emerald-400' },
        ],
        reasoning: 'Confirms automated container rebuild as the 100% successful recovery path.'
      }
    ]
  },
  CPU_SPIKE: {
    faultKey: 'CPU_SPIKE',
    service: 'pricing-service',
    port: 8005,
    title: 'Pricing Service CPU Core Saturation (98.4%)',
    sla: 4.2,
    steps: [
      {
        step: 1,
        agent: 'Monitoring Agent',
        role: 'Telemetry Ingress Watcher',
        whatDoing: 'cAdvisor metrics report pricing-service pod CPU core saturation at 98.4%. CFS quota throttling triggered.',
        metrics: [
          { label: 'CPU Utilization', val: '98.4% (Throttled)', color: 'text-rose-400' },
          { label: 'CFS Throttle', val: '88% of compute cycles', color: 'text-rose-400' },
          { label: 'Pricing Latency', val: '1,280ms (504 Timeout)', color: 'text-amber-400' },
        ],
        reasoning: 'CPU core saturation delays fare calculation algorithm beyond the 50ms SLO.'
      },
      {
        step: 2,
        agent: 'Anomaly Detection Agent',
        role: 'Statistical Outlier & Variance Verifier',
        whatDoing: 'Evaluating compute anomaly persistence. Z-Score calculated at +4.65σ.',
        metrics: [
          { label: 'Calculated Z-Score', val: '+4.65σ (High Compute)', color: 'text-rose-400' },
          { label: 'Throttle Percentage', val: '88% CFS Periods', color: 'text-rose-400' },
        ],
        reasoning: 'Confirmed CPU core starvation across consecutive execution periods.'
      },
      {
        step: 3,
        agent: 'Root Cause Analysis (RCA) Agent',
        role: 'Distributed Span & Thread Contention Analyzer',
        whatDoing: 'Analyzing thread stack traces. O(N^2) recursive surge pricing matchmaking loop causing compute bottleneck.',
        metrics: [
          { label: 'Root Cause Node', val: 'pricing-service:8005', color: 'text-amber-400' },
          { label: 'Contention Loop', val: 'Recursive Matchmaking Thread', color: 'text-rose-400' },
          { label: 'Containment', val: 'Rides and Driver portals intact', color: 'text-emerald-400' },
        ],
        reasoning: 'RCA Agent identified surge computation thread contention; Horizontal Pod Autoscaling will distribute compute load.'
      },
      {
        step: 4,
        agent: 'Recovery Planner Agent',
        role: 'SRE Knowledge Base Matcher',
        whatDoing: 'Retrieving playbook KB-PRICE-01 from Knowledge Base. Planning HPA replica scaling from 1 to 2.',
        metrics: [
          { label: 'Selected Playbook', val: 'KB-PRICE-01', color: 'text-purple-400' },
          { label: 'Historical Accuracy', val: '98.5% (14 Executions)', color: 'text-emerald-400' },
          { label: 'Target Action', val: 'Scale pricing-deployment to 2 Replicas', color: 'text-purple-300' },
          { label: 'Recovery SLA', val: '4.2s Automated Target', color: 'text-amber-400' },
        ],
        reasoning: 'Doubling compute pods halves per-pod core utilization and drops CFS throttle to 0%.'
      },
      {
        step: 5,
        agent: 'Execution Agent',
        role: 'Kubernetes Action Controller',
        whatDoing: 'Executing kubectl scale deployment on pricing-service.',
        metrics: [
          { label: 'Kubectl Command', val: 'kubectl scale deployment pricing-deployment --replicas=2 -n ride-hailing-system', color: 'text-emerald-400', isCode: true },
          { label: 'Replicas Ready', val: '2/2 Scheduled', color: 'text-emerald-400' },
          { label: 'Execution Latency', val: '92ms', color: 'text-blue-400' },
        ],
        reasoning: 'Autoscaler dispatches additional pod replica to worker node 3.'
      },
      {
        step: 6,
        agent: 'Validation Agent',
        role: 'Synthetic Health Probes & SLA Checker',
        whatDoing: 'Executing synthetic fare estimation queries. Verifying CPU load normalization.',
        metrics: [
          { label: 'HTTP Status', val: '200 OK (Fares Nominal)', color: 'text-emerald-400' },
          { label: 'CPU Utilization', val: '19.0% (Balanced)', color: 'text-emerald-400' },
          { label: 'Pricing Latency', val: '32ms (Nominal)', color: 'text-blue-400' },
        ],
        reasoning: 'CPU dropped to 19.0%; dynamic pricing queries return 200 OK in 32ms.'
      },
      {
        step: 7,
        agent: 'Knowledge Base Reinforcement Agent',
        role: 'Playbook Learning & Ledger Memory',
        whatDoing: 'Updating playbook KB-PRICE-01 audit record in Knowledge Base.',
        metrics: [
          { label: 'Playbook Updated', val: 'KB-PRICE-01 (Times: 15x)', color: 'text-purple-400' },
          { label: 'Reinforced Accuracy', val: '98.5% Confirmed', color: 'text-emerald-400' },
          { label: 'Final MTTR', val: '4.2s (SLA Compliant)', color: 'text-amber-400' },
        ],
        reasoning: 'Fastest auto-healing SLA achieved at 4.2 seconds.'
      }
    ]
  },
  NETWORK_PARTITION: {
    faultKey: 'NETWORK_PARTITION',
    service: 'location-service',
    port: 8006,
    title: 'Location Service Network Partition & 45% Packet Drop',
    sla: 8.2,
    steps: [
      {
        step: 1,
        agent: 'Monitoring Agent',
        role: 'Telemetry Ingress Watcher',
        whatDoing: 'Service mesh metrics indicate 45% packet drop on location-service:8006 socket.',
        metrics: [
          { label: 'Packet Loss', val: '45.2% Drop Rate', color: 'text-rose-400' },
          { label: 'HTTP Status', val: '504 Gateway Timeout', color: 'text-rose-400' },
          { label: 'Dispatch Latency', val: '1,420ms', color: 'text-amber-400' },
        ],
        reasoning: 'Packet loss causes driver GPS coordinate pings to be dropped.'
      },
      {
        step: 2,
        agent: 'Anomaly Detection Agent',
        role: 'Statistical Outlier & Variance Verifier',
        whatDoing: 'Validating socket ping loss variance across worker node 2 overlay network.',
        metrics: [
          { label: 'Calculated Z-Score', val: '+3.88σ (Packet Loss)', color: 'text-rose-400' },
          { label: 'Drop Consistency', val: '3 consecutive probe cycles', color: 'text-rose-400' },
        ],
        reasoning: 'Persistent socket timeout confirms network partition rather than individual GPS packet drop.'
      },
      {
        step: 3,
        agent: 'Root Cause Analysis (RCA) Agent',
        role: 'Distributed Span & Mesh Route Analyzer',
        whatDoing: 'Inspecting Envoy service mesh sidecar routing table on worker node 2. Routing table desynchronized from control plane.',
        metrics: [
          { label: 'Root Cause Node', val: 'Envoy Sidecar on Node 2', color: 'text-amber-400' },
          { label: 'Route Desync', val: 'Stale IPTables overlay route', color: 'text-rose-400' },
        ],
        reasoning: 'RCA Agent isolated issue to stale Envoy proxy network socket.'
      },
      {
        step: 4,
        agent: 'Recovery Planner Agent',
        role: 'SRE Knowledge Base Matcher',
        whatDoing: 'Retrieving playbook KB-LOC-05 from Knowledge Base. Formulating rolling daemonset restart.',
        metrics: [
          { label: 'Selected Playbook', val: 'KB-LOC-05', color: 'text-purple-400' },
          { label: 'Historical Accuracy', val: '94.2% (8 Executions)', color: 'text-emerald-400' },
          { label: 'Target Action', val: 'Restart Envoy Proxy Daemonset', color: 'text-purple-300' },
          { label: 'Recovery SLA', val: '8.2s Automated Target', color: 'text-amber-400' },
        ],
        reasoning: 'Envoy daemonset restart re-syncs iptables and restores clear overlay socket.'
      },
      {
        step: 5,
        agent: 'Execution Agent',
        role: 'Kubernetes Action Controller',
        whatDoing: 'Executing rollout restart command on Envoy network daemonset.',
        metrics: [
          { label: 'Kubectl Command', val: 'kubectl rollout restart daemonset/envoy-proxy-network -n ride-hailing-system', color: 'text-emerald-400', isCode: true },
          { label: 'Socket Remount', val: 'IPTables Flushed & Synced', color: 'text-emerald-400' },
          { label: 'Execution Latency', val: '135ms', color: 'text-blue-400' },
        ],
        reasoning: 'Rebuilds overlay network socket connection cleanly.'
      },
      {
        step: 6,
        agent: 'Validation Agent',
        role: 'Synthetic Health Probes & SLA Checker',
        whatDoing: 'Executing synthetic location ping telemetry probe. Measuring packet drop rate.',
        metrics: [
          { label: 'Packet Loss', val: '0.02% (Normal)', color: 'text-emerald-400' },
          { label: 'Telemetry Latency', val: '24ms (Nominal)', color: 'text-blue-400' },
          { label: 'HTTP Status', val: '200 OK', color: 'text-emerald-400' },
        ],
        reasoning: 'Packet loss reduced to 0.02%; GPS telemetry streaming nominal.'
      },
      {
        step: 7,
        agent: 'Knowledge Base Reinforcement Agent',
        role: 'Playbook Learning & Ledger Memory',
        whatDoing: 'Updating playbook KB-LOC-05 audit record in Knowledge Base.',
        metrics: [
          { label: 'Playbook Updated', val: 'KB-LOC-05 (Times: 9x)', color: 'text-purple-400' },
          { label: 'Reinforced Accuracy', val: '94.2% Confirmed', color: 'text-emerald-400' },
          { label: 'Final MTTR', val: '8.2s (SLA Compliant)', color: 'text-amber-400' },
        ],
        reasoning: 'Confirms Envoy daemonset restart as the successful resolution for overlay network partitions.'
      }
    ]
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
  const [selectedRcaFault, setSelectedRcaFault] = useState('MEMORY_LEAK');
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
    <div className="flex h-full w-full overflow-hidden bg-[#F8FAF9] text-slate-800 font-sans select-none">
      {/* Left Sidebar */}
      <aside className="w-56 md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Operations & Telemetry
          </div>
        </div>

        {/* 6 Sidebar Navigation Views */}
        <nav className="p-2 space-y-1 font-mono text-xs flex-1">
          <button
            onClick={() => setActiveNav('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'overview'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('microservices')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'microservices'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-700" />
            <span>Microservice Monitor</span>
          </button>

          <button
            onClick={() => setActiveNav('incidents')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'incidents'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-emerald-700" />
            <span>Incident Management</span>
          </button>

          <button
            onClick={() => setActiveNav('rca')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'rca'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Root Cause Analysis (RCA)</span>
            </div>
            {activeFault && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300 font-bold animate-pulse">
                LIVE
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveNav('chaos')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'chaos'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-4 h-4 text-emerald-700" />
            <span>Chaos Simulation Lab</span>
          </button>

          <button
            onClick={() => setActiveNav('kb')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              activeNav === 'kb'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>SRE Knowledge Base</span>
          </button>
        </nav>

        {/* Target Workload Widget */}
        <div className="p-3 m-2 rounded-xl bg-emerald-50/50 border border-emerald-100 font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>TARGET WORKLOAD</span>
            <span className="text-emerald-700 font-bold">8 SERVICES</span>
          </div>
          <div className="text-[11px] font-bold text-slate-900 mt-1">
            Ride-Hailing Cloud Microservices
          </div>
          <div className="text-[9px] text-slate-500 mt-1 leading-tight">
            Auth, Ride, Driver, Trip, Pricing, Location, Notification & Gateway
          </div>
        </div>
      </aside>

      {/* Main Operations Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-28 bg-[#F8FAF9]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Cluster Operations Overview</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                AUTONOMOUS HEALING ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
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
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-mono text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => (window.location.hash = 'passenger')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-semibold flex items-center gap-1 shadow-xs transition-all"
            >
              <span>Passenger App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => (window.location.hash = 'driver')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-semibold flex items-center gap-1 shadow-xs transition-all"
            >
              <span>Captain App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>CLUSTER HEALTH INDEX</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans">
              {activeFault ? '87.5%' : '100%'}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-500">{activeFault ? '7/8 Services Nominal' : '8/8 Services Nominal'}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${activeFault ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {activeFault ? 'DEGRADED' : 'OPTIMAL'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ACTIVE KUBERNETES PODS</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans">
              {activeFault?.key === 'TRAFFIC_OVERLOAD' ? '10 Pods' : '8 Pods'}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-500">ALL Deployments Running</span>
              <span className="text-emerald-700 font-semibold">100% Scheduled</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>AVERAGE CPU LOAD</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans">
              {activeFault?.key === 'CPU_SPIKE' ? '98.4%' : '18.5%'}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-500">Cluster Core Utilization</span>
              <span className={`font-semibold ${activeFault?.key === 'CPU_SPIKE' ? 'text-rose-700' : 'text-emerald-700'}`}>
                {activeFault?.key === 'CPU_SPIKE' ? 'High Compute' : 'Normal'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>THROUGHPUT & LATENCY</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans">
              420 <span className="text-sm font-normal text-slate-500">RPS</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2">
              <span className="text-slate-500">Avg Latency: 45ms</span>
              <span className="text-emerald-700 font-semibold">SLA Compliant</span>
            </div>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW DASHBOARD */}
        {activeNav === 'overview' && (
          <div className="space-y-6">
            {/* LangGraph 7-Node State Graph */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    LangGraph Multi-Agent Orchestration Flow
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    COMPILED STATE GRAPH
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Active State Engine</span>
              </div>

              {/* 7 Agent Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className={`p-3 rounded-xl border text-center relative transition-all ${agentStep === 'monitoring' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {agentStep === 'monitoring' && <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mb-1">ACTIVE</div>}
                  <Activity className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Monitoring Agent</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Prometheus Ingress</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative transition-all ${agentStep === 'anomaly' ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {agentStep === 'anomaly' && <div className="text-[9px] font-bold text-rose-700 uppercase tracking-widest mb-1">BREACH</div>}
                  <AlertTriangle className="w-5 h-5 mx-auto text-rose-600 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Anomaly Agent</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Z-Score & Variance</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative transition-all ${agentStep === 'rca' ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {agentStep === 'rca' && <div className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-1">REASONING</div>}
                  <Search className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Root Cause Agent</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Trace Dependency DAG</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative transition-all ${agentStep === 'planner' ? 'bg-purple-50 border-purple-400 text-purple-900 ring-2 ring-purple-500/20 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {agentStep === 'planner' && <div className="text-[9px] font-bold text-purple-700 uppercase tracking-widest mb-1">PLANNING</div>}
                  <Sliders className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Recovery Planner</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Strategy & Playbook</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative transition-all ${agentStep === 'execution' ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {agentStep === 'execution' && <div className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-1">EXECUTING</div>}
                  <Terminal className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Execution Agent</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Kubectl Controller</div>
                </div>

                <div className={`p-3 rounded-xl border text-center relative transition-all ${agentStep === 'validation' || agentStep === 'healed' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {(agentStep === 'validation' || agentStep === 'healed') && <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mb-1">VERIFIED</div>}
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Validation Agent</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Health Probe Check</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-slate-600">
                  <Database className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                  <div className="font-bold text-xs text-slate-900">Knowledge Base</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Reinforced Memory</div>
                </div>
              </div>
            </div>

            {/* SVG Telemetry Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                  <span>Cluster CPU & Memory Telemetry (%)</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-700 font-semibold">● CPU</span>
                    <span className="text-slate-500 font-semibold">● Memory</span>
                  </div>
                </div>
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <path d="M0,110 Q100,105 200,112 T350,108 T500,110 L500,160 L0,160 Z" fill="#E2E8F0" fillOpacity="0.5" />
                    <path d="M0,110 Q100,105 200,112 T350,108 T500,110" fill="none" stroke="#94A3B8" strokeWidth="2" />
                    <path d={activeFault?.key === 'CPU_SPIKE' ? "M0,120 Q100,115 250,15 T400,20 T500,25 L500,160 L0,160 Z" : "M0,120 Q100,115 200,122 T350,116 T500,118 L500,160 L0,160 Z"} fill="#D1FAE5" fillOpacity="0.6" className="transition-all duration-500" />
                    <path d={activeFault?.key === 'CPU_SPIKE' ? "M0,120 Q100,115 250,15 T400,20 T500,25" : "M0,120 Q100,115 200,122 T350,116 T500,118"} fill="none" stroke="#059669" strokeWidth="2.5" className="transition-all duration-500" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>10:00</span><span>10:05</span><span>10:10</span><span>10:15</span><span>10:20</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                  <span>API Ingress Throughput (RPS)</span>
                  <span className="text-emerald-700 text-[11px] font-semibold">OpenTelemetry Gateway</span>
                </div>
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeDasharray="3 3" />
                    <path d={activeFault?.key === 'TRAFFIC_OVERLOAD' ? "M0,85 Q120,80 240,10 T380,15 T500,20 L500,160 L0,160 Z" : "M0,80 Q120,75 240,82 T380,78 T500,80 L500,160 L0,160 Z"} fill="#D1FAE5" fillOpacity="0.5" className="transition-all duration-500" />
                    <path d={activeFault?.key === 'TRAFFIC_OVERLOAD' ? "M0,85 Q120,80 240,10 T380,15 T500,20" : "M0,80 Q120,75 240,82 T380,78 T500,80"} fill="none" stroke="#059669" strokeWidth="2.5" className="transition-all duration-500" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
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
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Microservices Telemetry & Pod Health Matrix
              </h2>
              <span className="text-xs text-slate-500">Total: 8 Microservices</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pods.map((p) => {
                const isFailed = p.status !== 'Running';
                return (
                  <div key={p.service} className={`p-4 rounded-xl border transition-all ${
                    isFailed ? 'bg-rose-50/70 border-rose-300 shadow-sm' : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{p.service}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isFailed ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1 truncate">{p.pod_name}</div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">CPU LOAD</div>
                        <div className="font-bold text-slate-800">{isFailed && activeFault?.key === 'CPU_SPIKE' ? '98.4%' : `${p.cpu_pct}%`}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">MEMORY</div>
                        <div className="font-bold text-slate-800">{isFailed && activeFault?.key === 'MEMORY_LEAK' ? '512MB' : p.mem}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">LATENCY</div>
                        <div className="font-bold text-slate-800">{isFailed && activeFault?.key === 'NETWORK_PARTITION' ? '1,420ms' : p.latency}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">RESTARTS</div>
                        <div className="font-bold text-slate-800">{p.restarts}</div>
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
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Live Incident Tracking & Self-Healing Audit Log
              </h2>
              <span className="text-xs text-slate-500">Average MTTR: 6.4s</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
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
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{inc.id}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{inc.service}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{inc.error}</td>
                      <td className="py-3 px-4 text-slate-500">{inc.detectedAt}</td>
                      <td className="py-3 px-4 text-slate-500">{inc.resolvedAt}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inc.mttr}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{inc.action}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
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

        {/* VIEW 4: ROOT CAUSE ANALYSIS (RCA) - Sequential Multi-Agent Flow */}
        {activeNav === 'rca' && (() => {
          const currentFaultKey = activeFault ? activeFault.key : selectedRcaFault;
          const currentPipeline = RCA_PIPELINE_DETAILS[currentFaultKey] || RCA_PIPELINE_DETAILS.MEMORY_LEAK;

          // Determine active step index (1 to 7) based on countdown
          let activeStepIndex = 7;
          if (activeFault && countdown > 0) {
            const elapsed = activeFault.duration - countdown;
            const ratio = elapsed / activeFault.duration;
            if (ratio < 0.15) activeStepIndex = 1;
            else if (ratio < 0.30) activeStepIndex = 2;
            else if (ratio < 0.50) activeStepIndex = 3;
            else if (ratio < 0.68) activeStepIndex = 4;
            else if (ratio < 0.85) activeStepIndex = 5;
            else if (ratio < 0.98) activeStepIndex = 6;
            else activeStepIndex = 7;
          }

          const currentlyWorkingStep = currentPipeline.steps[Math.min(activeStepIndex - 1, 6)];

          return (
            <div className="space-y-6 font-mono">
              {/* Header & Fault Selector Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Search className="w-5 h-5 text-emerald-700" />
                      <span>Root Cause Analysis (RCA) & Multi-Agent Reasoning</span>
                    </h2>
                    {activeFault && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold animate-pulse">
                        LIVE BREACH ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous sequential agent diagnostics: telemetry anomaly breach, root cause deduction, automated kubectl execution, and validation.
                  </p>
                </div>

                {/* Live Trigger or SLA Countdown */}
                <div className="flex items-center gap-3 shrink-0">
                  {countdown > 0 ? (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
                      <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>Autonomous Healing: {countdown.toFixed(1)}s</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInjectFault(currentFaultKey)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Simulate This Fault Live ({currentPipeline.sla}s)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Fault Selection Switcher Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0 mr-1">
                  Target Service Fault:
                </span>
                {Object.entries(RCA_PIPELINE_DETAILS).map(([key, data]) => {
                  const isSelected = currentFaultKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (!activeFault) setSelectedRcaFault(key);
                      }}
                      className={`px-3 py-1.5 rounded-lg border font-semibold text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {data.service}
                    </button>
                  );
                })}
              </div>

              {/* CURRENTLY WORKING AGENT SPOTLIGHT CARD */}
              <div className={`p-5 rounded-2xl border transition-all ${
                activeFault && countdown > 0
                  ? 'bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-500/10 shadow-sm'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                      activeFault && countdown > 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {currentlyWorkingStep.step}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                        CURRENTLY ACTIVE SRE AGENT
                      </div>
                      <div className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                        <span>{currentlyWorkingStep.agent}</span>
                        <span className="text-xs font-normal text-slate-500">({currentlyWorkingStep.role})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeFault && countdown > 0 ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>LIVE REASONING IN PROGRESS</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>VERIFIED HEALTHY (ALL STEPS COMPLETE)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* What it is doing */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>What This Agent Is Doing:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono">
                    {currentlyWorkingStep.whatDoing}
                  </div>
                </div>

                {/* Live Telemetry & Metrics Snapshot Grid */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Real-Time Telemetry & Metric Analysis:</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {currentlyWorkingStep.metrics.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500">{m.label}</div>
                        <div className={`font-bold text-xs mt-1 truncate ${m.color || 'text-slate-900'}`}>
                          {m.val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasoning Analysis */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Architectural Reasoning & Root Cause Rationale:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-mono">
                    {currentlyWorkingStep.reasoning}
                  </div>
                </div>
              </div>

              {/* SEQUENTIAL STEP-BY-STEP MULTI-AGENT EXECUTION PIPELINE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Sequential Multi-Agent Execution Log (All 7 Steps)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Step {activeStepIndex} of 7 Active
                  </span>
                </div>

                <div className="space-y-3">
                  {currentPipeline.steps.map((st) => {
                    const isCompleted = !activeFault || countdown === 0 || st.step < activeStepIndex;
                    const isCurrent = activeFault && countdown > 0 && st.step === activeStepIndex;
                    const isQueued = activeFault && countdown > 0 && st.step > activeStepIndex;

                    return (
                      <div
                        key={st.step}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-50/50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                            : isCompleted
                            ? 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                            : 'bg-slate-50/50 border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isCurrent
                                ? 'bg-emerald-600 text-white'
                                : isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {st.step}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-2 font-sans">
                                <span>Step {st.step}: {st.agent}</span>
                                <span className="text-[11px] text-slate-500 font-normal">({st.role})</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>COMPLETED</span>
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                <span>WORKING NOW</span>
                              </span>
                            )}
                            {isQueued && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                QUEUED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step Details */}
                        <div className="mt-3 space-y-2.5 text-xs">
                          {/* What it's doing */}
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1.5">Action:</span>
                            <span>{st.whatDoing}</span>
                          </div>

                          {/* Metrics chips */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                            {st.metrics.map((m, mIdx) => (
                              <div key={mIdx} className="p-2 rounded bg-slate-50 border border-slate-200">
                                <div className="text-[9px] text-slate-400 uppercase">{m.label}</div>
                                <div className={`font-bold truncate mt-0.5 ${m.color || 'text-slate-800'}`}>
                                  {m.val}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Reasoning */}
                          <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900 text-[11px]">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase mr-1.5">Reasoning:</span>
                            <span>{st.reasoning}</span>
                          </div>

                          {/* Terminal command if execution agent */}
                          {st.step === 5 && (
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                              <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{st.metrics[0]?.val}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* VIEW 5: CHAOS SIMULATION LAB */}
        {activeNav === 'chaos' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Chaos Simulation Lab (6 Controlled Failure Types)
              </h2>
              <span className="text-xs text-slate-500">Click to inject failure into targeted service</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(FAULT_SPECS_EXPANDED).map(([key, spec]) => {
                const isThisActive = activeFault?.key === key;
                return (
                  <div key={key} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isThisActive ? 'bg-amber-50/60 border-amber-400 shadow-sm ring-2 ring-amber-400/20' : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{spec.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          Heals: {spec.duration}s
                        </span>
                      </div>

                      <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                        Target: <span className="underline">{spec.service} (:{spec.port})</span>
                      </div>

                      <div className="text-[11px] text-slate-700 mt-2 font-medium">
                        Symptom: {spec.symptom}
                      </div>

                      <div className="text-[10px] text-emerald-800 mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 font-medium">
                        Containment: {spec.containment}
                      </div>
                    </div>

                    <button
                      onClick={() => handleInjectFault(key)}
                      disabled={countdown > 0}
                      className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        isThisActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 disabled:opacity-40'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{isThisActive ? `Self-Healing in ${countdown.toFixed(1)}s...` : `Simulate ${spec.shortName}`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: SRE KNOWLEDGE BASE */}
        {activeNav === 'kb' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                SRE Continuous Knowledge Base & Learned Playbooks
              </h2>
              <span className="text-xs text-emerald-700 font-semibold">Reinforcement Learning Memory</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
              <strong>Continuous Reinforcement Learning:</strong> When recurring anomalies occur, the LangGraph SRE Agent queries this memory bank to immediately execute the playbook with the highest historical accuracy score without repeating trial-and-error diagnosis.
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
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
                <tbody className="divide-y divide-slate-100">
                  {Object.values(FAULT_SPECS_EXPANDED).map((kb) => (
                    <tr key={kb.playbookId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{kb.playbookId}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{kb.service}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{kb.key}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{kb.rca}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{kb.plan}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {kb.accuracy}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{kb.timesApplied}x</td>
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
