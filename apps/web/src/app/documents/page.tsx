'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({
        page,
        pageSize: 15,
        search: search.trim() || undefined,
        sourceId: sourceId || undefined,
        status: status || undefined,
        documentType: documentType || undefined,
      });
      setDocuments(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
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
  }, [page, sourceId, status, documentType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDocuments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Monitored Legal Documents</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Browse indexed regulations, version timelines, legal hierarchies, and cross-references.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by title, regulation number (e.g. 01/2026/TT-BTC), or canonical ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="">All Sources</option>
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
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="EFFECTIVE">EFFECTIVE</option>
            <option value="AMENDED">AMENDED</option>
            <option value="REPLACED">REPLACED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="NOT_YET_EFFECTIVE">NOT YET EFFECTIVE</option>
          </select>

          <select
            value={documentType}
            onChange={(e) => {
              setDocumentType(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="THONG_TU">Thông tư (Circular)</option>
            <option value="NGHI_DINH">Nghị định (Decree)</option>
            <option value="QUYET_DINH">Quyết định (Decision)</option>
            <option value="LUAT">Luật (Law)</option>
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
              className="text-slate-400 hover:text-white underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Document Details</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Authority</th>
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Versions</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No documents matched your query criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-bold text-slate-200 hover:text-sky-400 transition-colors text-sm font-sans block line-clamp-1"
                      >
                        {doc.title}
                      </Link>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                        <span className="font-semibold text-sky-400 font-mono">
                          {doc.documentNumber || 'No Number'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 truncate max-w-xs">{doc.source?.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                        {doc.documentType || 'REGULATION'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {doc.issuingAuthority || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(doc.effectiveAt)}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        v{doc._count?.versions || 1}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Showing {documents.length} of {totalCount} documents
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
