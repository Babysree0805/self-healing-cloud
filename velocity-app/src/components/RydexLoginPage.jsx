import React, { useState, useEffect } from 'react';
import { Shield, User, Bike, Lock, ArrowRight, Radio, CheckCircle2, AlertTriangle, Flame, RotateCcw } from 'lucide-react';
import { authApi, chaosApi } from '../services/api';

export const RydexLoginPage = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState('passenger'); // 'admin' | 'passenger' | 'driver'
  const [username, setUsername] = useState('priya_sharma');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbChaosActive, setDbChaosActive] = useState(false);
  const [chaosCountdown, setChaosCountdown] = useState(0);

  const handleRoleSelect = (role, defaultUser) => {
    setSelectedRole(role);
    setUsername(defaultUser);
    setPassword('password123');
    setError('');
  };

  // Poll active faults to check if DB_BOTTLENECK is injected anywhere in the cluster
  useEffect(() => {
    let timer;
    const checkAuthFault = async () => {
      try {
        const faults = await chaosApi.getActiveFaults();
        const hasAuthFault = Array.isArray(faults) && faults.some(f => f.failure_type === 'DB_BOTTLENECK' || f.service_name === 'auth-service');
        setDbChaosActive(hasAuthFault);
        if (!hasAuthFault && chaosCountdown > 0) {
          setChaosCountdown(0);
        } else if (hasAuthFault && chaosCountdown === 0) {
          setChaosCountdown(9.4);
        }
      } catch (e) {
        // ignore
      }
    };
    checkAuthFault();
    const interval = setInterval(checkAuthFault, 1000);
    return () => clearInterval(interval);
  }, [chaosCountdown]);

  // Countdown timer when chaos is triggered
  useEffect(() => {
    if (chaosCountdown <= 0) return;
    const t = setInterval(() => {
      setChaosCountdown((prev) => Math.max(0, Math.round((prev - 0.2) * 10) / 10));
    }, 200);
    return () => clearInterval(t);
  }, [chaosCountdown]);

  const handleSimulateDbFault = async () => {
    try {
      setError('');
      await chaosApi.injectFault('auth-service', 'DB_BOTTLENECK', 1.0, 60);
      setDbChaosActive(true);
      setChaosCountdown(9.4);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e, roleOverride = null, userOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');

    const targetRole = roleOverride || selectedRole;
    const targetUser = userOverride || username;

    if (targetRole === 'admin') {
      window.location.href = 'http://localhost:5173/';
      setLoading(false);
      return;
    }

    // 1. Proactively verify if cluster database is locked
    try {
      const activeF = await chaosApi.getActiveFaults();
      const isDbLocked = Array.isArray(activeF) && activeF.some(f => f.failure_type === 'DB_BOTTLENECK' || f.service_name === 'auth-service');
      if (isDbLocked) {
        setDbChaosActive(true);
        setError("500 Internal Server Error: Database Lock Contention on 'users' / 'trips' table. PostgreSQL connection pool exhausted (max_connections=100 reached). Authentication & login blocked. Autonomous SRE recycling connection pool (9.4s)...");
        setLoading(false);
        return; // REJECT LOGIN AND STAY ON LOGIN PAGE
      }
    } catch (e) {
      // ignore
    }

    // 2. Perform backend authentication
    try {
      const authRes = await authApi.login(targetUser, password);
      if (authRes?.access_token) {
        localStorage.setItem('velocity_token', authRes.access_token);
      }

      if (targetRole === 'passenger') {
        const userObj = {
          username: targetUser || 'priya_sharma',
          name: targetUser === 'priya_sharma' ? 'Priya Sharma' : targetUser,
          role: 'passenger',
          phone: '+91 98765 43210',
        };
        localStorage.setItem('rydex_passenger_user', JSON.stringify(userObj));
        if (onLoginSuccess) onLoginSuccess('PASSENGER', userObj);
        window.location.hash = 'passenger';
        return;
      }

      if (targetRole === 'driver') {
        const driverObj = {
          driver_id: targetUser || 'DRV-001',
          name: targetUser === 'DRV-001' ? 'Ramesh Gowda' : 'Captain ' + targetUser,
          role: 'driver',
          vehicle: 'Yamaha FZ-S (Yellow/Black)',
          plate: 'KA 05 EK 4821',
        };
        localStorage.setItem('rydex_driver_user', JSON.stringify(driverObj));
        if (onLoginSuccess) onLoginSuccess('DRIVER', driverObj);
        window.location.hash = 'driver';
        return;
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Authentication service error';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Decorative Mesh & Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFDE00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-card border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Rydex Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#FFDE00] text-black mx-auto flex items-center justify-center text-3xl font-black shadow-[0_0_25px_rgba(255,222,0,0.5)]">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">RYDEX</h1>
          <p className="text-xs text-slate-400 font-mono">
            Autonomous Urban Mobility & Logistics Cloud
          </p>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase text-center font-bold tracking-wider">
            Select Your Role
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin', 'admin')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedRole === 'admin'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="text-lg mb-1">🛡️</div>
              <div className="font-bold text-xs">Admin</div>
              <div className="text-[9px] font-mono text-slate-500">SRE Lab</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('passenger', 'priya_sharma')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedRole === 'passenger'
                  ? 'bg-[#FFDE00]/20 border-[#FFDE00] text-[#FFDE00] shadow-md ring-1 ring-[#FFDE00]/50'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="text-lg mb-1">🧑</div>
              <div className="font-bold text-xs">Passenger</div>
              <div className="text-[9px] font-mono text-slate-500">Book Rides</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('driver', 'DRV-001')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedRole === 'driver'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="text-lg mb-1">🛵</div>
              <div className="font-bold text-xs">Driver</div>
              <div className="text-[9px] font-mono text-slate-500">Captain Fleet</div>
            </button>
          </div>
        </div>

        {/* Chaos Active Live Status Banner */}
        {dbChaosActive && (
          <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-xs font-mono shadow-xl space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 animate-pulse text-amber-400" />
                <span>DB LOCK CONTENTION ACTIVE</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-mono border border-amber-400/40">
                {chaosCountdown > 0 ? `${chaosCountdown.toFixed(1)}s remaining` : 'Healing...'}
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-tight">
              PostgreSQL connection pool exhausted. Logins to Passenger & Driver apps are blocked until Autonomous SRE recycles the pool.
            </p>
            {/* Countdown Progress Bar */}
            <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-200"
                style={{ width: `${Math.max(5, (1 - chaosCountdown / 9.4) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Authentication Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-700/80 text-xs text-red-200 font-mono shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 animate-bounce" />
              <span>AUTHENTICATION BLOCKED BY CLUSTER</span>
            </div>
            <div className="text-[11px] leading-relaxed text-red-300">
              {error}
            </div>
            {error.includes('Database') && (
              <div className="pt-2 border-t border-red-800/60 text-[10px] text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span>Autonomous SRE resetting pool (9.4s)...</span>
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-2 py-0.5 rounded bg-amber-400 text-black font-bold hover:bg-amber-300 text-[10px]"
                >
                  Retry Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              {selectedRole === 'admin'
                ? 'SRE Operator Username'
                : selectedRole === 'passenger'
                ? 'Passenger Name / ID'
                : 'Captain ID'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-[#FFDE00] transition-colors font-sans text-xs"
                placeholder={
                  selectedRole === 'admin'
                    ? 'admin'
                    : selectedRole === 'passenger'
                    ? 'priya_sharma'
                    : 'DRV-001'
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              Password / Access Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-[#FFDE00] transition-colors font-sans text-xs"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all font-mono active:scale-98 ${
              selectedRole === 'admin'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : selectedRole === 'passenger'
                ? 'bg-[#FFDE00] hover:bg-[#e6c800] text-black shadow-[#FFDE00]/30 font-black'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 font-black'
            }`}
          >
            {loading
              ? 'Authenticating...'
              : selectedRole === 'admin'
              ? 'Enter SRE Operations Dashboard'
              : selectedRole === 'passenger'
              ? 'Enter Rydex Passenger App'
              : 'Enter Rydex Driver Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins & Chaos Test */}
        <div className="pt-3 border-t border-white/10 space-y-2.5 text-center">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>One-Click Persona Sign-In</span>
            <button
              onClick={handleSimulateDbFault}
              disabled={dbChaosActive}
              className="px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/50 flex items-center gap-1 font-bold text-[9px] transition-colors disabled:opacity-50"
              title="Inject DB Lock into auth-service to demonstrate failed login & autonomous healing"
            >
              <Flame className="w-2.5 h-2.5 text-red-400" />
              <span>Simulate DB Fault (9.4s)</span>
            </button>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                handleRoleSelect('passenger', 'priya_sharma');
                handleSubmit(null, 'passenger', 'priya_sharma');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300"
            >
              👩 Priya (Rider)
            </button>
            <button
              onClick={() => {
                handleRoleSelect('driver', 'DRV-001');
                handleSubmit(null, 'driver', 'DRV-001');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300"
            >
              🛵 Ramesh (Captain)
            </button>
            <button
              onClick={() => {
                handleRoleSelect('admin', 'admin');
                handleSubmit(null, 'admin', 'admin');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300"
            >
              🛡️ SRE Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
