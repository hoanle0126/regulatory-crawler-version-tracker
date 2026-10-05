'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { StatsCard } from '../../components/StatsCard';
import { formatDate } from '../../lib/utils';

export default function JobsPage() {
  const [crawls, setCrawls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadCrawls = async () => {
    try {
      setLoading(true);
      const res = await api.getCrawls({ pageSize: 50 });
      setCrawls(res.items || []);
    } catch (err: any) {
      console.error('Failed to load crawl queue runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrawls();
  }, []);

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      await api.retryCrawl(id);
      setTimeout(() => {
        loadCrawls();
        setRetryingId(null);
      }, 2000);
    } catch (err: any) {
      alert(`Không thể kích hoạt lại lượt cào: ${err.message}`);
      setRetryingId(null);
    }
  };

  const queuedCount = crawls.filter((c) => c.status === 'QUEUED').length;
  const runningCount = crawls.filter((c) => c.status === 'RUNNING').length;
  const successCount = crawls.filter((c) => c.status === 'SUCCESS').length;
  const failedCount = crawls.filter((c) => c.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule-light">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-primary flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-seal-primary shrink-0" />
            <span className="whitespace-nowrap">Hàng đợi Giám sát &amp; Thực thi Tác vụ</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1 font-mono">
            Hàng đợi BullMQ, trạng thái tiến trình nền (workers), độ trễ thu thập và điều phối thử lại tự động.
          </p>
        </div>

        <button
          onClick={loadCrawls}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-paper-surface hover:bg-paper-warm text-ink-primary text-xs font-mono border border-rule-strong transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-seal-primary' : 'text-ink-muted'}`} />
          <span className="whitespace-nowrap">Làm mới Hàng đợi</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Đang chờ xử lý" value={queuedCount} badge="BullMQ" variant="default" />
        <StatsCard title="Tiến trình đang chạy" value={runningCount} badge="Active" variant="warning" />
        <StatsCard title="Lượt hoàn tất" value={successCount} badge="Thành công" variant="success" />
        <StatsCard
          title="Lỗi thu thập"
          value={failedCount}
          badge={failedCount > 0 ? 'Cần xử lý' : 'Ổn định'}
          variant={failedCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Crawl Runs Table */}
      <div className="bg-paper-surface border border-rule-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper-warm/60 border-b border-rule-strong text-ink-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Mã phiên</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[200px]">Nguồn giám sát</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Cơ chế kích hoạt</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Bắt đầu</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Thời lượng</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap text-center">Văn bản tìm thấy</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">Trạng thái</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap min-w-[160px]">Ghi chú / Lỗi</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-light/70">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink-muted">
                    Đang tải nhật ký hàng đợi thực thi...
                  </td>
                </tr>
              ) : crawls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink-muted">
                    Chưa có lượt thu thập nào trong lịch sử tác vụ.
                  </td>
                </tr>
              ) : (
                crawls.map((crawl) => {
                  const isRetrying = retryingId === crawl.id;
                  const duration =
                    crawl.startedAt && crawl.completedAt
                      ? `${(
                          (new Date(crawl.completedAt).getTime() -
                            new Date(crawl.startedAt).getTime()) /
                          1000
                        ).toFixed(1)}s`
                      : '—';

                  return (
                    <tr key={crawl.id} className="hover:bg-paper-warm/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-ink-muted whitespace-nowrap">
                        {crawl.id.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-3.5 font-serif font-bold text-ink-primary">
                        {crawl.source?.name || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-ink-secondary whitespace-nowrap">{crawl.trigger}</td>
                      <td className="py-2.5 px-3.5 text-ink-secondary whitespace-nowrap">{formatDate(crawl.startedAt)}</td>
                      <td className="py-2.5 px-3.5 text-ink-primary font-medium whitespace-nowrap">{duration}</td>
                      <td className="py-2.5 px-3.5 text-ink-primary font-semibold text-center whitespace-nowrap">{crawl.documentsDiscovered}</td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <StatusBadge status={crawl.status} type="crawl" size="sm" />
                      </td>
                      <td className="py-2.5 px-3.5 text-ink-muted max-w-xs truncate">
                        {crawl.errorMessage ? (
                          <span className="text-diff-delete-text font-medium">{crawl.errorMessage}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        {crawl.status === 'FAILED' ? (
                          <button
                            onClick={() => handleRetry(crawl.id)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper-surface hover:bg-paper-warm border border-diff-delete-text text-diff-delete-text text-[11px] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <RotateCcw className={`w-3 h-3 shrink-0 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span className="whitespace-nowrap">Thử lại</span>
                          </button>
                        ) : (
                          <span className="text-rule-strong">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
