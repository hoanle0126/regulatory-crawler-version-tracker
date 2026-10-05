'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Lock, Mail, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@regtracker.local');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'viewer') => {
    if (role === 'admin') {
      setEmail('admin@regtracker.local');
      setPassword('AdminPassword123!');
    } else {
      setEmail('viewer@regtracker.local');
      setPassword('ViewerPassword123!');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-2">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Sign In to RegTracker</h1>
        <p className="text-xs text-slate-400 font-mono">
          Regulatory Crawler &amp; Version Tracking System
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs font-mono text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Credentials Quick Fill Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-mono text-slate-400 block text-center uppercase tracking-wider">
            Quick Demo Autofill
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-600/60 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs font-mono">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Role</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Full crawl &amp; management
              </p>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('viewer')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-600/60 text-left transition-all"
            >
              <div className="flex items-center gap-1.5 font-bold text-sky-400 text-xs font-mono">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Viewer Role</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Read-only inspection
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
