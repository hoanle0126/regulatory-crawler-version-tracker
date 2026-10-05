'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, RefreshCw, User } from 'lucide-react';
import { api } from '../../lib/api-client';
import { formatDate } from '../../lib/utils';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ pageSize: 50, search: search.trim() || undefined });
      setLogs(res.items || []);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-diff-insert-text bg-diff-insert-bg border-diff-insert-text/40';
    if (action.includes('UPDATED')) return 'text-seal-primary bg-paper-warm border-rule-strong';
    if (action.includes('DELETED')) return 'text-diff-delete-text bg-diff-delete-bg border-diff-delete-text/40';
    if (action.includes('TRIGGERED')) return 'text-ink-primary bg-paper-warm border-rule-strong';
    return 'text-ink-secondary bg-paper-surface border-rule-light';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule-light">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-primary flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-seal-primary" />
            <span>Nhật ký Kiểm toán &amp; An ninh Hệ thống</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1 font-mono">
            Sổ cái kiểm toán bất biến ghi nhận mọi thao tác cấu hình, kích hoạt tác vụ cào và sự kiện an ninh.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-paper-surface hover:bg-paper-warm text-ink-primary text-xs font-mono border border-rule-strong transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-seal-primary' : 'text-ink-muted'}`} />
          <span className="whitespace-nowrap">Làm mới Sổ cái</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-paper-surface border border-rule-light p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadLogs();
          }}
          className="relative max-w-md"
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tra cứu theo hành động, người thực hiện hoặc đối tượng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-primary placeholder-ink-muted focus:outline-none focus:border-seal-primary"
          />
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-paper-surface border border-rule-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper-warm/50 border-b border-rule-strong text-ink-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Thời điểm</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Tác nhân (Actor)</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Hành động</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Thực thể</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Mã thực thể</th>
                <th className="py-2.5 px-3.5 min-w-[200px] whitespace-nowrap">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-light/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    Đang tải sổ cái kiểm toán...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    Không có bản ghi nhật ký kiểm toán nào.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-warm/40 transition-colors">
                    <td className="py-2.5 px-3.5 text-ink-secondary">{formatDate(log.createdAt)}</td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5 text-ink-primary font-medium">
                        <User className="w-3 h-3 text-ink-muted" />
                        <span>{log.actorEmail || 'Hệ thống'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold border tracking-wider uppercase font-mono ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-ink-secondary font-medium">{log.entityType}</td>
                    <td className="py-2.5 px-3.5 font-mono text-ink-muted">
                      {log.entityId ? `${log.entityId.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-ink-secondary max-w-sm truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
