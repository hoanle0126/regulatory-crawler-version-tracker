'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../../lib/api-client';
import { DiffViewer } from '../../../../components/DiffViewer';

export default function CompareVersionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const documentId = params.id as string;
  const fromVersionId = searchParams.get('from');
  const toVersionId = searchParams.get('to');

  const [document, setDocument] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [docData, versionsData] = await Promise.all([
        api.getDocument(documentId),
        api.getDocumentVersions(documentId),
      ]);
      setDocument(docData);
      setVersions(versionsData);

      if (fromVersionId && toVersionId) {
        const diff = await api.compareVersions(documentId, fromVersionId, toVersionId);
        setDiffResult(diff);
      }
    } catch (err: any) {
      console.error('Failed to load version diff comparison:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) loadData();
  }, [documentId, fromVersionId, toVersionId]);

  const handleVersionChange = (newFrom: string, newTo: string) => {
    router.push(`/documents/${documentId}/compare?from=${newFrom}&to=${newTo}`);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-mono text-ink-muted space-y-3">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-seal-primary" />
        <p>Đang chạy thuật toán phân tích sai khác cấu trúc pháp lý (LCS / Tree Diff)...</p>
      </div>
    );
  }

  if (error || !diffResult) {
    return (
      <div className="p-12 text-center text-xs font-mono text-diff-delete-text space-y-4 bg-paper-surface border border-rule-light max-w-xl mx-auto my-8">
        <p>Không thể tải dữ liệu so sánh phiên bản: {error || 'Chưa có thông tin đối chiếu'}</p>
        <Link
          href={`/documents/${documentId}`}
          className="inline-flex items-center gap-1.5 text-seal-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Hồ sơ Văn bản</span>
        </Link>
      </div>
    );
  }

  const fromVer = versions.find((v) => v.id === fromVersionId);
  const toVer = versions.find((v) => v.id === toVersionId);

  return (
    <div className="space-y-6">
      {/* Top Header & Version Docket */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-rule-light">
        <Link
          href={`/documents/${documentId}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-seal-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại {document?.documentNumber || 'Hồ sơ Văn bản'}</span>
        </Link>

        {/* Dynamic Version Selector Docket */}
        <div className="flex items-center gap-2 text-xs font-mono bg-paper-surface p-2 border border-rule-strong">
          <span className="text-ink-muted text-[11px] uppercase tracking-wider font-bold">Đối chiếu:</span>
          <select
            value={fromVersionId || ''}
            onChange={(e) => handleVersionChange(e.target.value, toVersionId || '')}
            className="px-2 py-1 bg-paper-warm/50 border border-rule-light text-ink-primary font-mono focus:outline-none"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </select>

          <span className="text-ink-muted font-bold">→</span>

          <select
            value={toVersionId || ''}
            onChange={(e) => handleVersionChange(fromVersionId || '', e.target.value)}
            className="px-2 py-1 bg-paper-warm/50 border border-rule-light text-ink-primary font-mono focus:outline-none"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flagship Diff Viewer (Editorial Redline Docket) */}
      <DiffViewer
        fromVersionNumber={fromVer?.versionNumber ?? 1}
        toVersionNumber={toVer?.versionNumber ?? 2}
        summary={{
          addedCount: diffResult.summary?.addedCount ?? diffResult.summary?.addedProvisions ?? (diffResult.changes || []).filter((i: any) => i.changeType === 'ADDED').length,
          modifiedCount: diffResult.summary?.modifiedCount ?? diffResult.summary?.modifiedProvisions ?? (diffResult.changes || []).filter((i: any) => i.changeType === 'MODIFIED').length,
          removedCount: diffResult.summary?.removedCount ?? diffResult.summary?.removedProvisions ?? (diffResult.changes || []).filter((i: any) => i.changeType === 'REMOVED').length,
          textSummary: diffResult.summary?.textSummary,
        }}
        changeItems={diffResult.changes || diffResult.changeItems || []}
        documentTitle={document?.title}
        documentNumber={document?.documentNumber}
      />
    </div>
  );
}
