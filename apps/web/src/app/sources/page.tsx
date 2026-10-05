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
        timeout: Number(formData.timeout),
        retryLimits: Number(formData.retryLimits),
        crawlConcurrency: Number(formData.crawlConcurrency),
      });

      setActionStatus({ type: 'success', message: 'Regulatory source created successfully!' });
      setActiveModal(null);
      loadSources();
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message });
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
        status: 'ERROR',
        message: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerCrawl = async (id: string, name: string) => {
    try {
      setActionStatus(null);
      await api.triggerCrawl(id);
      setActionStatus({
        type: 'success',
        message: `Crawl triggered for "${name}". Worker started discovery.`,
      });
      setTimeout(() => loadSources(), 2000);
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message });
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete regulatory source "${name}"?`)) return;
    try {
      await api.deleteSource(id);
      setActionStatus({ type: 'success', message: `Deleted source "${name}"` });
      loadSources();
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message });
    }
  };

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.baseUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-sky-400" />
            <span>Monitored Sources</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Manage regulatory portals, adapters, crawl schedules, and SSRF security whitelists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setTestUrl('http://localhost:5101');
              setTestResult(null);
              setActiveModal('test');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-mono transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Test URL Safety</span>
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium shadow-md shadow-sky-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Source</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div
          className={`p-3 rounded-lg text-xs font-mono flex items-center justify-between ${
            actionStatus.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-800 text-rose-300'
          }`}
        >
          <span>{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by source name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Showing {filteredSources.length} of {sources.length} sources
        </span>
      </div>

      {/* Sources Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Source Name</th>
                <th className="py-3 px-4">Adapter</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Docs</th>
                <th className="py-3 px-4">Last Crawl</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading regulatory sources...
                  </td>
                </tr>
              ) : filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No regulatory sources found.
                  </td>
                </tr>
              ) : (
                filteredSources.map((source) => {
                  const lastRun = source.crawlRuns?.[0];
                  return (
                    <tr key={source.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/sources/${source.id}`}
                          className="font-bold text-slate-200 hover:text-sky-400 transition-colors block text-sm font-sans"
                        >
                          {source.name}
                        </Link>
                        <span className="text-slate-500 text-[11px] truncate block max-w-xs mt-0.5">
                          {source.baseUrl}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                          {source.adapterType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {source.scheduleCron || 'Manual'}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {source._count?.documents || 0}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {lastRun ? (
                          <div className="space-y-0.5">
                            <StatusBadge status={lastRun.status} type="crawl" size="sm" />
                            <div className="text-[10px] text-slate-500">
                              {formatDate(lastRun.startedAt)}
                            </div>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            source.enabled
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              source.enabled ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          {source.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTriggerCrawl(source.id, source.name)}
                            title="Trigger Immediate Crawl"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Crawl</span>
                          </button>

                          <Link
                            href={`/sources/${source.id}`}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="View Configuration & History"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDeleteSource(source.id, source.name)}
                            title="Delete Source"
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 transition-colors"
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

      {/* Modal: Test Source Connectivity & SSRF */}
      {activeModal === 'test' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <span>Crawl Source Safety &amp; Compatibility Tester</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTestSource} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target URL to Probe
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://example.gov.vn or http://localhost:5101"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Adapter Type
                </label>
                <select
                  value={testAdapter}
                  onChange={(e) => setTestAdapter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="HTML_LISTING">HTML Listing Adapter</option>
                  <option value="HTML_ARTICLE">HTML Single Article Adapter</option>
                  <option value="PDF_DOCUMENT">PDF Document Ingestion Adapter</option>
                  <option value="MOCK_DEMO">Mock Regulatory Server Adapter</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Probing Target...' : 'Execute Safety Probe'}
                </button>
              </div>
            </form>

            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                  testResult.reachable
                    ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                    : testResult.status === 'UNSAFE_URL'
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                    : 'bg-amber-950/50 border-amber-800/80 text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Status: {testResult.status}</span>
                  <span>HTTP {testResult.httpStatus || 'N/A'}</span>
                </div>
                <p className="text-slate-300">{testResult.message}</p>
                {testResult.detectedType && (
                  <div>Detected Content Type: {testResult.detectedType}</div>
                )}
                {testResult.discoveredCount !== undefined && (
                  <div>Discovered Documents: {testResult.discoveredCount}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Regulatory Source */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <span>Register Regulatory Source</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cổng Công Báo Bộ Tài Chính"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Base URL (SSRF Protected)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://vbpl.vn or http://localhost:5101"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Adapter Type
                  </label>
                  <select
                    value={formData.adapterType}
                    onChange={(e) => setFormData({ ...formData, adapterType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="HTML_LISTING">HTML Listing Adapter</option>
                    <option value="HTML_ARTICLE">HTML Single Article Adapter</option>
                    <option value="PDF_DOCUMENT">PDF Document Adapter</option>
                    <option value="MOCK_DEMO">Mock Regulatory Adapter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Schedule Cron (Min 5 mins)
                  </label>
                  <input
                    type="text"
                    placeholder="0 */6 * * *"
                    value={formData.scheduleCron}
                    onChange={(e) => setFormData({ ...formData, scheduleCron: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Allowed Domains (Comma separated whitelist)
                </label>
                <input
                  type="text"
                  placeholder="e.g. localhost:5101, vbpl.vn"
                  value={formData.allowedDomains}
                  onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => setFormData({ ...formData, timeout: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Retries
                  </label>
                  <input
                    type="number"
                    value={formData.retryLimits}
                    onChange={(e) => setFormData({ ...formData, retryLimits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Concurrency
                  </label>
                  <input
                    type="number"
                    value={formData.crawlConcurrency}
                    onChange={(e) => setFormData({ ...formData, crawlConcurrency: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Register Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
