import React from 'react';
import {
  Activity,
  AlertCircle,
  Search,
  Cpu,
  Terminal,
  CheckCircle2,
  Database,
  ArrowRight,
} from 'lucide-react';

export const AgentFlowVisualizer = ({ activeAgent = 'Monitoring Agent', recentEvents = [] }) => {
  const nodes = [
    {
      id: 'monitoring',
      name: 'Monitoring Agent',
      icon: Activity,
      desc: 'Prometheus & Log Ingestion',
      color: 'blue',
    },
    {
      id: 'anomaly',
      name: 'Anomaly Agent',
      icon: AlertCircle,
      desc: 'Z-Score & Pattern Match',
      color: 'amber',
    },
    {
      id: 'rca',
      name: 'Root Cause Agent',
      icon: Search,
      desc: 'Dependency & Trace Graph',
      color: 'purple',
    },
    {
      id: 'planner',
      name: 'Recovery Planner',
      icon: Cpu,
      desc: 'Strategy & K8s Command Gen',
      color: 'cyan',
    },
    {
      id: 'execution',
      name: 'Execution Agent',
      icon: Terminal,
      desc: 'kubectl Action Controller',
      color: 'emerald',
    },
    {
      id: 'validation',
      name: 'Validation Agent',
      icon: CheckCircle2,
      desc: 'Health Probe & SLA Check',
      color: 'emerald',
    },
    {
      id: 'kb',
      name: 'Knowledge Base',
      icon: Database,
      desc: 'Playbook Memory & Stats',
      color: 'indigo',
    },
  ];

  // Find latest active agent from recent events if available
  const currentActiveName = recentEvents.length > 0 ? recentEvents[0].agent_name : activeAgent;

  return (
    <div className="glass-panel p-5 rounded-xl border border-dark-border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>LangGraph Multi-Agent Orchestration Flow</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              COMPILED STATE GRAPH
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Autonomous self-healing lifecycle from telemetry breach to post-recovery validation
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Active State Engine</span>
        </div>
      </div>

      {/* Horizontal Flow Container */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          const isActive = currentActiveName === node.name;

          return (
            <React.Fragment key={node.id}>
              <div
                className={`p-3 rounded-lg border transition-all flex flex-col items-center text-center relative ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20 scale-105 z-10'
                    : 'bg-dark-card/80 border-dark-border hover:border-slate-700'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2 px-1.5 py-0.5 rounded bg-blue-500 text-[9px] font-mono font-bold text-white uppercase tracking-wider animate-pulse">
                    ACTIVE
                  </span>
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-dark-hover text-slate-400 border border-dark-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-semibold text-slate-200 line-clamp-1">
                  {node.name}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-0.5 line-clamp-1">
                  {node.desc}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
