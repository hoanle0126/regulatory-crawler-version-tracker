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
  FileText,
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
  const [relationships, setRelationships] = useState<{ outbound: any[]; inbound: any[] }>({
    outbound: [],
    inbound: [],
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
        api.getDocumentRelationships(documentId).catch(() => ({ outbound: [], inbound: [] })),
      ]);
      setDoc(docData);
      setVersions(versionsData || []);
      setRelationships({
        outbound: relData.outbound || [],
        inbound: relData.inbound || [],
      });

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
        .then((res: any) => {
          if (Array.isArray(res)) {
            setStructureNodes(res);
          } else if (res && Array.isArray(res.tree)) {
            setStructureNodes(res.tree);
          } else if (res && Array.isArray(res.flatNodes)) {
            setStructureNodes(res.flatNodes);
          } else {
            setStructureNodes([]);
          }
        })
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
    return (
      <div className="p-16 text-center text-xs font-mono text-ink-muted">
        Đang tải hồ sơ văn bản pháp quy...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-16 text-center text-xs font-mono text-diff-delete-text">
        Không tìm thấy hồ sơ văn bản.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action / Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule-light">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-seal-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Danh mục Văn bản</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyRagExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-surface border border-rule-strong text-xs font-mono text-ink-primary hover:bg-paper-warm transition-colors"
          >
            {ragCopied ? <Check className="w-3.5 h-3.5 text-diff-insert-text" /> : <Copy className="w-3.5 h-3.5 text-ink-muted" />}
            <span>{ragCopied ? 'Đã sao chép RAG JSON' : 'Xuất RAG Contract'}</span>
          </button>

          {versions.length >= 2 && (
            <Link
              href={`/documents/${doc.id}/compare?from=${fromVerId}&to=${toVerId}`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-seal-primary hover:bg-seal-secondary text-paper-base text-xs font-mono transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Đối chiếu Phiên bản</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Metadata Docket */}
      <div className="bg-paper-surface border border-rule-light">
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-rule-light">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-seal-primary text-paper-base border border-seal-primary">
                  {doc.documentNumber || 'CHƯA CÓ SỐ HIỆU'}
                </span>
                <span className="text-xs px-2 py-0.5 bg-paper-warm text-ink-primary font-mono border border-rule-light">
                  {doc.documentType || 'VĂN BẢN'}
                </span>
                <StatusBadge status={doc.status} size="sm" />
              </div>

              <h1 className="text-xl sm:text-2xl font-serif font-bold text-ink-primary tracking-tight leading-snug">
                {doc.title}
              </h1>

              <p className="text-xs font-mono text-ink-muted">
                Canonical ID: <span className="text-ink-primary select-all">{doc.canonicalId}</span>
              </p>
            </div>

            <div className="text-xs font-mono text-left md:text-right shrink-0 bg-paper-warm/50 p-3.5 border border-rule-light">
              <span className="text-ink-muted block text-[10px] uppercase tracking-wider">Cơ quan Nguồn Giám sát</span>
              <span className="text-ink-primary font-semibold font-serif block mt-0.5">{doc.source?.name}</span>
              {doc.sourceUrl && (
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-seal-primary hover:underline inline-flex items-center gap-1 mt-1 text-[11px]"
                >
                  <span>Mở liên kết gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Legal Dates Docket Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-paper-warm/30 p-4 border border-rule-light">
            <div>
              <span className="text-ink-muted block text-[10px] uppercase tracking-wider">Cơ quan Ban hành</span>
              <span className="text-ink-primary font-serif font-semibold mt-0.5 block">{doc.issuingAuthority || '—'}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px] uppercase tracking-wider">Ngày Ban hành</span>
              <span className="text-ink-primary mt-0.5 block">{formatDate(doc.issuingDate)}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px] uppercase tracking-wider">Ngày Có hiệu lực</span>
              <span className="text-ink-primary font-bold mt-0.5 block">{formatDate(doc.effectiveAt)}</span>
            </div>
            <div>
              <span className="text-ink-muted block text-[10px] uppercase tracking-wider">Ngày Hết hiệu lực</span>
              <span className="text-ink-muted mt-0.5 block">{formatDate(doc.expiredAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flagship Version Selector & Comparison Launcher */}
      {versions.length >= 2 && (
        <div className="bg-paper-warm/70 border border-rule-strong p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-seal-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-seal-primary" />
              <span>Đối chiếu Sai khác Văn bản (Legal Diff Docket)</span>
            </span>
            <p className="text-xs text-ink-muted">
              Lựa chọn 2 phiên bản để kích hoạt công cụ phân tích diff phân cấp &amp; từ ngữ (word-level):
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-ink-muted">Gốc:</span>
              <select
                value={fromVerId}
                onChange={(e) => setFromVerId(e.target.value)}
                className="px-2.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Phiên bản {v.versionNumber} ({formatDate(v.detectedAt)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-ink-muted">Đích:</span>
              <select
                value={toVerId}
                onChange={(e) => setToVerId(e.target.value)}
                className="px-2.5 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Phiên bản {v.versionNumber} ({formatDate(v.detectedAt)})
                  </option>
                ))}
              </select>
            </div>

            <Link
              href={`/documents/${doc.id}/compare?from=${fromVerId}&to=${toVerId}`}
              className="px-3.5 py-1.5 bg-seal-primary hover:bg-seal-secondary text-paper-base text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <span>Chạy So sánh</span>
              <GitCompare className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Layout: Version History & Legal Hierarchy Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version Timeline (1 Col) */}
        <div className="space-y-4">
          <div className="bg-paper-surface border border-rule-light p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rule-light">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-primary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-seal-primary" />
                <span>Lịch sử Phiên bản ({versions.length})</span>
              </h2>
            </div>

            <div className="space-y-2.5">
              {versions.map((ver) => {
                const isSelected = selectedVersionId === ver.id;
                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`p-3 border text-xs font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-paper-warm border-seal-primary'
                        : 'bg-paper-surface border-rule-light hover:border-rule-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className={isSelected ? 'text-seal-primary' : 'text-ink-primary'}>
                        Phiên bản {ver.versionNumber}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {formatDate(ver.detectedAt)}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-ink-muted mt-2">
                      <div className="flex items-center justify-between">
                        <span>SHA-256:</span>
                        <span className="font-mono text-ink-primary font-medium">
                          {truncateHash(ver.normalizedChecksum, 10)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Parser:</span>
                        <span className="text-ink-secondary">{ver.parserVersion}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-rule-light flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSnapshot(ver.id);
                        }}
                        className="text-[11px] text-seal-primary hover:underline flex items-center gap-1"
                      >
                        <Code className="w-3 h-3" />
                        <span>Xem Snapshot Gốc</span>
                      </button>
                      {isSelected && (
                        <span className="text-[10px] text-seal-primary font-semibold uppercase">Đang hiển thị</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal Relationships Card */}
          <div className="bg-paper-surface border border-rule-light p-4 space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-primary flex items-center gap-1.5 pb-2 border-b border-rule-light">
              <Share2 className="w-3.5 h-3.5 text-seal-primary shrink-0" />
              <span className="whitespace-nowrap">Quan hệ Pháp lý</span>
            </h2>

            {(!relationships?.outbound?.length && !relationships?.inbound?.length) ? (
              <p className="text-xs font-mono text-ink-muted py-2">
                Chưa có quan hệ pháp lý liên văn bản.
              </p>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {relationships.outbound?.map((rel: any) => (
                  <div key={rel.id} className="p-2.5 bg-paper-warm/50 border border-rule-light">
                    <span className="font-bold text-seal-primary mr-2 uppercase text-[10px] tracking-wider block sm:inline whitespace-nowrap">
                      {rel.relationshipType}
                    </span>
                    <Link
                      href={`/documents/${rel.targetDocumentId}`}
                      className="text-ink-primary hover:text-seal-primary underline font-serif"
                    >
                      {rel.targetDocument?.documentNumber || 'Văn bản Đích'}
                    </Link>
                  </div>
                ))}
                {relationships.inbound?.map((rel: any) => (
                  <div key={rel.id} className="p-2.5 bg-paper-warm/50 border border-rule-light">
                    <span className="font-bold text-ink-secondary mr-2 uppercase text-[10px] tracking-wider block sm:inline whitespace-nowrap">
                      ĐƯỢC {rel.relationshipType} BỞI
                    </span>
                    <Link
                      href={`/documents/${rel.sourceDocumentId}`}
                      className="text-ink-primary hover:text-seal-primary underline font-serif"
                    >
                      {rel.sourceDocument?.documentNumber || 'Văn bản Nguồn'}
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
        <div className="fixed inset-0 z-50 bg-ink-primary/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-surface border border-rule-strong max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-rule-light">
              <div>
                <h3 className="text-sm font-serif font-bold text-ink-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-seal-primary" />
                  <span>Snapshot Dữ liệu Gốc (Immutable Archival Record)</span>
                </h3>
                <span className="text-xs font-mono text-ink-muted block mt-0.5">
                  MIME: {snapshotData.mimeType} | Checksum: {truncateHash(snapshotData.contentChecksum, 16)}
                </span>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="text-ink-muted hover:text-ink-primary text-base font-mono px-2"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-paper-warm/60 p-4 border border-rule-light font-mono text-xs text-ink-primary whitespace-pre-wrap leading-relaxed">
              {snapshotData.rawContent}
            </div>

            <div className="flex justify-end pt-2 border-t border-rule-light">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-1.5 bg-paper-surface border border-rule-strong text-ink-primary text-xs font-mono hover:bg-paper-warm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
