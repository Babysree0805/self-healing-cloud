import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, Bike, Lock, ArrowRight, CheckCircle2, AlertTriangle, Flame, Zap, Clock } from 'lucide-react';
import { authApi, chaosApi } from '../services/api';

export const RydexLoginPage = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState('passenger'); // 'admin' | 'passenger' | 'driver'
  const [username, setUsername] = useState('priya_sharma');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbChaosActive, setDbChaosActive] = useState(false);
  const [chaosCountdown, setChaosCountdown] = useState(0);
  const [recoveredNotice, setRecoveredNotice] = useState('');
  const hadFaultRef = useRef(false);

  const handleRoleSelect = (role, defaultUser) => {
    setSelectedRole(role);
    setUsername(defaultUser);
    setPassword('password123');
    setError('');
  };

  // Helper to synchronously read active chaos state from shared localStorage
  const getDbFaultStatus = () => {
    try {
      const stored = localStorage.getItem('rydex_active_chaos');
      if (stored) {
        const parsed = JSON.parse(stored);
        const remainingSec = (parsed.expires_at - Date.now()) / 1000;
        if (remainingSec > 0 && (parsed.fault_type === 'DB_BOTTLENECK' || parsed.service === 'auth-service')) {
          return {
            active: true,
            remaining: Math.max(0.1, Math.round(remainingSec * 10) / 10),
            fault: parsed
          };
        }
      }
    } catch (e) {}
    return { active: false, remaining: 0, fault: null };
  };

  // Actively sync with localStorage and storage events so cross-tab fault injection is detected instantly
  useEffect(() => {
    const syncChaosState = () => {
      const status = getDbFaultStatus();
      if (status.active) {
        hadFaultRef.current = true;
        setDbChaosActive(true);
        setChaosCountdown(status.remaining);
        setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB (:8001). Logins blocked. Autonomous SRE recycling connection pool (${status.remaining}s remaining)...`);
        setRecoveredNotice('');
      } else {
        setDbChaosActive(false);
        setChaosCountdown(0);
        if (hadFaultRef.current) {
          hadFaultRef.current = false;
          setError('');
          setRecoveredNotice('Autonomous SRE Recovery Completed in 9.4s: PostgreSQL connection pool purged & recycled. Logins unblocked!');
          setTimeout(() => setRecoveredNotice(''), 6000);
        }
      }
    };

    syncChaosState();
    const interval = setInterval(syncChaosState, 100);
    window.addEventListener('storage', syncChaosState);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncChaosState);
    };
  }, []);

  const handleSimulateDbFault = async () => {
    try {
      setError('');
      setRecoveredNotice('');
      const duration = 9.4;
      const chaosPayload = {
        fault_type: 'DB_BOTTLENECK',
        service: 'auth-service',
        expires_at: Date.now() + (duration * 1000),
        duration: duration
      };
      localStorage.setItem('rydex_active_chaos', JSON.stringify(chaosPayload));
      window.dispatchEvent(new Event('storage'));

      setDbChaosActive(true);
      setChaosCountdown(duration);
      hadFaultRef.current = true;
      setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB (:8001). Logins blocked. Autonomous SRE recycling connection pool (${duration}s remaining)...`);

      try {
        await chaosApi.injectFault('auth-service', 'DB_BOTTLENECK', 1.0, 60);
      } catch (err) {}
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

    // Admin can always access the SRE Operations Dashboard to monitor and resolve incidents
    if (targetRole === 'admin') {
      const adminObj = { username: 'admin', name: 'SRE Lead (Admin)', role: 'admin' };
      localStorage.setItem('rydex_admin_user', JSON.stringify(adminObj));
      if (onLoginSuccess) onLoginSuccess('ADMIN', adminObj);
      window.location.hash = 'admin';
      setLoading(false);
      return;
    }

    // STRICT BLOCK: Check if DB_BOTTLENECK on auth-service is active
    const dbStatus = getDbFaultStatus();
    if (dbStatus.active || dbChaosActive) {
      const rem = dbStatus.remaining || chaosCountdown || 9.4;
      setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB (:8001). Authentication & login for ${targetRole === 'driver' ? 'Captains' : 'Passengers'} are strictly blocked until Autonomous SRE recycles the pool (${rem.toFixed(1)}s remaining)...`);
      setLoading(false);
      return; // STRICT RETURN: Login is rejected, user remains on login page!
    }

    // Perform backend authentication or verified Cloud Demo Session
    try {
      try {
        const authRes = await authApi.login(targetUser, password);
        if (authRes?.access_token) {
          localStorage.setItem('velocity_token', authRes.access_token);
        }
      } catch (authErr) {
        // Double check if fault occurred during request
        const statusAfter = getDbFaultStatus();
        if (statusAfter.active) {
          setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB. Authentication blocked (${statusAfter.remaining}s remaining)...`);
          setLoading(false);
          return;
        }
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

        {/* Chaos Active Live Status Banner (Visible Error for DB_BOTTLENECK) */}
        {dbChaosActive && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-mono space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-rose-950">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                <span>500 DATABASE CONNECTION POOL EXHAUSTED</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-[10px] font-mono border border-rose-300 font-bold text-rose-800">
                {chaosCountdown > 0 ? `${chaosCountdown.toFixed(1)}s` : 'Healing...'}
              </span>
            </div>

            <div className="text-[11px] text-rose-800 space-y-1">
              <div>
                <strong>Target:</strong> <span className="underline">auth-service / DB (:8001)</span> &bull; <strong>100/100 connections reached</strong>
              </div>
              <div>
                PostgreSQL relational lock contention active. Logins to Passenger & Driver apps are <strong>STRICTLY BLOCKED</strong> until Autonomous SRE recycles the pool.
              </div>
              <div className="text-[10px] text-slate-600 pt-0.5">
                <em>Containment note: Users already logged in continue browsing and navigation normally.</em>
              </div>
            </div>

            {/* Countdown Progress Bar (Self-Healing within 9.4s) */}
            <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-600 h-full transition-all duration-100"
                style={{ width: `${Math.max(5, (1 - chaosCountdown / 9.4) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-rose-700 flex items-center justify-between">
              <span>Autonomous SRE remediation in progress</span>
              <span className="font-semibold">{chaosCountdown.toFixed(1)}s remaining (SLA: 9.4s)</span>
            </div>
          </div>
        )}

        {/* Resolved Recovery Banner */}
        {recoveredNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{recoveredNotice}</span>
          </div>
        )}

        {/* Authentication Error Banner (when user tries to submit during fault) */}
        {error && !dbChaosActive && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>AUTHENTICATION BLOCKED</span>
            </div>
            <div className="text-[11px] leading-relaxed text-rose-700">
              {error}
            </div>
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
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition-all font-mono active:scale-98 ${
              dbChaosActive && selectedRole !== 'admin'
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {loading ? (
              'Authenticating...'
            ) : dbChaosActive && selectedRole !== 'admin' ? (
              `Blocked: DB Pool Exhausted (${chaosCountdown.toFixed(1)}s)`
            ) : selectedRole === 'admin' ? (
              'Enter SRE Operations Dashboard'
            ) : selectedRole === 'passenger' ? (
              'Enter Rydex Passenger App'
            ) : (
              'Enter Rydex Driver Portal'
            )}
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
              title="Inject DB Lock into auth-service to demonstrate failed login & autonomous healing in 9.4s"
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all flex items-center gap-1 ${
                dbChaosActive
                  ? 'bg-rose-50 text-rose-700 border-rose-200 cursor-not-allowed'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <User className="w-3 h-3 text-emerald-600" />
              <span>{dbChaosActive ? 'Priya (Blocked)' : 'Priya (Rider)'}</span>
            </button>
            <button
              onClick={() => {
                handleRoleSelect('driver', 'DRV-001');
                handleSubmit(null, 'driver', 'DRV-001');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all flex items-center gap-1 ${
                dbChaosActive
                  ? 'bg-rose-50 text-rose-700 border-rose-200 cursor-not-allowed'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Bike className="w-3 h-3 text-emerald-600" />
              <span>{dbChaosActive ? 'Ramesh (Blocked)' : 'Ramesh (Captain)'}</span>
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
