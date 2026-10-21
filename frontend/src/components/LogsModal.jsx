import React, { useState, useEffect } from 'react';
import { X, Terminal, RefreshCw } from 'lucide-react';
import { servicesApi } from '../services/api';

export const LogsModal = ({ serviceName, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!serviceName) return;
    setLoading(true);
    try {
      const res = await servicesApi.getLogs(serviceName);
      setLogs(res.logs || []);
    } catch (e) {
      setLogs([`Failed to retrieve logs for ${serviceName}`]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [serviceName]);

  if (!serviceName) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Kubernetes Pod Logs & Loki Stream
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Service: <span className="text-emerald-400">{serviceName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              title="Refresh Logs"
              className="p-1.5 rounded-lg bg-dark-bg border border-dark-border hover:border-slate-600 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs Terminal Area */}
        <div className="flex-1 my-4 p-4 rounded-xl bg-black/80 border border-dark-border font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1 select-text">
          {loading ? (
            <div className="text-slate-500">Streaming live pod logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-slate-500">No logs captured.</div>
          ) : (
            logs.map((line, idx) => {
              const isError = line.includes('ERROR') || line.includes('FATAL') || line.includes('CRITICAL');
              const isWarn = line.includes('WARN');
              const isInfo = line.includes('INFO');

              let lineClass = 'text-slate-300';
              if (isError) lineClass = 'text-rose-400 font-semibold';
              else if (isWarn) lineClass = 'text-amber-400';
              else if (isInfo) lineClass = 'text-blue-300';

              return (
                <div key={idx} className={`${lineClass} leading-relaxed break-all`}>
                  {line}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 font-mono">
          <span>Source: OpenTelemetry / Loki Ingress</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-dark-hover hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
