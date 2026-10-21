import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { MetricCard } from '../components/MetricCard';
import { HealthBadge } from '../components/HealthBadge';
import { AgentFlowVisualizer } from '../components/AgentFlowVisualizer';
import { IncidentModal } from '../components/IncidentModal';
import {
  Activity,
  Server,
  AlertTriangle,
  Cpu,
  Database,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage = () => {
  const { overview, services, pods, activeIncidents, agentEvents, refreshData } = useTelemetry();
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Generate simulated smooth telemetry chart data
  const telemetryData = [
    { time: '10:00', cpu: overview.avg_cpu_usage - 4, memory: overview.avg_memory_usage - 2, reqs: 380, latency: 40 },
    { time: '10:05', cpu: overview.avg_cpu_usage + 2, memory: overview.avg_memory_usage + 1, reqs: 410, latency: 44 },
    { time: '10:10', cpu: overview.avg_cpu_usage - 1, memory: overview.avg_memory_usage, reqs: 395, latency: 42 },
    { time: '10:15', cpu: overview.avg_cpu_usage + 5, memory: overview.avg_memory_usage + 3, reqs: 440, latency: 48 },
    { time: '10:20', cpu: overview.avg_cpu_usage, memory: overview.avg_memory_usage, reqs: 420, latency: overview.avg_latency_ms },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Status Indicator */}
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

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border hover:border-slate-600 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cluster Health Index"
          value={`${overview.overall_health}%`}
          unit=""
          icon={Activity}
          subtitle={`${overview.healthy_services}/${overview.total_services} Services Nominal`}
          trend={overview.overall_health > 85 ? 'up' : 'down'}
          trendText={overview.cluster_status}
          color={overview.overall_health > 85 ? 'emerald' : 'amber'}
        />

        <MetricCard
          title="Active Kubernetes Pods"
          value={overview.total_pods}
          unit="Pods"
          icon={Layers}
          subtitle="All Deployments Running"
          trend="neutral"
          trendText="100% Scheduled"
          color="blue"
        />

        <MetricCard
          title="Average CPU Load"
          value={`${overview.avg_cpu_usage}%`}
          unit=""
          icon={Cpu}
          subtitle="Cluster Core Utilization"
          trend={overview.avg_cpu_usage > 70 ? 'down' : 'up'}
          trendText={overview.avg_cpu_usage > 70 ? 'High Compute' : 'Normal'}
          color={overview.avg_cpu_usage > 70 ? 'rose' : 'blue'}
        />

        <MetricCard
          title="Throughput & Latency"
          value={`${overview.total_requests_per_sec}`}
          unit="RPS"
          icon={TrendingUp}
          subtitle={`Avg Latency: ${overview.avg_latency_ms}ms`}
          trend="up"
          trendText="SLA Compliant"
          color="purple"
        />
      </div>

      {/* Live LangGraph Multi-Agent Flow Visualizer */}
      <AgentFlowVisualizer recentEvents={agentEvents} />

      {/* Active Incidents Alert Ticker */}
      {activeIncidents.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              ACTIVE SRE INCIDENTS DETECTED ({activeIncidents.length})
            </span>
            <span className="text-[10px] text-rose-300">Agents are performing autonomous RCA & Recovery</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeIncidents.map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => setSelectedIncident(inc)}
                className="p-3 rounded-lg bg-dark-bg/90 border border-rose-800/40 hover:border-rose-600 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{inc.incident_id}</span>
                    <HealthBadge status={inc.status} size="small" />
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-1">
                    {inc.service_name} • <span className="text-amber-400">{inc.error_type}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-blue-400 hover:underline flex items-center gap-1">
                  Inspect RCA <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Trends */}
        <div className="glass-panel p-5 rounded-xl border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Cluster CPU & Memory Telemetry (%)
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> CPU
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Memory
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#6B7280" fontSize={10} fontStyle="mono" />
                <YAxis stroke="#6B7280" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ingress Requests & Latency */}
        <div className="glass-panel p-5 rounded-xl border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              API Ingress Throughput (RPS)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">OpenTelemetry Gateway</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                <YAxis stroke="#6B7280" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1F2937',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reqs"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reqGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Kubernetes Pod Runtime Grid */}
      <div className="glass-panel p-5 rounded-xl border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>Kubernetes Pod Topology (Namespace: ride-hailing-system)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Live containers managed by Autonomous Self-Healing Execution Agent
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {pods.length} Pods</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-dark-border text-slate-400 text-[10px] uppercase">
                <th className="pb-2">Pod Name</th>
                <th className="pb-2">Service</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Node</th>
                <th className="pb-2">IP Address</th>
                <th className="pb-2">CPU</th>
                <th className="pb-2">Memory</th>
                <th className="pb-2 text-right">Restarts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {pods.map((pod) => (
                <tr key={pod.pod_name} className="hover:bg-dark-hover/50 transition-colors">
                  <td className="py-2.5 font-bold text-slate-200">{pod.pod_name}</td>
                  <td className="py-2.5 text-blue-400">{pod.service_name}</td>
                  <td className="py-2.5">
                    <HealthBadge status={pod.status} size="small" />
                  </td>
                  <td className="py-2.5 text-slate-400">{pod.node}</td>
                  <td className="py-2.5 text-slate-400">{pod.ip_address}</td>
                  <td className="py-2.5 text-slate-300">{pod.cpu_mcores}m</td>
                  <td className="py-2.5 text-slate-300">{pod.memory_mb}Mi</td>
                  <td className="py-2.5 text-right font-bold text-slate-200">{pod.restarts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Modal */}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
};
