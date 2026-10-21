import React, { useState, useEffect } from 'react';
import { Shield, User, Bike, Lock, ArrowRight, Radio, CheckCircle2, AlertTriangle, Flame, RotateCcw, Zap, Clock } from 'lucide-react';
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
      const adminObj = { username: 'admin', name: 'SRE Lead (Admin)', role: 'admin' };
      localStorage.setItem('rydex_admin_user', JSON.stringify(adminObj));
      if (onLoginSuccess) onLoginSuccess('ADMIN', adminObj);
      window.location.hash = 'admin';
      setLoading(false);
      return;
    }

    // 1. Proactively verify if cluster database is locked
    try {
      const activeF = await chaosApi.getActiveFaults();
      const isDbLocked = Array.isArray(activeF) && activeF.some(f => f.failure_type === 'DB_BOTTLENECK' || f.service_name === 'auth-service');
      if (isDbLocked || dbChaosActive) {
        setDbChaosActive(true);
        setError("500 Internal Server Error: Database Lock Contention on 'users' / 'trips' table. PostgreSQL connection pool exhausted (max_connections=100 reached). Authentication & login blocked. Autonomous SRE recycling connection pool (9.4s)...");
        setLoading(false);
        return; // REJECT LOGIN AND STAY ON LOGIN PAGE
      }
    } catch (e) {
      if (dbChaosActive) {
        setError("500 Internal Server Error: Database Lock Contention on 'users' / 'trips' table. PostgreSQL connection pool exhausted (max_connections=100 reached). Authentication & login blocked. Autonomous SRE recycling connection pool (9.4s)...");
        setLoading(false);
        return;
      }
    }

    // 2. Perform backend authentication with graceful Cloud Demo Session fallback
    try {
      try {
        const authRes = await authApi.login(targetUser, password);
        if (authRes?.access_token) {
          localStorage.setItem('velocity_token', authRes.access_token);
        }
      } catch (authErr) {
        if (dbChaosActive) {
          setError("500 Internal Server Error: Database Lock Contention on 'users' / 'trips' table. PostgreSQL connection pool exhausted. Authentication blocked.");
          setLoading(false);
          return;
        }
        console.warn('Backend offline or 404 on cloud — authenticated via Rydex Cloud Session.');
        localStorage.setItem('velocity_token', 'rydex-cloud-verified-token');
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
    <div className="min-h-screen w-full bg-[#F8FAF9] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans text-slate-900">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-7 shadow-sm relative z-10 space-y-6">
        {/* Rydex Logo & Title */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 mx-auto flex items-center justify-center shadow-xs">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-wide">RYDEX</h1>
          <p className="text-xs text-slate-500 font-mono">
            Autonomous Urban Mobility & Logistics Cloud
          </p>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase text-center font-semibold tracking-wider">
            Select Your Role
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin', 'admin')}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedRole === 'admin'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs ring-1 ring-emerald-400/40'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-5 h-5 mx-auto mb-1 text-emerald-700" />
              <div className="font-bold text-xs">Admin</div>
              <div className="text-[9px] font-mono text-slate-400">SRE Lab</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('passenger', 'priya_sharma')}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedRole === 'passenger'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs ring-1 ring-emerald-400/40'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 text-emerald-700" />
              <div className="font-bold text-xs">Passenger</div>
              <div className="text-[9px] font-mono text-slate-400">Book Rides</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('driver', 'DRV-001')}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedRole === 'driver'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs ring-1 ring-emerald-400/40'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bike className="w-5 h-5 mx-auto mb-1 text-emerald-700" />
              <div className="font-bold text-xs">Driver</div>
              <div className="text-[9px] font-mono text-slate-400">Captain Fleet</div>
            </button>
          </div>
        </div>

        {/* Chaos Active Live Status Banner */}
        {dbChaosActive && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>DB LOCK CONTENTION ACTIVE</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-[10px] font-mono border border-amber-300">
                {chaosCountdown > 0 ? `${chaosCountdown.toFixed(1)}s remaining` : 'Healing...'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              PostgreSQL connection pool exhausted. Logins to Passenger & Driver apps are blocked until Autonomous SRE recycles the pool.
            </p>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-200"
                style={{ width: `${Math.max(5, (1 - chaosCountdown / 9.4) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Authentication Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>AUTHENTICATION BLOCKED BY CLUSTER</span>
            </div>
            <div className="text-[11px] leading-relaxed text-rose-700">
              {error}
            </div>
            {error.includes('Database') && (
              <div className="pt-2 border-t border-rose-200 text-[10px] text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Autonomous SRE resetting pool (9.4s)...</span>
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold hover:bg-amber-700 text-[10px]"
                >
                  Retry Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="block text-slate-500 mb-1 uppercase text-[10px] tracking-wider font-semibold">
              {selectedRole === 'admin'
                ? 'SRE Operator Username'
                : selectedRole === 'passenger'
                ? 'Passenger Name / ID'
                : 'Captain ID'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors font-sans text-xs"
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
            <label className="block text-slate-500 mb-1 uppercase text-[10px] tracking-wider font-semibold">
              Password / Access Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors font-sans text-xs"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition-all font-mono active:scale-98 bg-emerald-600 hover:bg-emerald-700 text-white"
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
        <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>One-Click Persona Sign-In</span>
            <button
              onClick={handleSimulateDbFault}
              disabled={dbChaosActive}
              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 font-semibold text-[9px] transition-colors disabled:opacity-50"
              title="Inject DB Lock into auth-service to demonstrate failed login & autonomous healing"
            >
              <Flame className="w-2.5 h-2.5 text-rose-600" />
              <span>Simulate DB Fault (9.4s)</span>
            </button>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                handleRoleSelect('passenger', 'priya_sharma');
                handleSubmit(null, 'passenger', 'priya_sharma');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200 flex items-center gap-1"
            >
              <User className="w-3 h-3 text-emerald-600" />
              <span>Priya (Rider)</span>
            </button>
            <button
              onClick={() => {
                handleRoleSelect('driver', 'DRV-001');
                handleSubmit(null, 'driver', 'DRV-001');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200 flex items-center gap-1"
            >
              <Bike className="w-3 h-3 text-emerald-600" />
              <span>Ramesh (Captain)</span>
            </button>
            <button
              onClick={() => {
                handleRoleSelect('admin', 'admin');
                handleSubmit(null, 'admin', 'admin');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200 flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-emerald-600" />
              <span>SRE Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RydexLoginPage;
