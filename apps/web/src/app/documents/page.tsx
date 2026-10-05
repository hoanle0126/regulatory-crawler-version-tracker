'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: status || undefined,
        documentType: documentType || undefined,
        sourceId: sourceId || undefined,
      });
      setDocuments(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getSources().then(setSources).catch(() => {});
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [page, status, documentType, sourceId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDocuments();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-paper-surface border border-rule-light p-6">
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted uppercase tracking-wider mb-1.5">
          <FileText className="w-3.5 h-3.5 text-seal-primary shrink-0" />
          <span>MỤC LỤC VĂN BẢN QUY PHẠM PHÁP LUẬT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-primary tracking-tight">
          Kho Dữ Liệu Văn Bản &amp; Cấu Trúc Điều Khoản
        </h1>
        <p className="text-xs text-ink-muted mt-1.5 font-serif italic max-w-3xl leading-relaxed">
          Tra cứu hệ thống hóa văn bản quy phạm, kiểm tra cấu trúc thứ bậc quy phạm (Chương, Điều, Khoản, Điểm), tình trạng hiệu lực và truy vết các lần sửa đổi.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-paper-surface border border-rule-light p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo trích yếu nội dung, số hiệu (ví dụ: 01/2026/TT-DEMO), hoặc định danh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-primary placeholder-ink-muted focus:outline-none focus:border-seal-primary"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-seal-primary hover:bg-seal-secondary text-paper-base text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0"
          >
            Tra Cứu
          </button>
        </form>

        <div className="flex items-center gap-3 flex-wrap text-xs font-mono text-ink-secondary pt-2 border-t border-rule-light/70">
          <div className="flex items-center gap-1.5 text-ink-muted whitespace-nowrap shrink-0">
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>Bộ lọc:</span>
          </div>

          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary focus:outline-none focus:border-seal-primary whitespace-nowrap"
          >
            <option value="">Tất cả Cổng Nguồn</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary focus:outline-none focus:border-seal-primary whitespace-nowrap"
          >
            <option value="">Tất cả Tình Trạng Hiệu Lực</option>
            <option value="EFFECTIVE">CÒN HIỆU LỰC</option>
            <option value="AMENDED">ĐÃ SỬA ĐỔI / BỔ SUNG</option>
            <option value="REPLACED">HẾT HIỆU LỰC (BỊ THAY THẾ)</option>
            <option value="EXPIRED">HẾT HIỆU LỰC TOÀN BỘ</option>
            <option value="NOT_YET_EFFECTIVE">CHƯA CÓ HIỆU LỰC</option>
          </select>

          <select
            value={documentType}
            onChange={(e) => {
              setDocumentType(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary focus:outline-none focus:border-seal-primary whitespace-nowrap"
          >
            <option value="">Tất cả Loại Văn Bản</option>
            <option value="THONG_TU">Thông tư</option>
            <option value="NGHI_DINH">Nghị định</option>
            <option value="QUYET_DINH">Quyết định</option>
            <option value="LUAT">Luật / Bộ luật</option>
          </select>

          {(search || sourceId || status || documentType) && (
            <button
              onClick={() => {
                setSearch('');
                setSourceId('');
                setStatus('');
                setDocumentType('');
                setPage(1);
              }}
              className="text-seal-primary hover:underline ml-auto whitespace-nowrap shrink-0"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-paper-surface border border-rule-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper-warm/60 border-b border-rule-strong text-ink-muted text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[320px] whitespace-nowrap">Trích Yếu Văn Bản</th>
                <th className="py-3 px-4 whitespace-nowrap w-28">Hình Thức</th>
                <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">Cơ Quan Ban Hành</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">Ngày Hiệu Lực</th>
                <th className="py-3 px-4 whitespace-nowrap w-36">Tình Trạng</th>
                <th className="py-3 px-4 whitespace-nowrap w-28 text-center">Phiên Bản</th>
                <th className="py-3 px-4 whitespace-nowrap w-28 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-light/70">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-muted font-serif italic">
                    Đang truy vấn kho dữ liệu văn bản...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-muted font-serif italic">
                    Không tìm thấy văn bản nào thỏa mãn tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-paper-warm/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-serif font-bold text-ink-primary hover:text-seal-primary transition-colors text-sm block"
                      >
                        {doc.title}
                      </Link>
                      <div className="flex items-center gap-2 text-ink-muted text-[11px] font-mono mt-1 flex-wrap">
                        <span className="font-bold text-seal-primary whitespace-nowrap">
                          {doc.documentNumber || 'Chưa có số hiệu'}
                        </span>
                        <span className="text-rule-strong">•</span>
                        <span className="truncate max-w-sm">{doc.source?.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-paper-surface border border-rule-light text-ink-secondary text-[10px] uppercase font-mono">
                        {doc.documentType || 'VĂN BẢN'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-ink-primary font-serif">
                      {doc.issuingAuthority || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-ink-secondary font-mono whitespace-nowrap">
                      {formatDate(doc.effectiveAt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-ink-primary text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-paper-warm border border-rule-light text-ink-secondary">
                        v{doc._count?.versions || 1}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-paper-surface hover:bg-paper-warm text-ink-primary text-xs font-mono font-medium border border-rule-strong transition-colors whitespace-nowrap"
                      >
                        <span>Hồ sơ</span>
                        <ArrowRight className="w-3 h-3 text-ink-muted" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Docket */}
        <div className="p-3 bg-paper-warm/40 border-t border-rule-light flex items-center justify-between text-xs font-mono text-ink-secondary">
          <div className="whitespace-nowrap">
            Hiển thị <span className="font-bold text-ink-primary">{documents.length}</span> trên tổng số{' '}
            <span className="font-bold text-ink-primary">{total}</span> văn bản
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-paper-surface border border-rule-strong disabled:opacity-40 hover:bg-paper-warm text-ink-primary transition-colors shrink-0"
              title="Trang trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 text-ink-primary font-semibold whitespace-nowrap">
              Trang {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-paper-surface border border-rule-strong disabled:opacity-40 hover:bg-paper-warm text-ink-primary transition-colors shrink-0"
              title="Trang sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
