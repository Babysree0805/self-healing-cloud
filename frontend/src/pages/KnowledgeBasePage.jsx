import React, { useState, useEffect } from 'react';
import { knowledgeBaseApi } from '../services/api';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Database,
  Terminal,
  Zap,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';

export const KnowledgeBasePage = () => {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({
    total_playbooks: 4,
    avg_success_rate: 98.6,
    total_automated_actions_applied: 40,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [entriesRes, statsRes] = await Promise.allSettled([
          knowledgeBaseApi.getAll(),
          knowledgeBaseApi.getStats(),
        ]);
        if (entriesRes.status === 'fulfilled') setEntries(entriesRes.value);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEntries = entries.filter(
    (e) =>
      e.issue.toLowerCase().includes(search.toLowerCase()) ||
      e.service_name.toLowerCase().includes(search.toLowerCase()) ||
      e.error_signature.toLowerCase().includes(search.toLowerCase()) ||
      e.root_cause.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>SRE Knowledge Base & AI Playbooks</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Empirical failure signatures, automated remediation strategies, and self-learning success metrics
          </p>
        </div>
      </div>

      {/* Top Playbook Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-dark-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Indexed SRE Playbooks</div>
            <div className="text-xl font-bold font-mono text-indigo-400">
              {stats.total_playbooks} Patterns
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Dynamic Knowledge Memory</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-dark-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Empirical Success Rate</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {stats.avg_success_rate}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Verified Post-Recovery SLAs</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-dark-border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Autonomous Actions Applied</div>
            <div className="text-xl font-bold font-mono text-blue-400">
              {stats.total_automated_actions_applied} Remediation Runs
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Continuous Self-Improvement</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-3 rounded-xl border border-dark-border">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search playbooks, signatures, or root causes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Playbook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntries.map((item) => (
          <div
            key={item.entry_id || item.issue}
            className="glass-panel rounded-xl border border-dark-border p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{item.issue}</h3>
                  <div className="text-[10px] font-mono text-blue-400 mt-0.5">
                    Target: {item.service_name} • Signature: {item.error_signature}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-[11px] font-mono text-emerald-400 font-bold">
                  <span>{item.success_rate}%</span>
                  <span className="text-[9px] text-emerald-500 font-normal">Success</span>
                </div>
              </div>

              {/* Root Cause Box */}
              <div className="p-3 rounded-lg bg-dark-bg border border-dark-border text-xs font-mono space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  Isolate Root Cause Pattern
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">{item.root_cause}</p>
              </div>

              {/* Solution Box */}
              <div className="p-3 rounded-lg bg-dark-bg border border-dark-border text-xs font-mono space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  Prescribed Autonomous Solution
                </div>
                <p className="text-emerald-300 leading-relaxed font-sans">{item.solution}</p>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-dark-border text-[10px] font-mono text-slate-400">
              <span>Applied {item.times_applied} times autonomously</span>
              <span className="text-blue-400 uppercase font-semibold">
                Action: {item.recovery_action}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
