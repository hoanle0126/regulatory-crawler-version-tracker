'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  FileText,
  GitCompare,
  AlertOctagon,
  RefreshCw,
  Play,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../lib/utils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [crawls, setCrawls] = useState<any[]>([]);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sourcesRes, docsRes, changesRes, crawlsRes] = await Promise.all([
        api.getSources().catch(() => []),
        api.getDocuments({ pageSize: 5 }).catch(() => ({ items: [], total: 0 })),
        api.getChanges({ pageSize: 5 }).catch(() => ({ items: [], total: 0 })),
        api.getCrawls({ pageSize: 5 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setSources(sourcesRes);
      setDocuments(docsRes.items || []);
      setChanges(changesRes.items || []);
      setCrawls(crawlsRes.items || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerCrawl = async (sourceId: string) => {
    try {
      setCrawlingId(sourceId);
      setActionMessage(null);
      await api.triggerCrawl(sourceId);
      setActionMessage('Đã đưa tác vụ thu thập vào hàng đợi BullMQ! Đang tiến hành bóc tách.');
      setTimeout(() => {
        loadData();
        setCrawlingId(null);
      }, 2500);
    } catch (err: any) {
      setActionMessage(`Lỗi thu thập: ${err.message}`);
      setCrawlingId(null);
    }
  };

  const totalDocsCount = documents.length > 0 ? documents.length : sources.reduce((acc, s) => acc + (s._count?.documents || 0), 0);
  const failedCrawlsCount = crawls.filter((c) => c.status === 'FAILED').length;

  return (
    <div className="space-y-8">
      {/* Formal Legislative Header */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-[#f2eee5] border border-[#ded7c8] text-ink-700 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#193354]" />
              <span>BÀN LÀM VIỆC GIÁM SÁT THỂ CHẾ &amp; PHÁP ĐIỂN HÓA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-ink-950">
              Giám Sát Quy Định &amp; Truy Vết Thay Đổi Pháp Lý
            </h1>
            <p className="text-sm font-serif text-ink-700 leading-relaxed pt-1">
              Hệ thống theo dõi các công báo và cổng pháp luật Việt Nam; lưu trữ nguyên trạng bản chụp HTML/PDF; phân tách cây cấu trúc thứ bậc quy phạm (Chương, Điều, Khoản, Điểm) và đối chiếu chi tiết từng từ mà không phát sinh cảnh báo giả.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-[#f7f4ed] hover:bg-[#ede8dc] text-ink-800 text-xs font-mono border border-[#ded7c8] transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-ink-600 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập Nhật Số Liệu</span>
            </button>
            <Link
              href="/sources"
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-sm bg-[#193354] hover:bg-[#132842] text-white text-xs font-medium transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Quản Lý Cổng Dữ Liệu</span>
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-sm bg-[#fefce8] border border-[#fef08a] text-xs font-mono text-[#854d0e] flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-[#854d0e] hover:text-black">✕</button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Cổng Đang Giám Sát"
          value={sources.length}
          subtext={`${sources.filter((s) => s.enabled).length} lịch tự động đang chạy`}
          icon={<Globe className="w-5 h-5 text-[#193354]" />}
          variant="default"
        />
        <StatsCard
          title="Văn Bản Đã Lưu Trữ"
          value={totalDocsCount}
          subtext="Văn bản quy phạm trong cơ sở dữ liệu"
          icon={<FileText className="w-5 h-5 text-[#166534]" />}
          variant="success"
        />
        <StatsCard
          title="Bản Tin Điều Chỉnh"
          value={changes.length}
          subtext="Biên bản đối chiếu cấu trúc phát hiện"
          icon={<GitCompare className="w-5 h-5 text-[#854d0e]" />}
          variant="warning"
        />
        <StatsCard
          title="Tiến Trình Cần Lưu Ý"
          value={failedCrawlsCount}
          subtext={failedCrawlsCount === 0 ? 'Tất cả đường ống vận hành ổn định' : 'Có lỗi thu thập cần thẩm tra'}
          icon={<AlertOctagon className="w-5 h-5 text-[#991b1b]" />}
          variant={failedCrawlsCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Two Column Layout: Monitored Sources & Recent Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monitored Sources Health (2 Cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#ded7c8]">
            <h2 className="text-base font-serif font-bold text-ink-950 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#193354]" />
              <span>Danh Mục Cổng Pháp Luật Được Giám Sát</span>
            </h2>
            <Link
              href="/sources"
              className="text-xs font-mono text-[#193354] hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả ({sources.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="p-8 bg-[#fdfdfc] border border-[#ded7c8] text-center text-ink-500 text-xs font-serif italic">
                Chưa có nguồn giám sát nào được cấu hình.
              </div>
            ) : (
              sources.map((source) => {
                const isCrawling = crawlingId === source.id;
                const lastRun = source.crawlRuns?.[0];

                return (
                  <div
                    key={source.id}
                    className="p-4 bg-[#fdfdfc] border border-[#ded7c8] hover:border-[#193354] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sources/${source.id}`}
                          className="font-serif font-bold text-sm text-ink-950 hover:text-[#193354] transition-colors"
                        >
                          {source.name}
                        </Link>
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono bg-[#f2eee5] text-ink-700 border border-[#ded7c8]">
                          {source.adapterType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-600 font-mono">
                        <span className="truncate max-w-[220px]">{source.baseUrl}</span>
                        <span>•</span>
                        <span>{source._count?.documents || 0} văn bản</span>
                        <span>•</span>
                        <span>Lịch: {source.scheduleCron || 'Thủ công'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {lastRun && (
                        <div className="text-right hidden sm:block">
                          <StatusBadge status={lastRun.status} type="crawl" size="sm" />
                          <div className="text-[10px] text-ink-500 font-mono mt-0.5">
                            {formatDate(lastRun.startedAt)}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleTriggerCrawl(source.id)}
                        disabled={isCrawling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#f7f4ed] hover:bg-[#ede8dc] text-[#193354] border border-[#ded7c8] text-xs font-mono transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        <Play className={`w-3 h-3 fill-current ${isCrawling ? 'animate-spin' : ''}`} />
                        <span>{isCrawling ? 'Đang chạy...' : 'Thu Thập Ngay'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Detected Changes Feed (1 Col) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#ded7c8]">
            <h2 className="text-base font-serif font-bold text-ink-950 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#854d0e]" />
              <span>Biên Bản Điều Chỉnh Mới Nhất</span>
            </h2>
            <Link
              href="/changes"
              className="text-xs font-mono text-[#193354] hover:underline flex items-center gap-1"
            >
              <span>Xem toàn bộ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {changes.length === 0 ? (
              <div className="p-8 bg-[#fdfdfc] border border-[#ded7c8] text-center text-ink-500 text-xs font-serif italic">
                Chưa có văn bản sửa đổi nào được phát hiện. Nhấn &quot;Thu Thập Ngay&quot; sau khi nguồn mẫu chuyển sang V2!
              </div>
            ) : (
              changes.map((change) => (
                <div
                  key={change.id}
                  className="p-4 bg-[#fdfdfc] border border-[#ded7c8] hover:border-[#854d0e] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={change.status} type="changeset" size="sm" />
                    <span className="text-[10px] font-mono text-ink-500">
                      {formatDate(change.detectedAt)}
                    </span>
                  </div>

                  <Link
                    href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                    className="block text-xs font-serif font-bold text-ink-950 hover:text-[#193354] transition-colors line-clamp-2"
                  >
                    {change.document?.documentNumber ? `${change.document.documentNumber}: ` : ''}
                    {change.document?.title || 'Văn bản quy phạm pháp luật'}
                  </Link>

                  <p className="text-[11px] font-serif italic text-ink-700 bg-[#faf8f4] p-2 rounded-sm border border-[#ede7d8]">
                    {change.summary}
                  </p>

                  <div className="pt-1 flex justify-end">
                    <Link
                      href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                      className="text-xs font-mono text-[#193354] font-medium hover:underline flex items-center gap-1"
                    >
                      <span>Xem bảng đối chiếu Redline</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
