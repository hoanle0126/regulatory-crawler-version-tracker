'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  Globe,
  FileText,
  GitCompare,
  Activity,
  Webhook,
  ShieldAlert,
  LogOut,
  User,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api-client';

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name: string } | null>(null);
  const [healthStatus, setHealthStatus] = useState<'UP' | 'DOWN' | 'CHECKING'>('CHECKING');

  useEffect(() => {
    // Check local storage user
    const user = api.getCurrentUser();
    setCurrentUser(user);

    // Check backend health
    api
      .getHealth()
      .then((res) => {
        if (res.status === 'UP') setHealthStatus('UP');
        else setHealthStatus('DOWN');
      })
      .catch(() => setHealthStatus('DOWN'));
  }, []);

  const navLinks = [
    { href: '/', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { href: '/sources', label: 'Sources', icon: <Globe className="w-4 h-4" /> },
    { href: '/documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { href: '/changes', label: 'Change Feed', icon: <GitCompare className="w-4 h-4" /> },
    { href: '/jobs', label: 'Crawl Queue', icon: <Activity className="w-4 h-4" /> },
    { href: '/webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" /> },
    { href: '/audit-logs', label: 'Audit Trail', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800">
      {/* Synthetic Demo Warning Banner per Section 49 */}
      <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-1 text-center text-xs font-mono text-amber-300/90 flex items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        <span>PORTFOLIO DEMO ENVIRONMENT: SYNTHETIC DEMO DATA — NOT REAL LAW</span>
        <span className="hidden md:inline text-amber-500/60">•</span>
        <span className="hidden md:inline text-amber-400/80">API Port: 4101 | Web Port: 3101 | Demo Source: 5101</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 tracking-tight text-lg">
                    RegTracker
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950/80 text-sky-400 border border-sky-800/60">
                    v1.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 -mt-1 hidden sm:block">
                  Regulatory Crawler & Version Tracking System
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Status & Auth Bar */}
          <div className="flex items-center gap-3">
            {/* System Online Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'UP'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : healthStatus === 'CHECKING'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                {healthStatus === 'UP' ? 'Live API' : healthStatus === 'CHECKING' ? 'Checking...' : 'Offline'}
              </span>
            </div>

            {/* Auth Indicator */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-mono text-slate-300 max-w-[120px] truncate hidden md:inline">
                    {currentUser.email}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        : 'bg-sky-950/80 text-sky-400 border border-sky-800/60'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => api.logout()}
                  title="Log out"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/60">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
