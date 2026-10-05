'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Plus,
  Play,
  ShieldCheck,
  Search,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'add' | 'test' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Source Form State
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    adapterType: 'HTML_LISTING',
    scheduleCron: '0 */6 * * *',
    enabled: true,
    allowedDomains: '',
    timeout: 15000,
    retryLimits: 2,
    crawlConcurrency: 2,
  });

  // Test Source Form State
  const [testUrl, setTestUrl] = useState('');
  const [testAdapter, setTestAdapter] = useState('HTML_LISTING');
  const [testResult, setTestResult] = useState<any>(null);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await api.getSources();
      setSources(data);
    } catch (err: any) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionStatus(null);
      const allowedDomains = formData.allowedDomains
        ? formData.allowedDomains.split(',').map((d) => d.trim()).filter(Boolean)
        : [];

      await api.createSource({
        ...formData,
        allowedDomains,
      });

      setActionStatus({ type: 'success', message: 'Đăng ký cổng thông tin pháp luật thành công!' });
      setActiveModal(null);
      loadSources();
    } catch (err: any) {
      setActionStatus({ type: 'error', message: `Lỗi đăng ký nguồn: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setTestResult(null);
      const res = await api.testAdHocSource({
        url: testUrl,
        adapterType: testAdapter,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        reachable: false,
        status: 'PROBE_FAILED',
        message: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerCrawl = async (id: string) => {
    try {
      setActionStatus(null);
      await api.triggerCrawl(id);
      setActionStatus({
        type: 'success',
        message: 'Đã gửi lệnh thu thập vào hàng đợi BullMQ thành công.',
      });
      setTimeout(() => loadSources(), 2500);
    } catch (err: any) {
      setActionStatus({ type: 'error', message: `Lỗi thu thập: ${err.message}` });
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn gỡ bỏ nguồn giám sát: "${name}"?`)) return;
    try {
      await api.deleteSource(id);
      setActionStatus({ type: 'success', message: `Đã xóa nguồn ${name}` });
      loadSources();
    } catch (err: any) {
      setActionStatus({ type: 'error', message: `Lỗi xóa nguồn: ${err.message}` });
    }
  };

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.baseUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-ink-600 uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5 text-[#193354]" />
            <span>Hạ Tầng Giám Sát Căn Cứ Thể Chế</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink-950 tracking-tight">
            Danh Mục Cổng Pháp Luật Được Giám Sát
          </h1>
          <p className="text-xs text-ink-600 font-serif italic max-w-2xl">
            Cấu hình các cổng thông tin, công báo điện tử và lịch tự động crawl. Tích hợp tường lửa SsrfGuard bảo vệ an ninh mạng tuyệt đối.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setTestUrl('http://127.0.0.1:5101/fixtures/listing.html');
              setTestResult(null);
              setActiveModal('test');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#f7f4ed] hover:bg-[#ede8dc] text-ink-800 text-xs font-mono font-medium border border-[#ded7c8] transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-[#193354]" />
            <span>Thẩm Tra An Toàn (SSRF Test)</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                name: '',
                baseUrl: '',
                adapterType: 'HTML_LISTING',
                scheduleCron: '0 */6 * * *',
                enabled: true,
                allowedDomains: '',
                timeout: 15000,
                retryLimits: 2,
                crawlConcurrency: 2,
              });
              setActiveModal('add');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#193354] hover:bg-[#132842] text-white text-xs font-medium transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng Ký Cổng Mới</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div
          className={`p-3 text-xs font-mono flex items-center justify-between border ${
            actionStatus.type === 'success'
              ? 'bg-[#edf6ee] border-[#bbf7d0] text-[#166534]'
              : 'bg-[#fdf2f2] border-[#fecaca] text-[#991b1b]'
          }`}
        >
          <span>{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] p-3.5 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên cổng thông tin hoặc đường dẫn URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 placeholder-ink-400 focus:outline-none focus:border-[#193354]"
          />
        </div>
        <span className="text-xs text-ink-500 font-mono hidden sm:inline">
          Hiển thị {filteredSources.length} trên tổng số {sources.length} cổng
        </span>
      </div>

      {/* Sources Table */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f1e8] border-b border-[#ded7c8] text-ink-700 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[220px] whitespace-nowrap">Tên Cổng Dữ Liệu</th>
                <th className="py-3 px-4 whitespace-nowrap">Bộ Tiếp Hợp (Adapter)</th>
                <th className="py-3 px-4 whitespace-nowrap">Lịch Thu Thập</th>
                <th className="py-3 px-4 whitespace-nowrap">Số Văn Bản</th>
                <th className="py-3 px-4 whitespace-nowrap">Lần Chạy Gần Nhất</th>
                <th className="py-3 px-4 whitespace-nowrap">Trạng Thái</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebd9]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-500 font-serif italic">
                    Đang tải danh mục cổng dữ liệu pháp lý...
                  </td>
                </tr>
              ) : filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-500 font-serif italic">
                    Không tìm thấy cổng dữ liệu nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredSources.map((source) => {
                  const lastRun = source.crawlRuns?.[0];
                  return (
                    <tr key={source.id} className="hover:bg-[#faf6ee] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/sources/${source.id}`}
                          className="font-serif font-bold text-ink-950 hover:text-[#193354] transition-colors block text-sm"
                        >
                          {source.name}
                        </Link>
                        <span className="text-ink-500 font-mono text-[11px] truncate block max-w-xs mt-0.5">
                          {source.baseUrl}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-1.5 py-0.5 rounded-sm bg-[#f2eee5] border border-[#ded7c8] text-ink-700 text-[10px]">
                          {source.adapterType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink-600">
                        {source.scheduleCron || 'Thủ công'}
                      </td>

                      <td className="py-3.5 px-4 font-serif font-bold text-ink-950 text-sm">
                        {source._count?.documents || 0}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink-600">
                        {lastRun ? (
                          <div className="space-y-0.5">
                            <StatusBadge status={lastRun.status} type="crawl" size="sm" />
                            <div className="text-[10px] text-ink-500">
                              {formatDate(lastRun.startedAt)}
                            </div>
                          </div>
                        ) : (
                          'Chưa chạy'
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            source.enabled
                              ? 'bg-[#edf6ee] text-[#166534] border-[#bbf7d0]'
                              : 'bg-[#f4efe6] text-ink-500 border-[#ded5c5]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              source.enabled ? 'bg-[#166534]' : 'bg-ink-400'
                            }`}
                          />
                          {source.enabled ? 'Đang kích hoạt' : 'Tạm dừng'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                          <button
                            onClick={() => handleTriggerCrawl(source.id)}
                            title="Thu thập ngay lập tức"
                            className="p-1.5 rounded-sm bg-[#f7f4ed] hover:bg-[#ede8dc] text-[#193354] border border-[#ded7c8] transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>

                          <Link
                            href={`/sources/${source.id}`}
                            title="Chi tiết cấu hình và nhật ký"
                            className="p-1.5 rounded-sm bg-[#f7f4ed] hover:bg-[#ede8dc] text-ink-700 border border-[#ded7c8] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDeleteSource(source.id, source.name)}
                            title="Xóa nguồn giám sát"
                            className="p-1.5 rounded-sm bg-[#fdf2f2] hover:bg-[#fde8e8] text-[#991b1b] border border-[#fecaca] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Test Source Safety & SSRF */}
      {activeModal === 'test' && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#fdfdfc] border border-[#ded7c8] rounded-sm max-w-xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded7c8]">
              <h3 className="text-base font-serif font-bold text-ink-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#193354]" />
                <span>Thẩm Tra An Toàn URL &amp; Phòng Chống SSRF</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-ink-500 hover:text-ink-900 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTestSource} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                  Đường dẫn URL cần kiểm thử kết nối
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://vbpl.vn hoặc http://127.0.0.1:5101/fixtures/listing.html"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                />
                <span className="text-[11px] font-serif italic text-ink-500 mt-1 block">
                  Thử nhập URL nội bộ như http://169.254.169.254 hoặc http://192.168.1.1 để kiểm tra cơ chế chặn SSRF.
                </span>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                  Loại Tiếp Hợp (Adapter Type)
                </label>
                <select
                  value={testAdapter}
                  onChange={(e) => setTestAdapter(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                >
                  <option value="HTML_LISTING">HTML Listing Adapter (Trang danh sách công báo)</option>
                  <option value="HTML_ARTICLE">HTML Single Article Adapter (Văn bản đơn lẻ)</option>
                  <option value="PDF_DOCUMENT">PDF Document Adapter (Văn bản PDF số hóa)</option>
                  <option value="MOCK_DEMO">Mock Regulatory Server (Bộ tiếp hợp mẫu :5101)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ede7d8]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-sm bg-[#f2eee5] text-ink-700 text-xs font-mono hover:bg-[#eae4d7]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-sm bg-[#193354] hover:bg-[#132842] text-white text-xs font-medium disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Đang thẩm tra an toàn...' : 'Bắt Đầu Kiểm Thử'}
                </button>
              </div>
            </form>

            {testResult && (
              <div
                className={`p-4 rounded-sm border text-xs font-mono space-y-1.5 ${
                  testResult.reachable
                    ? 'bg-[#edf6ee] border-[#bbf7d0] text-[#166534]'
                    : testResult.status === 'UNSAFE_URL'
                    ? 'bg-[#fdf2f2] border-[#fecaca] text-[#991b1b]'
                    : 'bg-[#fffbeb] border-[#fde68a] text-[#854d0e]'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Trạng thái: {testResult.status}</span>
                  <span>Mã HTTP: {testResult.httpStatus || 'N/A'}</span>
                </div>
                <p className="text-ink-800 font-serif">{testResult.message}</p>
                {testResult.detectedType && (
                  <div>Kiểu nội dung: {testResult.detectedType}</div>
                )}
                {testResult.discoveredCount !== undefined && (
                  <div>Văn bản phát hiện: {testResult.discoveredCount}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Regulatory Source */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#fdfdfc] border border-[#ded7c8] rounded-sm max-w-xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded7c8]">
              <h3 className="text-base font-serif font-bold text-ink-950 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#193354]" />
                <span>Đăng Ký Cổng Thông Tin Pháp Luật Mới</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-ink-500 hover:text-ink-900 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                  Tên Cổng Dữ Liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cổng Công Báo Bộ Tài Chính"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                  Địa chỉ Gốc (Base URL)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://vbpl.vn hoặc http://127.0.0.1:5101/fixtures/listing.html"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                    Loại Tiếp Hợp (Adapter)
                  </label>
                  <select
                    value={formData.adapterType}
                    onChange={(e) => setFormData({ ...formData, adapterType: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                  >
                    <option value="HTML_LISTING">HTML Listing</option>
                    <option value="HTML_ARTICLE">HTML Single Article</option>
                    <option value="PDF_DOCUMENT">PDF Document</option>
                    <option value="MOCK_DEMO">Mock Demo Source</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                    Lịch Tự Động (Cron)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0 */6 * * *"
                    value={formData.scheduleCron}
                    onChange={(e) => setFormData({ ...formData, scheduleCron: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-ink-700 mb-1">
                  Tên miền Cho Phép (Phân tách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="127.0.0.1, vbpl.vn, mof.gov.vn"
                  value={formData.allowedDomains}
                  onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm bg-[#f8f6f0] border border-[#ded7c8] text-xs font-mono text-ink-950 focus:outline-none focus:border-[#193354]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ede7d8]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-sm bg-[#f2eee5] text-ink-700 text-xs font-mono hover:bg-[#eae4d7]"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-sm bg-[#193354] hover:bg-[#132842] text-white text-xs font-medium disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Đang lưu cấu hình...' : 'Lưu & Khởi Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
