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
      <div className="p-16 text-center text-xs font-mono text-slate-400 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400" />
        <p>Executing structural legal diff algorithm...</p>
      </div>
    );
  }

  if (error || !diffResult) {
    return (
      <div className="p-12 text-center text-xs font-mono text-rose-400 space-y-4">
        <p>Failed to compare versions: {error || 'No comparison data available'}</p>
        <Link
          href={`/documents/${documentId}`}
          className="inline-flex items-center gap-1 text-sky-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Document</span>
        </Link>
      </div>
    );
  }

  const fromVer = versions.find((v) => v.id === fromVersionId);
  const toVer = versions.find((v) => v.id === toVersionId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/documents/${documentId}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {document?.documentNumber || 'Document'}</span>
        </Link>

        {/* Dynamic Version Selector */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 p-2 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Compare:</span>
          <select
            value={fromVersionId || ''}
            onChange={(e) => handleVersionChange(e.target.value, toVersionId || '')}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </select>

          <span className="text-slate-500">→</span>

          <select
            value={toVersionId || ''}
            onChange={(e) => handleVersionChange(fromVersionId || '', e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flagship Diff Viewer */}
      <DiffViewer
        fromVersionNumber={fromVer?.versionNumber ?? 1}
        toVersionNumber={toVer?.versionNumber ?? 2}
        summary={{
          addedCount: diffResult.summary?.addedProvisions ?? diffResult.changeItems?.filter((i: any) => i.changeType === 'ADDED').length ?? 0,
          modifiedCount: diffResult.summary?.modifiedProvisions ?? diffResult.changeItems?.filter((i: any) => i.changeType === 'MODIFIED').length ?? 0,
          removedCount: diffResult.summary?.removedProvisions ?? diffResult.changeItems?.filter((i: any) => i.changeType === 'REMOVED').length ?? 0,
          textSummary: diffResult.summary?.textSummary,
        }}
        changeItems={diffResult.changeItems || []}
        documentTitle={document?.title}
        documentNumber={document?.documentNumber}
      />
    </div>
  );
}
