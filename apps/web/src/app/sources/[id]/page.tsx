'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Play,
  FileText,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../../lib/api-client';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatDate } from '../../../lib/utils';

export default function SourceDetailPage() {
  const params = useParams();
  const sourceId = params.id as string;

  const [source, setSource] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadSource = async () => {
    try {
      setLoading(true);
      const [sourceData, docsData] = await Promise.all([
        api.getSource(sourceId),
        api.getDocuments({ sourceId, pageSize: 20 }),
      ]);
      setSource(sourceData);
      setDocuments(docsData.items || []);
    } catch (err: any) {
      console.error('Failed to load source details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sourceId) loadSource();
  }, [sourceId]);

  const handleCrawl = async () => {
    try {
      setCrawling(true);
      setActionMsg(null);
      await api.triggerCrawl(sourceId);
      setActionMsg('Đã khởi chạy tác vụ thu thập. Đang làm mới dữ liệu sau 3 giây...');
      setTimeout(() => {
        loadSource();
        setCrawling(false);
      }, 3000);
    } catch (err: any) {
      setActionMsg(`Lỗi thu thập: ${err.message}`);
      setCrawling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-serif italic text-ink-500">
        Đang tải thông số kỹ thuật của cổng dữ liệu pháp lý...
      </div>
    );
  }

  if (!source) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#991b1b] bg-[#fdf2f2] border border-[#fecaca]">
        Không tìm thấy nguồn dữ liệu hoặc phiên làm việc đã hết hạn.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ded7c8]">
        <Link
          href="/sources"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#193354] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh mục Cổng Dữ liệu</span>
        </Link>

        <button
          onClick={handleCrawl}
          disabled={crawling}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#193354] hover:bg-[#132842] text-white text-xs font-medium disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap shrink-0"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${crawling ? 'animate-spin' : ''}`} />
          <span>{crawling ? 'Đang thực hiện...' : 'Khởi Chạy Thu Thập Ngay'}</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-[#fefce8] border border-[#fef08a] text-xs font-mono text-[#854d0e]">
          {actionMsg}
        </div>
      )}

      {/* Source Details Card */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ded7c8]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-ink-950 tracking-tight">{source.name}</h1>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono bg-[#f2eee5] text-ink-800 border border-[#ded7c8]">
                {source.adapterType}
              </span>
            </div>
            <a
              href={source.baseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-ink-500 hover:text-[#193354] hover:underline mt-1 block truncate max-w-lg"
            >
              {source.baseUrl}
            </a>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono">
            <div>
              <span className="text-ink-500 block text-[10px] uppercase font-semibold">TỔNG VĂN BẢN</span>
              <span className="text-lg font-serif font-bold text-ink-950">{documents.length}</span>
            </div>
            <div className="border-l border-[#ded7c8] pl-5">
              <span className="text-ink-500 block text-[10px] uppercase font-semibold">CHU KỲ CRON</span>
              <span className="text-xs font-semibold text-ink-800">
                {source.scheduleCron || 'Thủ công'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-[#f8f6f0] p-4 border border-[#ded7c8]">
          <div>
            <span className="text-ink-500 block text-[10px] uppercase font-semibold">THỜI GIAN CHỜ (TIMEOUT)</span>
            <span className="text-ink-900 font-semibold">{source.timeout}ms</span>
          </div>
          <div>
            <span className="text-ink-500 block text-[10px] uppercase font-semibold">GIỚI HẠN THỬ LẠI</span>
            <span className="text-ink-900 font-semibold">{source.retryLimits} lần</span>
          </div>
          <div>
            <span className="text-ink-500 block text-[10px] uppercase font-semibold">LUỒNG SONG SONG</span>
            <span className="text-ink-900 font-semibold">{source.crawlConcurrency} tác vụ</span>
          </div>
          <div>
            <span className="text-ink-500 block text-[10px] uppercase font-semibold">TRẠNG THÁI</span>
            <span className={source.enabled ? 'text-[#166534] font-semibold' : 'text-ink-500'}>
              {source.enabled ? 'Đang kích hoạt' : 'Tạm dừng'}
            </span>
          </div>
        </div>

        {source.allowedDomains && source.allowedDomains.length > 0 && (
          <div className="text-xs font-mono">
            <span className="text-ink-500 block text-[10px] uppercase font-semibold mb-1">
              Tên Miền Được Phép (SSRF Whitelist)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {source.allowedDomains.map((dom: string) => (
                <span
                  key={dom}
                  className="px-2 py-0.5 rounded-sm bg-[#f2eee5] border border-[#ded7c8] text-ink-700 text-[11px]"
                >
                  {dom}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crawl Run History */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="p-4 bg-[#f8f6f0] border-b border-[#ded7c8] flex items-center justify-between">
          <h2 className="text-xs font-serif font-bold text-ink-950 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#193354]" />
            <span>Nhật Ký Các Đợt Thu Thập (Crawl Runs)</span>
          </h2>
          <span className="text-[11px] font-mono text-ink-600 bg-[#ede8dc] px-2 py-0.5 rounded-sm border border-[#d8d2c2]">
            {source.crawlRuns?.length || 0} đợt ghi nhận
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f5f1e8] border-b border-[#ded7c8] text-ink-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">Mã Đợt (Run ID)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Hình Thức</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Thời Gian Khởi Chạy</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Thời Lượng</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Văn Bản</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Kết Quả</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebd9]">
              {!source.crawlRuns || source.crawlRuns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-500 font-serif italic">
                    Chưa có lịch sử đợt thu thập nào được lưu trữ.
                  </td>
                </tr>
              ) : (
                source.crawlRuns.map((run: any) => {
                  const duration =
                    run.startedAt && run.completedAt
                      ? `${(
                          (new Date(run.completedAt).getTime() -
                            new Date(run.startedAt).getTime()) /
                          1000
                        ).toFixed(1)}s`
                      : '—';

                  return (
                    <tr key={run.id} className="hover:bg-[#faf6ee] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-ink-900 truncate max-w-[120px]">
                        {run.id.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-4 text-ink-600">{run.trigger}</td>
                      <td className="py-2.5 px-4 text-ink-600">{formatDate(run.startedAt)}</td>
                      <td className="py-2.5 px-4 text-ink-600">{duration}</td>
                      <td className="py-2.5 px-4 text-ink-900 font-bold">
                        {run.documentsDiscovered || 0}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={run.status} type="crawl" size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-ink-500 truncate max-w-[180px]">
                        {run.errorMessage || 'Hoàn tất thành công'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discovered Documents */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="p-4 bg-[#f8f6f0] border-b border-[#ded7c8] flex items-center justify-between">
          <h2 className="text-xs font-serif font-bold text-ink-950 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#166534]" />
            <span>Văn Bản Quy Phạm Được Phát Hiện Tại Cổng Này</span>
          </h2>
          <span className="text-[11px] font-mono text-ink-600 bg-[#ede8dc] px-2 py-0.5 rounded-sm border border-[#d8d2c2]">
            {documents.length} văn bản
          </span>
        </div>

        <div className="divide-y divide-[#f0ebd9]">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-ink-500 font-serif italic text-xs">
              Chưa có văn bản nào được trích xuất từ nguồn này.
            </div>
          ) : (
            documents.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-[#faf6ee] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} size="sm" />
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-serif font-bold text-sm text-ink-950 hover:text-[#193354] hover:underline"
                    >
                      {doc.documentNumber ? `${doc.documentNumber}: ` : ''}
                      {doc.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-600 font-mono">
                    <span>{doc.issuingAuthority || 'Cơ quan chưa rõ'}</span>
                    <span>•</span>
                    <span>Ban hành: {formatDate(doc.publishedAt)}</span>
                    <span>•</span>
                    <span>{doc._count?.versions || 1} phiên bản</span>
                  </div>
                </div>

                <Link
                  href={`/documents/${doc.id}`}
                  className="px-3 py-1.5 rounded-sm bg-[#f2eee5] hover:bg-[#eae4d7] text-ink-800 text-xs font-mono font-medium border border-[#ded7c8] transition-colors shrink-0 text-center"
                >
                  Xem Cấu Trúc Điều Khoản ➔
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
