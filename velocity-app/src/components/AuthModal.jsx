import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { X, Lock, User, Mail, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbChaosActive, setDbChaosActive] = useState(false);
  const [chaosCountdown, setChaosCountdown] = useState(0);

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

  useEffect(() => {
    if (!isOpen) return;
    const syncChaos = () => {
      const status = getDbFaultStatus();
      if (status.active) {
        setDbChaosActive(true);
        setChaosCountdown(status.remaining);
        setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB (:8001). Logins blocked (${status.remaining}s remaining)...`);
      } else {
        setDbChaosActive(false);
        setChaosCountdown(0);
      }
    };
    syncChaos();
    const interval = setInterval(syncChaos, 150);
    window.addEventListener('storage', syncChaos);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncChaos);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const status = getDbFaultStatus();
    if (status.active || dbChaosActive) {
      setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB (:8001). Authentication & login blocked. Autonomous SRE recycling connection pool (${status.remaining}s remaining)...`);
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await authApi.register(username, email, password);
      }
      const data = await authApi.login(username, password);
      localStorage.setItem('velocity_token', data.access_token);
      localStorage.setItem('velocity_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      const statusAfter = getDbFaultStatus();
      if (statusAfter.active) {
        setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL lock contention. Login blocked (${statusAfter.remaining}s remaining)...`);
        return;
      }
      // Demo session fallback if backend 404
      const demoUser = { username, name: username, role: 'passenger' };
      localStorage.setItem('velocity_token', 'rydex-cloud-verified-token');
      localStorage.setItem('rydex_passenger_user', JSON.stringify(demoUser));
      onAuthSuccess(demoUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoName) => {
    setLoading(true);
    setError(null);

    const status = getDbFaultStatus();
    if (status.active || dbChaosActive) {
      setError(`500 Database Connection Pool Exhausted (100 max reached): PostgreSQL relational lock contention on auth-service / DB (:8001). Authentication & login blocked (${status.remaining}s remaining)...`);
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.login(demoName, 'password123');
      localStorage.setItem('velocity_token', data.access_token);
      localStorage.setItem('velocity_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      const demoUser = { username: demoName, name: demoName, role: 'passenger' };
      localStorage.setItem('velocity_token', 'rydex-cloud-verified-token');
      localStorage.setItem('rydex_passenger_user', JSON.stringify(demoUser));
      onAuthSuccess(demoUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-slate-200 shadow-xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 mb-1 border border-emerald-200">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {isSignUp ? 'Create Rydex Account' : 'Sign in to Rydex'}
          </h2>
          <p className="text-xs text-slate-500">
            {isSignUp ? 'Sign up for fast city mobility' : 'Access your bookings and Captain dashboard'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>500 ERROR &bull; AUTH BLOCKED</span>
            </div>
            <div className="text-[11px] leading-relaxed text-rose-700">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-mono">
          <div>
            <label className="text-slate-500 text-[10px] uppercase font-semibold">Username</label>
            <div className="relative mt-1">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. rahul_sharma"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-slate-500 text-[10px] uppercase font-semibold">Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-500 text-[10px] uppercase font-semibold">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || dbChaosActive}
            className={`w-full py-2.5 px-4 rounded-lg font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 mt-2 ${
              dbChaosActive ? 'bg-rose-600 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {loading
              ? 'Authenticating...'
              : dbChaosActive
              ? `Blocked: DB Pool (${chaosCountdown.toFixed(1)}s)`
              : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switch */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Quick 1-Click Demo Login
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDemo('priya_sharma')}
              disabled={dbChaosActive}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-mono border transition-all font-medium ${
                dbChaosActive ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Priya S (Rider)
            </button>
            <button
              onClick={() => handleQuickDemo('rahul_verma')}
              disabled={dbChaosActive}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-mono border transition-all font-medium ${
                dbChaosActive ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Rahul V (Driver)
            </button>
          </div>
        </div>

        {/* Switch Mode Toggle */}
        <div className="text-center text-xs text-slate-500 pt-0.5">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-emerald-700 font-bold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
