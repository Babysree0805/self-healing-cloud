import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { AgentFlowVisualizer } from '../components/AgentFlowVisualizer';
import {
  Bot,
  Activity,
  AlertCircle,
  Search,
  Cpu,
  Terminal,
  CheckCircle2,
  Database,
  Radio,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

export const AgentActivityPage = () => {
  const { agentEvents, refreshData } = useTelemetry();
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('ALL');

  const agentIcons = {
    'Monitoring Agent': Activity,
    'Anomaly Agent': AlertCircle,
    'Root Cause Agent': Search,
    'Recovery Planner': Cpu,
    'Execution Agent': Terminal,
    'Validation Agent': CheckCircle2,
    'Knowledge Base': Database,
  };

  const agentColors = {
    'Monitoring Agent': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    'Anomaly Agent': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'Root Cause Agent': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    'Recovery Planner': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    'Execution Agent': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'Validation Agent': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'Knowledge Base': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  };

  const filteredEvents = agentEvents.filter((ev) => {
    if (selectedAgentFilter === 'ALL') return true;
    return ev.agent_name === selectedAgentFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-blue-400" />
            <span>Agent Activity & Live Reasoning Stream</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            LangGraph multi-agent cognitive decision stream, root cause isolation & Kubernetes orchestration
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>7/7 SRE AGENTS ACTIVE</span>
        </div>
      </div>

      {/* Visual LangGraph Node Flow */}
      <AgentFlowVisualizer recentEvents={agentEvents} />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          'ALL',
          'Monitoring Agent',
          'Anomaly Agent',
          'Root Cause Agent',
          'Recovery Planner',
          'Execution Agent',
          'Validation Agent',
          'Knowledge Base',
        ].map((ag) => (
          <button
            key={ag}
            onClick={() => setSelectedAgentFilter(ag)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              selectedAgentFilter === ag
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-dark-card border border-dark-border text-slate-400 hover:text-slate-200'
            }`}
          >
            {ag}
          </button>
        ))}
      </div>

      {/* Live Reasoning Thought Stream Feed */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Real-Time Agent Thought Timeline</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-xl border border-dark-border space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">Agents in Active Standby</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
              The LangGraph agents are continuously polling Prometheus metrics. Trigger a failure in the Chaos Lab to watch live self-healing!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((step, idx) => {
              const Icon = agentIcons[step.agent_name] || Bot;
              const colorClass =
                agentColors[step.agent_name] || 'text-blue-400 bg-blue-500/10 border-blue-500/30';

              return (
                <div
                  key={idx}
                  className="glass-panel p-4 rounded-xl border border-dark-border hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`p-2.5 rounded-xl border ${colorClass} mt-0.5 shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-xs text-white">{step.agent_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-400 uppercase">
                          {step.action}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-mono leading-relaxed">
                        {step.reasoning}
                      </p>

                      <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{step.result}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {step.timestamp
                        ? new Date(step.timestamp).toLocaleTimeString()
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
