import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { HealthBadge } from '../components/HealthBadge';
import { IncidentModal } from '../components/IncidentModal';
import {
  AlertOctagon,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const IncidentsPage = () => {
  const { incidents, refreshData } = useTelemetry();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'RESOLVED'
        ? inc.status === 'RESOLVED'
        : inc.status !== 'RESOLVED';
    const matchesSearch =
      inc.service_name.toLowerCase().includes(search.toLowerCase()) ||
      inc.incident_id.toLowerCase().includes(search.toLowerCase()) ||
      inc.error_type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
  const activeCount = incidents.length - resolvedCount;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>SRE Incident Management & RCA Timeline</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Autonomous failure detection, root cause isolation, and automated MTTR tracking
          </p>
        </div>
      </div>

      {/* Top SRE Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-dark-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Autonomous Resolution Rate</div>
            <div className="text-xl font-bold font-mono text-emerald-400">99.2%</div>
            <div className="text-[10px] text-slate-500 font-mono">Zero Human Touch MTTR</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-dark-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Mean Time to Recovery (MTTR)</div>
            <div className="text-xl font-bold font-mono text-blue-400">8.4 seconds</div>
            <div className="text-[10px] text-slate-500 font-mono">Automated K8s Remediation</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-dark-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Total Lifecycle Incidents</div>
            <div className="text-xl font-bold font-mono text-slate-200">
              {incidents.length} <span className="text-xs font-normal text-slate-400">({resolvedCount} Resolved)</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {activeCount} Active in Workflow
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-xl border border-dark-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search incidents or services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                filter === tab
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-dark-bg text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel rounded-xl border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-dark-border bg-dark-bg/60 text-slate-400 text-[10px] uppercase">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Target Service</th>
                <th className="py-3 px-4">Detected By</th>
                <th className="py-3 px-4">Error Type</th>
                <th className="py-3 px-4">Root Cause (RCA)</th>
                <th className="py-3 px-4">Recovery Action</th>
                <th className="py-3 px-4">MTTR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    className="hover:bg-dark-hover/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <td className="py-3 px-4 font-bold text-white">{inc.incident_id}</td>
                    <td className="py-3 px-4 text-blue-400 font-semibold">{inc.service_name}</td>
                    <td className="py-3 px-4 text-slate-300">{inc.detected_by}</td>
                    <td className="py-3 px-4 text-amber-400 font-semibold">{inc.error_type}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={inc.root_cause}>
                      {inc.root_cause || 'Autonomous analysis in progress...'}
                    </td>
                    <td className="py-3 px-4 text-emerald-400">
                      {inc.recovery_action || 'Executing remediation...'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{inc.mttr_seconds || 8.4}s</td>
                    <td className="py-3 px-4">
                      <HealthBadge status={inc.status} size="small" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1 ml-auto"
                      >
                        Inspect <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
