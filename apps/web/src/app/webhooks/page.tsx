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
      alert(`Failed to create webhook: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete webhook endpoint "${name}"?`)) return;
    try {
      await api.deleteWebhook(id);
      loadWebhooks();
    } catch (err: any) {
      alert(`Failed to delete webhook: ${err.message}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Webhook className="w-6 h-6 text-sky-400" />
            <span>Downstream Webhook Integrations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Trigger downstream Legal RAG ingestion pipelines with signed HMAC-SHA256 event payloads.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium shadow-md shadow-sky-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Endpoint</span>
        </button>
      </div>

      {pingResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
            pingResult.success
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          <div className="font-bold flex items-center justify-between">
            <span>Ping Status: {pingResult.success ? 'DELIVERY SUCCESS' : 'DELIVERY FAILED'}</span>
            <button onClick={() => setPingResult(null)}>✕</button>
          </div>
          <div>Status Code: HTTP {pingResult.delivery?.responseStatus || 'N/A'}</div>
          {pingResult.delivery?.responseBody && (
            <div>Response: {pingResult.delivery.responseBody}</div>
          )}
          {pingResult.error && <div>Error: {pingResult.error}</div>}
        </div>
      )}

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            Loading webhook endpoints...
          </div>
        ) : webhooks.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No webhook endpoints configured. Click &quot;Register Endpoint&quot; to configure Legal RAG integration.
          </div>
        ) : (
          webhooks.map((wh) => (
            <div
              key={wh.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 font-sans">{wh.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        wh.enabled
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {wh.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(wh.id, wh.name)}
                    className="p-1 rounded bg-slate-800 hover:text-rose-400 text-slate-400"
                    title="Delete Webhook"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-400 truncate bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {wh.url}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    Subscribed Events
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev: string) => (
                      <span
                        key={ev}
                        className="px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/60 text-[10px] font-mono"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                {wh.deliveries && wh.deliveries.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Recent Deliveries:</span>
                    {wh.deliveries.slice(0, 2).map((del: any) => (
                      <div key={del.id} className="flex items-center justify-between text-[10px]">
                        <span>{del.event}</span>
                        <span className={del.responseStatus === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                          HTTP {del.responseStatus || 'ERR'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  HMAC: X-RegTracker-Signature
                </span>

                <button
                  onClick={() => handlePing(wh.id)}
                  disabled={pingingId === wh.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono transition-colors disabled:opacity-50"
                >
                  <Send className={`w-3 h-3 ${pingingId === wh.id ? 'animate-spin' : ''}`} />
                  <span>{pingingId === wh.id ? 'Sending...' : 'Send Test Ping'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register Webhook */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-sky-400" />
                <span>Register Downstream Webhook</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Integration Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal RAG Assistant Notification Service"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target Webhook URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://rag-assistant.local/api/webhooks/regulatory"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  HMAC Signing Secret
                </label>
                <input
                  type="text"
                  required
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">
                  Subscribed Events
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {ALL_EVENTS.map((ev) => (
                    <label
                      key={ev}
                      className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-[11px] text-slate-300">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
