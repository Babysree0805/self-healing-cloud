import React, { useState } from 'react';
import { authApi } from '../services/api';
import { X, Lock, User, Mail, ArrowRight, Zap } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(demoName, 'password123');
      localStorage.setItem('velocity_token', data.access_token);
      localStorage.setItem('velocity_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError('Unable to login. Ensure backend is running.');
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
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono">
            {error}
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
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 mt-2"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
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
              className="flex-1 py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono border border-slate-200 transition-all font-medium"
            >
              Priya S (Rider)
            </button>
            <button
              onClick={() => handleQuickDemo('rahul_verma')}
              className="flex-1 py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono border border-slate-200 transition-all font-medium"
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
