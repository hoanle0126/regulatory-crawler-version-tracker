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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const user = api.getCurrentUser();
    setCurrentUser(user);

    api
      .getHealth()
      .then((res) => {
        if (res.status === 'UP') setHealthStatus('UP');
        else setHealthStatus('DOWN');
      })
      .catch(() => setHealthStatus('DOWN'));

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Tổng Quan', icon: <Activity className="w-3.5 h-3.5 shrink-0" /> },
    { href: '/sources', label: 'Cổng Giám Sát', icon: <Globe className="w-3.5 h-3.5 shrink-0" /> },
    { href: '/documents', label: 'Kho Văn Bản', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
    { href: '/changes', label: 'Bản Tin Điều Chỉnh', icon: <GitCompare className="w-3.5 h-3.5 shrink-0" /> },
    { href: '/jobs', label: 'Tiến Trình Thu Thập', icon: <Activity className="w-3.5 h-3.5 shrink-0" /> },
    { href: '/webhooks', label: 'Tích Hợp Webhook', icon: <Webhook className="w-3.5 h-3.5 shrink-0" /> },
    { href: '/audit-logs', label: 'Nhật Ký Thẩm Tra', icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> },
  ];

  return (
    <header
      className={`sticky top-0 z-50 bg-[#fcfbfa] transition-all duration-200 border-b ${
        scrolled
          ? 'bg-[#fcfbfa] border-[#c8beaa] shadow-md'
          : 'bg-[#fcfbfa] border-[#ded7c8] shadow-xs'
      }`}
    >
      {/* Synthetic Demo Advisory Banner */}
      <div className="bg-[#f3efe6] border-b border-[#ded7c8] px-4 py-1 text-center text-[11px] font-mono text-ink-secondary flex items-center justify-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="font-bold tracking-wider text-ink-primary">
            MÔI TRƯỜNG THỬ NGHIỆM ĐỘC LẬP: DỮ LIỆU PHÁP ĐIỂN MẪU
          </span>
        </div>
        <span className="hidden md:inline text-rule-strong">•</span>
        <span className="hidden md:inline whitespace-nowrap text-ink-muted shrink-0">
          API: 4101 | Web: 3101 | Nguồn Mẫu: 5101 | PostgreSQL: 55432
        </span>
      </div>

      {/* Tier 1: Gazette Masthead */}
      <div className="bg-[#fcfbfa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 border-b border-[#ebe7de] gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-3 group whitespace-nowrap">
              <div className="w-8 h-8 bg-seal-primary flex items-center justify-center text-paper-base shadow-xs shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-ink-primary tracking-tight text-lg leading-none">
                    RegTracker
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-paper-warm text-ink-secondary border border-rule-light leading-none">
                    v1.0
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted hidden sm:block mt-0.5">
                  Hệ thống Giám sát &amp; So chiếu Căn cứ Pháp lý
                </span>
              </div>
            </Link>
          </div>

          {/* Right Status & Auth Docket */}
          <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            {/* System Online Badge */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-paper-warm/60 border border-rule-light text-xs shrink-0 whitespace-nowrap">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  healthStatus === 'UP'
                    ? 'bg-diff-insert-text'
                    : healthStatus === 'CHECKING'
                    ? 'bg-amber-600 animate-pulse'
                    : 'bg-diff-delete-text'
                }`}
              />
              <span className="text-ink-secondary font-mono text-[11px] whitespace-nowrap">
                {healthStatus === 'UP'
                  ? 'Máy chủ :4101 Sẵn sàng'
                  : healthStatus === 'CHECKING'
                  ? 'Đang kiểm tra...'
                  : 'Mất kết nối API'}
              </span>
            </div>

            {/* Auth Indicator */}
            {currentUser ? (
              <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-paper-surface border border-rule-strong shrink-0 whitespace-nowrap">
                  <User className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  <span className="text-xs font-mono text-ink-primary max-w-[140px] truncate hidden md:inline">
                    {currentUser.email}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 font-mono font-bold tracking-wider shrink-0 uppercase border ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-paper-warm text-seal-primary border-rule-strong'
                        : 'bg-paper-surface text-ink-muted border-rule-light'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => api.logout()}
                  title="Đăng xuất"
                  className="p-1.5 bg-paper-surface hover:bg-paper-warm border border-rule-strong text-ink-secondary hover:text-diff-delete-text transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 bg-seal-primary hover:bg-seal-secondary text-paper-base text-xs font-mono font-semibold transition-colors shrink-0 whitespace-nowrap"
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Tier 2: Dedicated Navigation Ledger Bar */}
      <div className="bg-[#f8f6f0] border-t border-[#ebe7de]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 overflow-x-auto py-1 no-scrollbar flex-nowrap">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isActive
                      ? 'border-seal-primary text-seal-primary font-bold bg-paper-warm/70'
                      : 'border-transparent text-ink-secondary hover:text-ink-primary hover:bg-paper-warm/30'
                  }`}
                >
                  {link.icon}
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
