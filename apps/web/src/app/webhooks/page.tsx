'use client';

import React, { useEffect, useState } from 'react';
import {
  Webhook,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api-client';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: 'whsec_custom_secret_key_123',
    events: ['document.changed', 'document.version.created'],
  });

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await api.getWebhooks();
      setWebhooks(data);
    } catch (err: any) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWebhook(formData);
      setShowAddModal(false);
      loadWebhooks();
    } catch (err: any) {
      alert(`Không thể tạo webhook: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa điểm cuối webhook "${name}"?`)) return;
    try {
      await api.deleteWebhook(id);
      loadWebhooks();
    } catch (err: any) {
      alert(`Không thể xóa webhook: ${err.message}`);
    }
  };

  const handlePing = async (id: string) => {
    try {
      setPingingId(id);
      setPingResult(null);
      const res = await api.pingWebhook(id);
      setPingResult(res);
      loadWebhooks();
    } catch (err: any) {
      setPingResult({ success: false, error: err.message });
    } finally {
      setPingingId(null);
    }
  };

  const toggleEvent = (event: string) => {
    if (formData.events.includes(event)) {
      setFormData({ ...formData, events: formData.events.filter((e) => e !== event) });
    } else {
      setFormData({ ...formData, events: [...formData.events, event] });
    }
  };

  const ALL_EVENTS = [
    'document.created',
    'document.version.created',
    'document.changed',
    'document.expired',
    'document.replaced',
    'document.reindex.required',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule-light">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-primary flex items-center gap-2.5">
            <Webhook className="w-5 h-5 text-seal-primary" />
            <span>Tích hợp Webhook Đầu ra (Legal RAG Ingestion)</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1 font-mono">
            Kích hoạt pipeline nạp tài liệu cho Trợ lý Căn cứ Pháp lý qua gói tin ký số HMAC-SHA256 chuẩn hóa.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-seal-primary hover:bg-seal-secondary text-paper-base text-xs font-mono transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Đăng ký Điểm cuối</span>
        </button>
      </div>

      {pingResult && (
        <div
          className={`p-3.5 border text-xs font-mono space-y-1 ${
            pingResult.success
              ? 'bg-diff-insert-bg border-diff-insert-text text-diff-insert-text'
              : 'bg-diff-delete-bg border-diff-delete-text text-diff-delete-text'
          }`}
        >
          <div className="font-bold flex items-center justify-between">
            <span>KẾT QUẢ KIỂM TRA (PING): {pingResult.success ? 'GỬI THÀNH CÔNG (HTTP 200)' : 'GỬI THẤT BẠI'}</span>
            <button onClick={() => setPingResult(null)} className="px-1 text-sm">✕</button>
          </div>
          <div>Mã phản hồi: HTTP {pingResult.delivery?.responseStatus || 'N/A'}</div>
          {pingResult.delivery?.responseBody && (
            <div>Nội dung phản hồi: {pingResult.delivery.responseBody}</div>
          )}
          {pingResult.error && <div>Thông báo lỗi: {pingResult.error}</div>}
        </div>
      )}

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs font-mono text-ink-muted bg-paper-surface border border-rule-light">
            Đang tải danh sách điểm cuối webhook...
          </div>
        ) : webhooks.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs font-mono text-ink-muted bg-paper-surface border border-rule-light">
            Chưa cấu hình điểm cuối webhook nào. Nhấn &quot;Đăng ký Điểm cuối&quot; để kết nối hệ thống Legal RAG.
          </div>
        ) : (
          webhooks.map((wh) => (
            <div
              key={wh.id}
              className="bg-paper-surface border border-rule-light hover:border-rule-strong p-4 flex flex-col justify-between transition-colors space-y-3.5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rule-light/70">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-ink-primary">{wh.name}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono border ${
                        wh.enabled
                          ? 'bg-paper-warm text-seal-primary border-rule-strong'
                          : 'bg-paper-surface text-ink-muted border-rule-light'
                      }`}
                    >
                      {wh.enabled ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(wh.id, wh.name)}
                    className="p-1 hover:text-diff-delete-text text-ink-muted transition-colors"
                    title="Xóa Webhook"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-mono text-ink-secondary truncate bg-paper-warm/50 p-2 border border-rule-light">
                  {wh.url}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                    Sự kiện đã đăng ký
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev: string) => (
                      <span
                        key={ev}
                        className="px-2 py-0.5 bg-paper-surface text-ink-primary border border-rule-light text-[10px] font-mono"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                {wh.deliveries && wh.deliveries.length > 0 && (
                  <div className="pt-2 border-t border-rule-light text-[11px] font-mono text-ink-muted space-y-1">
                    <span className="text-[10px] uppercase block tracking-wider font-bold">Lịch sử gửi gần nhất:</span>
                    {wh.deliveries.slice(0, 2).map((del: any) => (
                      <div key={del.id} className="flex items-center justify-between text-[10px]">
                        <span>{del.event}</span>
                        <span className={del.responseStatus === 200 ? 'text-diff-insert-text font-bold' : 'text-diff-delete-text font-bold'}>
                          HTTP {del.responseStatus || 'LỖI'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-rule-light flex items-center justify-between">
                <span className="text-[10px] font-mono text-ink-muted">
                  Header: X-RegTracker-Signature
                </span>

                <button
                  onClick={() => handlePing(wh.id)}
                  disabled={pingingId === wh.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-paper-surface hover:bg-paper-warm border border-rule-strong text-ink-primary text-xs font-mono transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Send className={`w-3 h-3 shrink-0 ${pingingId === wh.id ? 'animate-spin' : ''}`} />
                  <span className="whitespace-nowrap">{pingingId === wh.id ? 'Đang gửi...' : 'Gửi Test Ping'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register Webhook */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-ink-primary/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-surface border border-rule-strong max-w-lg w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-rule-light">
              <h3 className="text-base font-serif font-bold text-ink-primary flex items-center gap-2">
                <Webhook className="w-4 h-4 text-seal-primary" />
                <span>Đăng ký Điểm cuối Webhook Mới</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-ink-muted hover:text-ink-primary text-base font-mono px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-ink-secondary mb-1">
                  Tên cấu hình tích hợp
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Legal RAG Assistant Notification Service"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-primary focus:outline-none focus:border-seal-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-secondary mb-1">
                  Địa chỉ URL Điểm cuối (Target Webhook URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:3000/api/webhooks/regulatory"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-1.5 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-primary focus:outline-none focus:border-seal-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-secondary mb-1">
                  Khóa ký số HMAC (HMAC Signing Secret)
                </label>
                <input
                  type="text"
                  required
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-3 py-1.5 bg-paper-warm/50 border border-rule-light text-xs font-mono text-ink-primary focus:outline-none focus:border-seal-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink-secondary mb-2">
                  Danh mục sự kiện đăng ký
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {ALL_EVENTS.map((ev) => (
                    <label
                      key={ev}
                      className="flex items-center gap-2 p-2 bg-paper-warm/30 border border-rule-light cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="text-seal-primary focus:ring-0"
                      />
                      <span className="text-[11px] text-ink-primary font-mono">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-rule-light">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary text-xs font-mono hover:bg-paper-warm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-seal-primary hover:bg-seal-secondary text-paper-base text-xs font-mono transition-colors"
                >
                  Lưu Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
