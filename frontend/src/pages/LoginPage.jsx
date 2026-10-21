import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('sre_lead');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('admin');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'passenger' || username === 'passenger') {
      window.location.href = 'http://localhost:5174/#passenger';
      return;
    }
    if (selectedRole === 'driver' || username === 'driver') {
      window.location.href = 'http://localhost:5174/#driver';
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleRoleSelect = (roleKey, userVal) => {
    setSelectedRole(roleKey);
    setUsername(userVal);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Mesh */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel border border-dark-border rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Rydex & Cloud Control Center</h2>
          <p className="text-xs text-slate-400 font-mono">
            Autonomous Self-Healing Infrastructure • Urban Mobility
          </p>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase text-center font-bold tracking-wider">
            Select Portal Role
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin', 'admin')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === 'admin'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-dark-bg border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              <div className="text-base mb-1">🛡️</div>
              <div className="font-semibold text-xs">Admin</div>
              <div className="text-[9px] font-mono text-slate-500">SRE Cluster</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('passenger', 'passenger')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === 'passenger'
                  ? 'bg-[#FFDE00]/20 border-[#FFDE00] text-[#FFDE00] shadow-md ring-1 ring-[#FFDE00]/50'
                  : 'bg-dark-bg border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              <div className="text-base mb-1">🧑</div>
              <div className="font-semibold text-xs">Passenger</div>
              <div className="text-[9px] font-mono text-slate-500">Rydex Rider</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('driver', 'driver')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === 'driver'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                  : 'bg-dark-bg border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              <div className="text-base mb-1">🛵</div>
              <div className="font-semibold text-xs">Driver</div>
              <div className="text-[9px] font-mono text-slate-500">Rydex Fleet</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              {selectedRole === 'admin' ? 'Operator Username' : selectedRole === 'passenger' ? 'Passenger ID / Mobile' : 'Captain Driver ID'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-sans text-xs"
                placeholder={selectedRole === 'admin' ? 'admin' : selectedRole === 'passenger' ? 'priya_sharma' : 'DRV-001'}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              Password / Access Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-sans text-xs"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all font-sans ${
              selectedRole === 'admin'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : selectedRole === 'passenger'
                ? 'bg-[#FFDE00] hover:bg-[#e6c800] text-black shadow-[#FFDE00]/30 font-bold'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {loading ? 'Authenticating...' : selectedRole === 'admin' ? 'Enter SRE Operations Dashboard' : selectedRole === 'passenger' ? 'Enter Rydex Passenger App' : 'Enter Rydex Driver Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};
