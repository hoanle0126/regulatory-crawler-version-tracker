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
      setActionMessage('Crawl job queued successfully! Worker is discovering documents.');
      setTimeout(() => {
        loadData();
        setCrawlingId(null);
      }, 2500);
    } catch (err: any) {
      setActionMessage(`Crawl failed: ${err.message}`);
      setCrawlingId(null);
    }
  };

  const totalDocsCount = documents.length > 0 ? documents.length : sources.reduce((acc, s) => acc + (s._count?.documents || 0), 0);
  const failedCrawlsCount = crawls.filter((c) => c.status === 'FAILED').length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Demo Guide */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production Portfolio Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Regulatory Intelligence &amp; Version Tracking
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Monitors Vietnamese regulatory portals, preserves cryptographic raw HTML/PDF snapshots, parses legal structures (Chương/Điều/Khoản/Điểm), and detects clause-level legal modifications with zero false positives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </button>
            <Link
              href="/sources"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-lg shadow-sky-600/30 transition-all font-mono"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Manage &amp; Crawl Sources
            </Link>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-lg bg-sky-950/80 border border-sky-800 text-xs font-mono text-sky-300 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monitored Sources"
          value={sources.length}
          subtext={`${sources.filter((s) => s.enabled).length} active schedules`}
          icon={<Globe className="w-5 h-5 text-sky-400" />}
          variant="default"
        />
        <StatsCard
          title="Regulatory Documents"
          value={totalDocsCount}
          subtext="Indexed regulations"
          icon={<FileText className="w-5 h-5 text-emerald-400" />}
          variant="success"
        />
        <StatsCard
          title="Detected ChangeSets"
          value={changes.length}
          subtext="Structural version diffs"
          icon={<GitCompare className="w-5 h-5 text-amber-400" />}
          variant="warning"
        />
        <StatsCard
          title="Failed Crawl Runs"
          value={failedCrawlsCount}
          subtext={failedCrawlsCount === 0 ? 'All pipelines healthy' : 'Requires investigation'}
          icon={<AlertOctagon className="w-5 h-5 text-rose-400" />}
          variant={failedCrawlsCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Two Column Layout: Monitored Sources & Recent Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monitored Sources Health (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Monitored Regulatory Sources</span>
            </h2>
            <Link
              href="/sources"
              className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>View All Sources</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs font-mono">
                No regulatory sources configured.
              </div>
            ) : (
              sources.map((source) => {
                const isCrawling = crawlingId === source.id;
                const lastRun = source.crawlRuns?.[0];

                return (
                  <div
                    key={source.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sources/${source.id}`}
                          className="font-semibold text-sm text-slate-200 hover:text-sky-400 transition-colors"
                        >
                          {source.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          {source.adapterType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="truncate max-w-[220px]">{source.baseUrl}</span>
                        <span>•</span>
                        <span>{source._count?.documents || 0} Docs</span>
                        <span>•</span>
                        <span>Schedule: {source.scheduleCron || 'Manual'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {lastRun && (
                        <div className="text-right hidden sm:block">
                          <StatusBadge status={lastRun.status} type="crawl" size="sm" />
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formatDate(lastRun.startedAt)}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleTriggerCrawl(source.id)}
                        disabled={isCrawling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono transition-colors disabled:opacity-50"
                      >
                        <Play className={`w-3 h-3 fill-current ${isCrawling ? 'animate-spin' : ''}`} />
                        <span>{isCrawling ? 'Crawling...' : 'Crawl Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Detected Changes Feed (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-amber-400" />
              <span>Latest Regulatory Changes</span>
            </h2>
            <Link
              href="/changes"
              className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {changes.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs font-mono">
                No regulatory changes detected yet. Trigger a crawl on Demo Source V2 to generate a changeset!
              </div>
            ) : (
              changes.map((change) => (
                <div
                  key={change.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-900/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={change.status} type="changeset" size="sm" />
                    <span className="text-[10px] font-mono text-slate-500">
                      {formatDate(change.detectedAt)}
                    </span>
                  </div>

                  <Link
                    href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                    className="block text-xs font-semibold text-slate-200 hover:text-sky-400 transition-colors line-clamp-2"
                  >
                    {change.document?.documentNumber ? `${change.document.documentNumber}: ` : ''}
                    {change.document?.title || 'Regulatory Document'}
                  </Link>

                  <p className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                    {change.summary}
                  </p>

                  <div className="pt-1 flex justify-end">
                    <Link
                      href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                      className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Inspect Word Diff</span>
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

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
