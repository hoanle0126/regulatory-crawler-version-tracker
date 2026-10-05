'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Clock,
  GitCompare,
  ArrowLeft,
  Share2,
  ExternalLink,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../../lib/api-client';
import { StatusBadge } from '../../../components/StatusBadge';
import { HierarchyTree } from '../../../components/HierarchyTree';
import { formatDate, truncateHash } from '../../../lib/utils';

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [structureNodes, setStructureNodes] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<{ outgoing: any[]; incoming: any[] }>({
    outgoing: [],
    incoming: [],
  });

  // Compare selection
  const [fromVerId, setFromVerId] = useState<string>('');
  const [toVerId, setToVerId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [ragCopied, setRagCopied] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotData, setSnapshotData] = useState<any>(null);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const [docData, versionsData, relData] = await Promise.all([
        api.getDocument(documentId),
        api.getDocumentVersions(documentId),
        api.getDocumentRelationships(documentId),
      ]);
      setDoc(docData);
      setVersions(versionsData);
      setRelationships(relData);

      if (versionsData.length > 0) {
        const latest = versionsData[versionsData.length - 1];
        setSelectedVersionId(latest.id);
        if (versionsData.length >= 2) {
          setFromVerId(versionsData[versionsData.length - 2].id);
          setToVerId(latest.id);
        } else {
          setFromVerId(latest.id);
          setToVerId(latest.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (selectedVersionId) {
      api
        .getVersionStructure(selectedVersionId)
        .then(setStructureNodes)
        .catch(() => setStructureNodes([]));
    }
  }, [selectedVersionId]);

  const handleCopyRagExport = () => {
    if (!doc) return;
    const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[versions.length - 1];
    const exportData = {
      document: {
        id: doc.id,
        title: doc.title,
        number: doc.documentNumber,
        authority: doc.issuingAuthority,
        effectiveAt: doc.effectiveAt,
        sourceUrl: doc.sourceUrl,
      },
      version: {
        id: selectedVersion?.id,
        versionNumber: selectedVersion?.versionNumber,
        checksum: selectedVersion?.normalizedChecksum,
      },
      nodes: structureNodes.map((n) => ({
        type: n.type,
        number: n.number,
        hierarchyPath: n.hierarchyPath,
        content: n.content,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setRagCopied(true);
    setTimeout(() => setRagCopied(false), 2000);
  };

  const handleViewSnapshot = async (versionId: string) => {
    try {
      const ver = await api.getVersion(versionId);
      setSnapshotData(ver.rawSnapshot);
      setShowSnapshotModal(true);
    } catch (err: any) {
      alert(`Failed to load snapshot: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs font-mono text-slate-500">Loading document details...</div>;
  }

  if (!doc) {
    return <div className="p-12 text-center text-xs font-mono text-rose-400">Document not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyRagExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-sky-400 hover:border-slate-700 transition-colors"
          >
            {ragCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{ragCopied ? 'RAG JSON Copied!' : 'Export RAG Contract'}</span>
          </button>

          {versions.length >= 2 && (
            <Link
              href={`/documents/${doc.id}/compare?from=${fromVerId}&to=${toVerId}`}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium shadow-md shadow-sky-600/30 transition-all"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Versions</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Metadata Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                {doc.documentNumber || 'UNASSIGNED NUMBER'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {doc.documentType || 'REGULATION'}
              </span>
              <StatusBadge status={doc.status} size="sm" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans mt-2">
              {doc.title}
            </h1>

            <p className="text-xs font-mono text-slate-400">
              Canonical ID: <span className="text-slate-300">{doc.canonicalId}</span>
            </p>
          </div>

          <div className="text-xs font-mono text-right shrink-0 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px]">MONITORED SOURCE</span>
            <span className="text-slate-200 font-semibold">{doc.source?.name}</span>
            {doc.sourceUrl && (
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center justify-end gap-1 mt-1 text-[11px]"
              >
                <span>Original Source URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Legal Dates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block text-[10px]">ISSUING AUTHORITY</span>
            <span className="text-slate-200 font-semibold">{doc.issuingAuthority || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">ISSUED DATE</span>
            <span className="text-slate-200">{formatDate(doc.issuingDate)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">EFFECTIVE DATE</span>
            <span className="text-emerald-400 font-semibold">{formatDate(doc.effectiveAt)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">EXPIRATION DATE</span>
            <span className="text-slate-300">{formatDate(doc.expiredAt)}</span>
          </div>
        </div>
      </div>

      {/* Flagship Version Selector & Comparison Launcher */}
      {versions.length >= 2 && (
        <div className="bg-gradient-to-r from-sky-950/40 to-slate-900 border border-sky-900/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="w-4 h-4" />
              <span>Flagship Legal Diff Comparison</span>
            </span>
            <p className="text-xs text-slate-300">
              Select two versions to run structural legal diffing with word-level highlight:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Base:</span>
              <select
                value={fromVerId}
                onChange={(e) => setFromVerId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} ({formatDate(v.detectedAt)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Target:</span>
              <select
                value={toVerId}
                onChange={(e) => setToVerId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} ({formatDate(v.detectedAt)})
                  </option>
                ))}
              </select>
            </div>

            <Link
              href={`/documents/${doc.id}/compare?from=${fromVerId}&to=${toVerId}`}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-medium shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Launch Diff</span>
              <GitCompare className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Layout: Version History & Legal Hierarchy Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version Timeline (1 Col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Version History Timeline</span>
            </h2>

            <div className="space-y-3">
              {versions.map((ver) => {
                const isSelected = selectedVersionId === ver.id;
                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`p-3.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500/60 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className={isSelected ? 'text-sky-400' : 'text-slate-200'}>
                        Version {ver.versionNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(ver.detectedAt)}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-400 mt-2">
                      <div className="flex items-center justify-between">
                        <span>SHA-256 (Norm):</span>
                        <span className="font-mono text-slate-300">
                          {truncateHash(ver.normalizedChecksum, 10)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Parser Version:</span>
                        <span className="text-slate-400">{ver.parserVersion}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSnapshot(ver.id);
                        }}
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <Code className="w-3 h-3" />
                        <span>Raw Snapshot</span>
                      </button>
                      {isSelected && (
                        <span className="text-[10px] text-sky-400 font-semibold">Active Tree</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal Relationships Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Legal Relationships</span>
            </h2>

            {relationships.outgoing.length === 0 && relationships.incoming.length === 0 ? (
              <p className="text-xs font-mono text-slate-500">
                No cross-regulation relationships registered.
              </p>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {relationships.outgoing.map((rel: any) => (
                  <div key={rel.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-amber-400 font-bold mr-2">{rel.relationshipType}</span>
                    <Link
                      href={`/documents/${rel.targetDocumentId}`}
                      className="text-slate-200 hover:text-sky-400 underline font-sans"
                    >
                      {rel.targetDocument?.documentNumber || 'Target Document'}
                    </Link>
                  </div>
                ))}
                {relationships.incoming.map((rel: any) => (
                  <div key={rel.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-purple-400 font-bold mr-2">IS {rel.relationshipType} BY</span>
                    <Link
                      href={`/documents/${rel.sourceDocumentId}`}
                      className="text-slate-200 hover:text-sky-400 underline font-sans"
                    >
                      {rel.sourceDocument?.documentNumber || 'Source Document'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legal Hierarchy Tree (2 Cols) */}
        <div className="lg:col-span-2">
          <HierarchyTree nodes={structureNodes} />
        </div>
      </div>

      {/* Snapshot Modal */}
      {showSnapshotModal && snapshotData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Code className="w-4 h-4 text-sky-400" />
                  <span>Immutable Raw Source Snapshot</span>
                </h3>
                <span className="text-xs font-mono text-slate-400 block mt-0.5">
                  MIME: {snapshotData.mimeType} | Checksum: {truncateHash(snapshotData.contentChecksum, 16)}
                </span>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {snapshotData.rawContent}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
