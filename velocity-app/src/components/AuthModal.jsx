import React, { useState } from 'react';
import { authApi } from '../services/api';
import { X, Lock, User, Mail, ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFDE00] text-black text-2xl font-black mb-2 shadow-lg">
            ⚡
          </div>
          <h2 className="text-xl font-black text-white">
            {isSignUp ? 'Create Velocity Account' : 'Welcome to Velocity'}
          </h2>
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Sign up for lightning fast city rides' : 'Sign in to book bike taxis, autos & cabs'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-300 font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Username</label>
            <div className="relative mt-1">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. rahul_sharma"
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#FFDE00]"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#FFDE00]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#FFDE00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FFDE00] hover:bg-[#ffe633] text-black font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 mt-2"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switch */}
        <div className="pt-2 border-t border-white/10 text-center space-y-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Quick 1-Click Demo Login
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDemo('priya_sharma')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all"
            >
              👩 Priya S
            </button>
            <button
              onClick={() => handleQuickDemo('rahul_verma')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono border border-white/5 transition-all"
            >
              👨 Rahul V
            </button>
          </div>
        </div>

        {/* Switch Mode Toggle */}
        <div className="text-center text-xs text-slate-400 pt-1">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#FFDE00] font-bold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
