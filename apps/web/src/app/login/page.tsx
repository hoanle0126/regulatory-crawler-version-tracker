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
      setError(err.message || 'Đăng nhập không thành công');
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
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-[#193354] text-white mb-2 shadow-xs">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-tight text-ink-950">
          Đăng Nhập RegTracker
        </h1>
        <p className="text-xs text-ink-600 font-serif italic">
          Bàn làm việc giám sát thể chế &amp; đối chiếu văn bản pháp lý
        </p>
      </div>

      <div className="bg-[#fdfdfc] border border-[#ded7c8] rounded-sm p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        {error && (
          <div className="p-3 bg-[#fdf2f2] border border-[#fecaca] text-xs font-mono text-[#991b1b]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
              Địa chỉ Thư điện tử (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
              Mật khẩu truy cập
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-sm bg-[#193354] hover:bg-[#132842] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            <span>{loading ? 'Đang xác thực thông tin...' : 'Đăng Nhập Hệ Thống'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Credentials Quick Fill Buttons */}
        <div className="pt-4 border-t border-[#ede7d8] space-y-2">
          <span className="text-[11px] font-mono text-ink-500 block text-center uppercase tracking-wider font-semibold">
            Tự động điền tài khoản mẫu (Demo)
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="p-3 bg-[#faf8f4] border border-[#ded7c8] hover:border-[#193354] text-left transition-all rounded-sm group"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#854d0e] text-xs font-mono">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Quyền Quản Trị</span>
              </div>
              <p className="text-[11px] text-ink-500 font-serif italic mt-0.5">
                Toàn quyền thu thập &amp; thiết lập
              </p>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('viewer')}
              className="p-3 bg-[#faf8f4] border border-[#ded7c8] hover:border-[#193354] text-left transition-all rounded-sm group"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#193354] text-xs font-mono">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Quyền Độc Giả</span>
              </div>
              <p className="text-[11px] text-ink-500 font-serif italic mt-0.5">
                Chỉ xem &amp; đối chiếu văn bản
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
