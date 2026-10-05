'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  Filter,
  Search,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function ChangesPage() {
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadChanges = async () => {
    try {
      setLoading(true);
      const res = await api.getChanges({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        pageSize: 30,
      });
      setChanges(res.items || []);
    } catch (err: any) {
      console.error('Failed to load changes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoadingId(id);
      await api.updateChangeStatus(id, newStatus);
      await loadChanges();
    } catch (err: any) {
      alert(`Không thể cập nhật trạng thái: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-rule-light pb-4">
        <h1 className="text-2xl font-serif font-bold text-ink-primary flex items-center gap-2.5">
          <GitCompare className="w-5 h-5 text-seal-primary" />
          <span>Nhật ký Biến động Quy chuẩn</span>
        </h1>
        <p className="text-xs text-ink-muted mt-1 font-mono">
          Theo dõi và thẩm định biến động điều khoản, bổ sung nội dung mới hoặc bãi bỏ quy chuẩn pháp lý.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-paper-surface border border-rule-light p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadChanges();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm biến động theo tên văn bản hoặc tóm tắt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-primary placeholder-ink-muted focus:outline-none focus:border-seal-primary"
          />
        </form>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-ink-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary focus:outline-none"
          >
            <option value="">Tất cả trạng thái thẩm định</option>
            <option value="DETECTED">MỚI PHÁT HIỆN (Chưa thẩm định)</option>
            <option value="REVIEWED">ĐÃ THẨM ĐỊNH (Reviewed)</option>
            <option value="ACKNOWLEDGED">ĐÃ GHI NHẬN TÁC ĐỘNG</option>
            <option value="IGNORED">BỎ QUA (Không liên quan)</option>
          </select>
        </div>
      </div>

      {/* Changes Feed List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-ink-muted bg-paper-surface border border-rule-light">
            Đang tải dữ liệu biến động văn bản...
          </div>
        ) : changes.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-ink-muted bg-paper-surface border border-rule-light">
            Không tìm thấy biến động pháp lý nào phù hợp tiêu chí tra cứu.
          </div>
        ) : (
          changes.map((change) => {
            const isLoading = actionLoadingId === change.id;
            return (
              <div
                key={change.id}
                className="bg-paper-surface border border-rule-light hover:border-rule-strong p-4 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rule-light/70">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={change.status} type="changeset" size="sm" />
                    <span className="text-[11px] font-mono text-ink-muted">
                      Phát hiện: {formatDate(change.detectedAt)}
                    </span>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-ink-muted text-[10px] uppercase tracking-wider mr-1">Thao tác:</span>
                    <button
                      onClick={() => handleUpdateStatus(change.id, 'REVIEWED')}
                      disabled={isLoading}
                      title="Đánh dấu Đã thẩm định"
                      className="px-2.5 py-1 bg-paper-surface hover:bg-paper-warm text-seal-primary border border-rule-strong text-[11px] transition-colors"
                    >
                      Đã thẩm định
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(change.id, 'ACKNOWLEDGED')}
                      disabled={isLoading}
                      title="Ghi nhận tác động tuân thủ"
                      className="px-2.5 py-1 bg-paper-surface hover:bg-paper-warm text-diff-insert-text border border-rule-strong text-[11px] transition-colors"
                    >
                      Ghi nhận
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(change.id, 'IGNORED')}
                      disabled={isLoading}
                      title="Bỏ qua biến động"
                      className="px-2.5 py-1 bg-paper-surface hover:bg-paper-warm text-ink-muted border border-rule-strong text-[11px] transition-colors"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>

                <div>
                  <Link
                    href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                    className="text-base font-serif font-bold text-ink-primary hover:text-seal-primary transition-colors block"
                  >
                    {change.document?.documentNumber ? `${change.document.documentNumber}: ` : ''}
                    {change.document?.title || 'Văn bản Quy chuẩn'}
                  </Link>
                </div>

                <div className="p-3 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-seal-primary shrink-0" />
                    <span className="leading-relaxed">{change.summary}</span>
                  </div>

                  <Link
                    href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                    className="text-seal-primary hover:underline flex items-center gap-1 shrink-0 font-bold uppercase text-[11px] tracking-wider"
                  >
                    <span>Xem Redline Sai khác</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
