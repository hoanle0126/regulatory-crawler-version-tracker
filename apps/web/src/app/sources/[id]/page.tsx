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
      setActionMsg('Crawl job started. Refreshing in 3 seconds...');
      setTimeout(() => {
        loadSource();
        setCrawling(false);
      }, 3000);
    } catch (err: any) {
      setActionMsg(`Crawl error: ${err.message}`);
      setCrawling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-slate-500">
        Loading regulatory source configuration...
      </div>
    );
  }

  if (!source) {
    return (
      <div className="p-12 text-center text-xs font-mono text-rose-400">
        Source not found or inaccessible.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/sources"
          className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sources</span>
        </Link>

        <button
          onClick={handleCrawl}
          disabled={crawling}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium disabled:opacity-50 transition-all shadow-md shadow-sky-600/30"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${crawling ? 'animate-spin' : ''}`} />
          <span>{crawling ? 'Crawling...' : 'Trigger Crawl Now'}</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-sky-950/80 border border-sky-800 text-xs font-mono text-sky-300">
          {actionMsg}
        </div>
      )}

      {/* Source Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{source.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800">
                {source.adapterType}
              </span>
            </div>
            <a
              href={source.baseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-slate-400 hover:text-sky-400 mt-1 block truncate max-w-lg"
            >
              {source.baseUrl}
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL DOCUMENTS</span>
              <span className="text-lg font-bold text-slate-100">{documents.length}</span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-slate-500 block text-[10px]">SCHEDULE</span>
              <span className="text-sm font-semibold text-slate-200">
                {source.scheduleCron || 'Manual Only'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block text-[10px]">TIMEOUT</span>
            <span className="text-slate-200 font-semibold">{source.timeout}ms</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">RETRY LIMITS</span>
            <span className="text-slate-200 font-semibold">{source.retryLimits} attempts</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">CONCURRENCY</span>
            <span className="text-slate-200 font-semibold">{source.crawlConcurrency} workers</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">STATUS</span>
            <span className={source.enabled ? 'text-emerald-400' : 'text-slate-500'}>
              {source.enabled ? 'Active / Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {source.allowedDomains && source.allowedDomains.length > 0 && (
          <div className="text-xs font-mono">
            <span className="text-slate-500 block text-[10px] uppercase mb-1">
              Allowed Domains (SSRF Whitelist)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {source.allowedDomains.map((dom: string) => (
                <span
                  key={dom}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                >
                  {dom}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crawl Run History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Crawl Execution History</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {source.crawlRuns?.length || 0} run(s) logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Run ID</th>
                <th className="py-2.5 px-4">Trigger</th>
                <th className="py-2.5 px-4">Started At</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Discovered</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Error / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {!source.crawlRuns || source.crawlRuns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No crawl executions recorded yet.
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
                    <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-300">
                        {run.id.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{run.trigger}</td>
                      <td className="py-2.5 px-4 text-slate-400">{formatDate(run.startedAt)}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-semibold">{duration}</td>
                      <td className="py-2.5 px-4 text-slate-200">{run.documentsDiscovered}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={run.status} type="crawl" size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">
                        {run.errorMessage ? (
                          <span className="text-rose-400">{run.errorMessage}</span>
                        ) : (
                          '—'
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

      {/* Discovered Documents */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Discovered Regulations &amp; Documents</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">{documents.length} document(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Document Title &amp; Number</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Authority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Versions</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No documents discovered yet. Trigger a crawl to ingest regulations.
                  </td>
                </tr>
              ) : (
                documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="hover:text-sky-400 transition-colors"
                      >
                        {doc.documentNumber ? `${doc.documentNumber}: ` : ''}
                        {doc.title}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{doc.documentType || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-400">{doc.issuingAuthority || '—'}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-200">
                      {doc._count?.versions || 1}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-sky-400 hover:underline"
                      >
                        Inspect →
                      </Link>
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
