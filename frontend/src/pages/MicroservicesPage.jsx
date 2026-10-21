import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { HealthBadge } from '../components/HealthBadge';
import { LogsModal } from '../components/LogsModal';
import { agentsApi } from '../services/api';
import {
  Server,
  Terminal,
  Activity,
  Cpu,
  Database,
  Clock,
  RotateCcw,
  Zap,
  Play,
  CheckCircle2,
} from 'lucide-react';

export const MicroservicesPage = () => {
  const { services, refreshData } = useTelemetry();
  const [selectedLogsService, setSelectedLogsService] = useState(null);
  const [triggeringService, setTriggeringService] = useState(null);
  const [triggerSuccess, setTriggerSuccess] = useState('');

  const handleManualHeal = async (serviceName) => {
    setTriggeringService(serviceName);
    try {
      await agentsApi.triggerManualHeal(serviceName);
      setTriggerSuccess(`Autonomous SRE self-healing triggered for ${serviceName}!`);
      setTimeout(() => setTriggerSuccess(''), 4000);
      refreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setTriggeringService(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Server className="w-5 h-5 text-blue-400" />
            <span>Microservice Fleet Observability</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time telemetry, resource utilization, and pod lifecycle for all ride-hailing services
          </p>
        </div>
      </div>

      {triggerSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{triggerSuccess}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {services.map((srv) => {
          const isCpuHigh = srv.cpu_usage >= 80;
          const isMemHigh = srv.memory_usage >= 80;

          return (
            <div
              key={srv.service_name}
              className="glass-panel rounded-xl border border-dark-border p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {srv.display_name}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {srv.service_name} • Port {srv.port}
                    </div>
                  </div>
                  <HealthBadge status={srv.status} size="small" />
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 space-y-3 font-mono text-xs">
                  {/* CPU Usage Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-blue-400" /> CPU Load
                      </span>
                      <span className={`font-bold ${isCpuHigh ? 'text-rose-400' : 'text-slate-200'}`}>
                        {srv.cpu_usage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-dark-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCpuHigh ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, srv.cpu_usage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Usage Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Database className="w-3 h-3 text-indigo-400" /> Memory Heap
                      </span>
                      <span className={`font-bold ${isMemHigh ? 'text-rose-400' : 'text-slate-200'}`}>
                        {srv.memory_usage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-dark-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isMemHigh ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, srv.memory_usage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-border text-[10px]">
                    <div className="p-2 rounded bg-dark-bg border border-dark-border">
                      <div className="text-slate-500">P95 Latency</div>
                      <div className="font-bold text-slate-200 mt-0.5">{srv.latency_ms.toFixed(1)}ms</div>
                    </div>
                    <div className="p-2 rounded bg-dark-bg border border-dark-border">
                      <div className="text-slate-500">Restarts</div>
                      <div className="font-bold text-slate-200 mt-0.5">{srv.restart_count}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-border">
                <button
                  onClick={() => setSelectedLogsService(srv.service_name)}
                  className="px-2.5 py-1.5 rounded-lg bg-dark-bg border border-dark-border hover:border-slate-600 text-slate-300 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3 h-3 text-blue-400" />
                  <span>Logs</span>
                </button>

                <button
                  onClick={() => handleManualHeal(srv.service_name)}
                  disabled={triggeringService === srv.service_name}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600 hover:text-white text-blue-300 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  <span>{triggeringService === srv.service_name ? 'Healing...' : 'Self-Heal'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs Inspection Modal */}
      {selectedLogsService && (
        <LogsModal
          serviceName={selectedLogsService}
          onClose={() => setSelectedLogsService(null)}
        />
      )}
    </div>
  );
};
