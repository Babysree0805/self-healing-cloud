import React from 'react';
import { X, CheckCircle2, AlertTriangle, Terminal, Clock, Shield } from 'lucide-react';
import { HealthBadge } from './HealthBadge';

export const IncidentModal = ({ incident, onClose }) => {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{incident.incident_id}</h3>
                <HealthBadge status={incident.status} />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Target: <span className="text-blue-400">{incident.service_name}</span> | Type:{' '}
                <span className="text-amber-400">{incident.error_type}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RCA Details */}
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-2">
            <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Root Cause Analysis (RCA Agent)
            </div>
            <p className="text-slate-200 leading-relaxed text-xs font-normal">
              {incident.root_cause || 'Analyzing dependencies, logs, and memory metrics...'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-2">
            <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Autonomous Recovery Action Taken
            </div>
            <div className="p-2.5 rounded bg-black/60 border border-emerald-900/40 text-emerald-300">
              {incident.recovery_action || 'Executing Kubernetes pod restart & traffic reallocation...'}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
              <span className="text-[10px] text-slate-400 uppercase">Detected By</span>
              <div className="font-bold text-slate-200 mt-1">{incident.detected_by}</div>
            </div>
            <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
              <span className="text-[10px] text-slate-400 uppercase">Severity</span>
              <div className="font-bold text-rose-400 mt-1">{incident.severity}</div>
            </div>
            <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
              <span className="text-[10px] text-slate-400 uppercase">MTTR (Recovery)</span>
              <div className="font-bold text-emerald-400 mt-1">{incident.mttr_seconds || 8.4}s</div>
            </div>
            <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
              <span className="text-[10px] text-slate-400 uppercase">Status</span>
              <div className="font-bold text-blue-400 mt-1">{incident.status}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-dark-hover hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close Incident View
          </button>
        </div>
      </div>
    </div>
  );
};
