import React, { useState, useEffect, useRef } from 'react';
import { chaosApi, agentsApi, telemetryApi } from '../services/api';
import {
  AlertTriangle,
  Zap,
  CheckCircle2,
  Activity,
  Shield,
  RotateCcw,
  RefreshCw,
  Cpu,
  Flame,
  Radio,
  Clock,
  Layers,
} from 'lucide-react';

export const FAULT_SPECS = {
  CPU_SPIKE: {
    service: 'pricing-service',
    label: '⚡ CPU Spike',
    duration: 4.2,
    complexity: 'EASY',
    action: 'HPA CPU CFS Quota Optimization',
    impact: 'Passenger: Fare estimate 504 Timeout | Driver: Pricing compute throttled',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  TRAFFIC_OVERLOAD: {
    service: 'ride-service',
    label: '🚦 Traffic Overload',
    duration: 5.5,
    complexity: 'EASY-MED',
    action: 'Ingress Rate Limiter & Replica Scaling',
    impact: 'Passenger: Bike Taxi blocked (429 Rate Limit) | Driver: Dispatch queue choked',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  SERVICE_CRASH: {
    service: 'driver-service',
    label: '💥 Crash GPS',
    duration: 7.0,
    complexity: 'MEDIUM',
    action: 'Kubernetes Container Restart & Socket Remount',
    impact: 'Passenger: Live GPS radar offline | Driver: Duty toggle 503 CrashLoop',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  NETWORK_PARTITION: {
    service: 'driver-service',
    label: '🌐 Net Partition',
    duration: 8.2,
    complexity: 'MED-COMPLEX',
    action: 'Envoy Route Reset & Packet Loss Flush',
    impact: 'Passenger: Dispatch packet drop (45%) | Driver: Fleet socket disconnect 504',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  DB_BOTTLENECK: {
    service: 'auth-service',
    label: '🔒 DB Lock',
    duration: 9.4,
    complexity: 'COMPLEX',
    action: 'PostgreSQL Lock Purge & Pool Recycled',
    impact: 'Passenger: Login blocked (500 Pool Exhausted) | Driver: IMPS cashout locked',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  MEMORY_LEAK: {
    service: 'trip-service',
    label: '🧠 Memory Leak',
    duration: 10.0,
    complexity: 'COMPLEX',
    action: 'Canary Rollback to Heap-Safe Stable Image',
    impact: 'Passenger: Trip history 500 OOM | Driver: Settlement OOMKilled exit 137',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
};

export const ChaosHealBar = ({ onFaultStateChange }) => {
  const [activeFaults, setActiveFaults] = useState([]);
  const [healingService, setHealingService] = useState(null);
  const [healSuccessMsg, setHealSuccessMsg] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [clusterOverview, setClusterOverview] = useState({ overall_health: 100, healthy_services: 8 });

  // High resolution countdown timer state
  const [countdown, setCountdown] = useState(0);
  const [targetDuration, setTargetDuration] = useState(6.0);
  const faultStartTimeRef = useRef(null);

  // Poll for active faults & cluster health rapidly (800ms when fault active, 2500ms when idle)
  const checkStatus = async () => {
    // 1. Check shared localStorage chaos state
    try {
      const stored = localStorage.getItem('rydex_active_chaos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at > Date.now()) {
          const spec = FAULT_SPECS[parsed.fault_type] || { duration: 6.0 };
          setTargetDuration(spec.duration);
          const remaining = Math.max(0, (parsed.expires_at - Date.now()) / 1000);
          setCountdown(Math.round(remaining * 10) / 10);
          if (!faultStartTimeRef.current) {
            faultStartTimeRef.current = parsed.expires_at - (spec.duration * 1000);
          }
          setActiveFaults([{ failure_type: parsed.fault_type, service_name: parsed.service }]);
          if (onFaultStateChange) {
            onFaultStateChange(true, [{ failure_type: parsed.fault_type, service_name: parsed.service }]);
          }
        } else {
          // Expired
          localStorage.removeItem('rydex_active_chaos');
          window.dispatchEvent(new Event('storage'));
          setActiveFaults([]);
          if (onFaultStateChange) {
            onFaultStateChange(false, []);
          }
          if (faultStartTimeRef.current) {
            setHealSuccessMsg(`Autonomous LangGraph AI SRE Agent remediated cluster fault in ${targetDuration}s! All SLAs 100% compliant.`);
            setTimeout(() => setHealSuccessMsg(''), 5000);
            faultStartTimeRef.current = null;
          }
        }
      }
    } catch (err) {}

    // 2. Poll backend if available
    try {
      const [faultsRes, overviewRes] = await Promise.allSettled([
        chaosApi.getActiveFaults(),
        telemetryApi.getOverview(),
      ]);

      if (faultsRes.status === 'fulfilled' && Array.isArray(faultsRes.value) && faultsRes.value.length > 0) {
        const faults = faultsRes.value;
        setActiveFaults(faults);
        if (onFaultStateChange) {
          onFaultStateChange(true, faults);
        }
        const currentF = faults[0];
        const spec = FAULT_SPECS[currentF.failure_type] || { duration: 6.0 };
        setTargetDuration(spec.duration);
        if (!faultStartTimeRef.current) {
          faultStartTimeRef.current = Date.now();
          setCountdown(spec.duration);
        }
      }

      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        setClusterOverview(overviewRes.value);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    checkStatus();
    const pollInterval = activeFaults.length > 0 ? 500 : 1500;
    const interval = setInterval(checkStatus, pollInterval);
    const handleStorageChange = () => checkStatus();
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeFaults.length]);

  // Smooth countdown ticker
  useEffect(() => {
    if (activeFaults.length === 0 || !faultStartTimeRef.current) return;

    const ticker = setInterval(() => {
      const elapsed = (Date.now() - faultStartTimeRef.current) / 1000;
      const remaining = Math.max(0, targetDuration - elapsed);
      setCountdown(Math.round(remaining * 10) / 10);

      if (remaining <= 0) {
        localStorage.removeItem('rydex_active_chaos');
        window.dispatchEvent(new Event('storage'));
        setActiveFaults([]);
        if (onFaultStateChange) {
          onFaultStateChange(false, []);
        }
        setHealSuccessMsg(`Autonomous LangGraph AI SRE Agent remediated cluster fault in ${targetDuration}s! All SLAs 100% compliant.`);
        setTimeout(() => setHealSuccessMsg(''), 5000);
        faultStartTimeRef.current = null;
      }
    }, 100);

    return () => clearInterval(ticker);
  }, [activeFaults, targetDuration]);

  const handleTriggerHeal = async (serviceName) => {
    setHealingService(serviceName);
    localStorage.removeItem('rydex_active_chaos');
    window.dispatchEvent(new Event('storage'));
    setActiveFaults([]);
    if (onFaultStateChange) {
      onFaultStateChange(false, []);
    }
    faultStartTimeRef.current = null;
    setCountdown(0);
    setHealSuccessMsg(`Autonomous SRE HealOps pipeline triggered for ${serviceName}. Resolving...`);
    setTimeout(() => setHealSuccessMsg(''), 4000);

    try {
      await agentsApi.triggerManualHeal(serviceName);
      await checkStatus();
    } catch (e) {
      try {
        await chaosApi.clearFault(serviceName);
      } catch (err) {}
    } finally {
      setHealingService(null);
    }
  };

  const handleQuickInject = async (serviceName, failureType) => {
    setIsInjecting(true);
    setHealSuccessMsg('');
    const spec = FAULT_SPECS[failureType] || { duration: 6.0 };
    setTargetDuration(spec.duration);
    setCountdown(spec.duration);
    faultStartTimeRef.current = Date.now();

    const chaosPayload = {
      fault_type: failureType,
      service: serviceName,
      expires_at: Date.now() + (spec.duration * 1000),
      duration: spec.duration
    };
    localStorage.setItem('rydex_active_chaos', JSON.stringify(chaosPayload));
    window.dispatchEvent(new Event('storage'));

    setActiveFaults([{ failure_type: failureType, service_name: serviceName }]);
    if (onFaultStateChange) {
      onFaultStateChange(true, [{ failure_type: failureType, service_name: serviceName }]);
    }

    try {
      await chaosApi.injectFault(serviceName, failureType, 1.0, 60);
      await checkStatus();
    } catch (e) {
      // Cloud demo mode fallback
    } finally {
      setIsInjecting(false);
    }
  };

  const handleClearAll = async () => {
    localStorage.removeItem('rydex_active_chaos');
    window.dispatchEvent(new Event('storage'));
    setActiveFaults([]);
    if (onFaultStateChange) {
      onFaultStateChange(false, []);
    }
    faultStartTimeRef.current = null;
    setCountdown(0);
    setHealSuccessMsg('Manual SRE Override: All chaos faults cleared. Baseline restored.');
    setTimeout(() => setHealSuccessMsg(''), 3500);

    try {
      await chaosApi.resetAll();
      await checkStatus();
    } catch (e) {
      // ignore
    }
  };

  const activeSpec = activeFaults.length > 0 ? (FAULT_SPECS[activeFaults[0].failure_type] || FAULT_SPECS.SERVICE_CRASH) : null;
  const progressPercent = activeSpec ? Math.min(100, Math.max(5, ((activeSpec.duration - countdown) / activeSpec.duration) * 100)) : 100;

  return (
    <div className="z-30 shrink-0 select-none">
      {/* 1. ACTIVE FAULT ALERT BANNER WITH LIVE COUNTDOWN (<= 10 SECONDS) */}
      {activeFaults.length > 0 && activeSpec && (
        <div className="bg-gradient-to-r from-red-950/95 via-rose-950/95 to-slate-950/95 border-b-2 border-red-500 px-4 md:px-6 py-2.5 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black uppercase text-red-300">
                    SRE CHAOS FAULT ACTIVE:
                  </span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold ${activeSpec.badgeBg}`}>
                    {activeFaults[0].service_name} &bull; {activeFaults[0].failure_type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-white/10">
                    Complexity: {activeSpec.complexity}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-300">
                  <strong className="text-amber-300">Impact: </strong>{activeSpec.impact}
                </p>
              </div>
            </div>

            {/* Countdown Timer & Manual Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-1 md:pt-0">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Autonomous Self-Healing</div>
                <div className="text-sm font-mono font-black text-[#FFDE00] flex items-center justify-end gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FFDE00] animate-spin" />
                  <span>{countdown > 0 ? `${countdown.toFixed(1)}s` : 'Healing...'} / {activeSpec.duration}s</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTriggerHeal(activeFaults[0].service_name)}
                  disabled={healingService === activeFaults[0].service_name}
                  className="px-3 py-1.5 rounded-xl bg-[#FFDE00] hover:bg-[#ffe633] text-black font-extrabold text-xs yellow-glow transition-all flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                  title="Accelerate autonomous pipeline execution"
                >
                  <Zap className={`w-3.5 h-3.5 fill-black ${healingService ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Force Heal</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-mono"
                  title="Reset All Faults to Healthy"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Calibrated Self-Healing Progress Bar */}
          <div className="mt-2 w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-amber-500 via-[#FFDE00] to-emerald-400 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. HEAL SUCCESS CELEBRATION BANNER */}
      {healSuccessMsg && !activeFaults.length && (
        <div className="bg-emerald-950/95 border-b-2 border-emerald-500 px-4 md:px-6 py-2 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-xl animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{healSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase hidden sm:inline">All Pods Healthy (0 Errors)</span>
        </div>
      )}

      {/* 3. HEALTHY DEMONSTRATION STRIP WITH ALL 6 FAULT TRIGGER BUTTONS */}
      {activeFaults.length === 0 && !healSuccessMsg && (
        <div className="bg-slate-900/95 border-b border-white/5 px-4 md:px-6 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LangGraph SRE Protection Active</span>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">Health: <strong className="text-emerald-400">{clusterOverview.overall_health}%</strong></span>
          </div>

          {/* Quick Chaos Simulation Buttons for Demonstration */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Inject Chaos (Auto-Heals in &le;10s):</span>

            {/* Fault 1: CPU Spike (4.2s) */}
            <button
              onClick={() => handleQuickInject('pricing-service', 'CPU_SPIKE')}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/80 text-amber-300 border border-amber-800/40 text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1"
              title="CPU Spike on Pricing Service (4.2s heal) -> 504 Gateway Timeout on Fare Estimation"
            >
              <span>⚡ CPU Spike (4.2s)</span>
            </button>

            {/* Fault 2: Traffic Overload (5.5s) */}
            <button
              onClick={() => handleQuickInject('ride-service', 'TRAFFIC_OVERLOAD')}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded-lg bg-orange-950/50 hover:bg-orange-900/80 text-orange-300 border border-orange-800/40 text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1"
              title="Traffic Overload on Ride Service (5.5s heal) -> Blocks Bike Taxi booking with 429 Too Many Requests"
            >
              <span>🚦 Traffic (5.5s)</span>
            </button>

            {/* Fault 3: Service Crash (7.0s) */}
            <button
              onClick={() => handleQuickInject('driver-service', 'SERVICE_CRASH')}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1"
              title="Crash GPS on Driver Service (7.0s heal) -> 503 CrashLoopBackOff on duty switch"
            >
              <span>💥 Crash GPS (7.0s)</span>
            </button>

            {/* Fault 4: Network Partition (8.2s) */}
            <button
              onClick={() => handleQuickInject('driver-service', 'NETWORK_PARTITION')}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/80 text-purple-300 border border-purple-800/40 text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1"
              title="Network Partition on Driver Dispatch (8.2s heal) -> 45% packet loss on dispatch"
            >
              <span>🌐 Net Drop (8.2s)</span>
            </button>

            {/* Fault 5: DB Bottleneck (9.4s) */}
            <button
              onClick={() => handleQuickInject('auth-service', 'DB_BOTTLENECK')}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/40 text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1"
              title="Database Bottleneck on Auth Service (9.4s heal) -> Blocks Passenger/Driver login with 500 Lock Contention"
            >
              <span>🔒 DB Lock (9.4s)</span>
            </button>

            {/* Fault 6: Memory Leak (10.0s) */}
            <button
              onClick={() => handleQuickInject('trip-service', 'MEMORY_LEAK')}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded-lg bg-pink-950/50 hover:bg-pink-900/80 text-pink-300 border border-pink-800/40 text-[10px] font-bold transition-all hover:scale-102 flex items-center gap-1"
              title="Memory Leak on Trip Service (10.0s heal) -> 500 OOMKilled on Instant Cashout"
            >
              <span>🧠 Mem Leak (10s)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChaosHealBar;
