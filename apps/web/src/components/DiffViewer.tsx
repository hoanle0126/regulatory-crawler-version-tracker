'use client';

import React, { useState } from 'react';
import {
  Columns,
  Rows,
  PlusCircle,
  MinusCircle,
  Edit3,
  Copy,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cn } from '../lib/utils';

export interface IDiffFragment {
  type: 'EQUAL' | 'INSERT' | 'DELETE';
  text: string;
}

export interface IChangeItemView {
  id?: string;
  nodeType: string;
  hierarchyPath: string;
  changeType: 'ADDED' | 'MODIFIED' | 'REMOVED' | 'UNCHANGED';
  oldContent?: string | null;
  newContent?: string | null;
  wordDiff?: IDiffFragment[];
  similarityScore?: number;
}

interface DiffViewerProps {
  fromVersionNumber: number;
  toVersionNumber: number;
  summary: {
    addedCount: number;
    modifiedCount: number;
    removedCount: number;
    textSummary?: string;
  };
  changeItems: IChangeItemView[];
  documentTitle?: string;
  documentNumber?: string;
}

export function DiffViewer({
  fromVersionNumber,
  toVersionNumber,
  summary,
  changeItems,
  documentTitle,
  documentNumber,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ADDED' | 'MODIFIED' | 'REMOVED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = changeItems.filter((item) => {
    if (selectedFilter === 'ALL') return item.changeType !== 'UNCHANGED';
    return item.changeType === selectedFilter;
  });

  const handleCopyChunk = (item: IChangeItemView, idx: number) => {
    const key = item.id || String(idx);
    const chunk = {
      documentNumber,
      documentTitle,
      version: toVersionNumber,
      hierarchyPath: item.hierarchyPath,
      changeType: item.changeType,
      content: item.newContent || item.oldContent,
    };
    navigator.clipboard.writeText(JSON.stringify(chunk, null, 2));
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Statistics Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <span>Structural Version Comparison</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">
                v{fromVersionNumber} → v{toVersionNumber}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              {documentNumber ? `${documentNumber} — ` : ''}{documentTitle || 'Legal Document Changes'}
            </h2>
            {summary.textSummary && (
              <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5 font-mono bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{summary.textSummary}</span>
              </p>
            )}
          </div>

          {/* Counts & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                <PlusCircle className="w-3.5 h-3.5" />
                +{summary.addedCount} Added
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-xs font-mono text-amber-400">
                <Edit3 className="w-3.5 h-3.5" />
                {summary.modifiedCount} Modified
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-xs font-mono text-rose-400">
                <MinusCircle className="w-3.5 h-3.5" />
                -{summary.removedCount} Removed
              </span>
            </div>

            {/* Split / Unified Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
                  viewMode === 'split'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Columns className="w-3.5 h-3.5" />
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
                  viewMode === 'unified'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Rows className="w-3.5 h-3.5" />
                Unified
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium mr-2">Filter Provisions:</span>
          {(['ALL', 'MODIFIED', 'ADDED', 'REMOVED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-mono transition-colors',
                selectedFilter === filter
                  ? 'bg-slate-800 text-sky-400 font-semibold border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {filter}
              {filter === 'ALL' && ` (${changeItems.length})`}
              {filter === 'MODIFIED' && ` (${summary.modifiedCount})`}
              {filter === 'ADDED' && ` (${summary.addedCount})`}
              {filter === 'REMOVED' && ` (${summary.removedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Diff Content Container */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No provisions match the selected filter.</p>
          <p className="text-xs text-slate-500 mt-1">Select &quot;ALL&quot; to view all changed legal clauses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const cardKey = item.id || `diff-${idx}`;
            const isCopied = copiedId === cardKey;

            return (
              <div
                key={cardKey}
                className={cn(
                  'rounded-xl border overflow-hidden transition-all bg-slate-900/90 shadow-md',
                  item.changeType === 'ADDED' && 'border-emerald-900/60 hover:border-emerald-700/80',
                  item.changeType === 'MODIFIED' && 'border-amber-900/60 hover:border-amber-700/80',
                  item.changeType === 'REMOVED' && 'border-rose-900/60 hover:border-rose-700/80'
                )}
              >
                {/* Provision Header */}
                <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={item.changeType} type="change" size="sm" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {item.hierarchyPath}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({item.nodeType})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyChunk(item, idx)}
                      title="Copy legal chunk JSON for Legal RAG system"
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>RAG Chunk</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Provision Body: Split View or Unified View */}
                {viewMode === 'split' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs font-mono leading-relaxed">
                    {/* Old Version Provision */}
                    <div className="p-4 bg-slate-950/30">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        Version {fromVersionNumber} (Prior Provision)
                      </div>
                      {item.changeType === 'ADDED' ? (
                        <div className="text-slate-600 italic py-2">
                          [Provision not present in Version {fromVersionNumber}]
                        </div>
                      ) : item.changeType === 'MODIFIED' && item.wordDiff ? (
                        <div className="text-slate-300 whitespace-pre-wrap">
                          {item.wordDiff.map((frag, fIdx) => {
                            if (frag.type === 'INSERT') return null; // In old column, ignore inserts
                            if (frag.type === 'DELETE') {
                              return (
                                <span key={fIdx} className="diff-removed-word">
                                  {frag.text}
                                </span>
                              );
                            }
                            return <span key={fIdx}>{frag.text}</span>;
                          })}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'text-slate-300 whitespace-pre-wrap',
                            item.changeType === 'REMOVED' && 'text-rose-400 line-through'
                          )}
                        >
                          {item.oldContent || '—'}
                        </div>
                      )}
                    </div>

                    {/* New Version Provision */}
                    <div className="p-4 bg-slate-900/40">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Version {toVersionNumber} (Amended Provision)
                      </div>
                      {item.changeType === 'REMOVED' ? (
                        <div className="text-rose-400/80 italic py-2">
                          [Provision repealed or removed in Version {toVersionNumber}]
                        </div>
                      ) : item.changeType === 'MODIFIED' && item.wordDiff ? (
                        <div className="text-slate-200 whitespace-pre-wrap">
                          {item.wordDiff.map((frag, fIdx) => {
                            if (frag.type === 'DELETE') return null; // In new column, ignore deletes
                            if (frag.type === 'INSERT') {
                              return (
                                <span key={fIdx} className="diff-added-word">
                                  {frag.text}
                                </span>
                              );
                            }
                            return <span key={fIdx}>{frag.text}</span>;
                          })}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'text-slate-200 whitespace-pre-wrap',
                            item.changeType === 'ADDED' && 'text-emerald-400'
                          )}
                        >
                          {item.newContent || '—'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Unified View */
                  <div className="p-4 text-xs font-mono leading-relaxed bg-slate-950/40">
                    {item.changeType === 'ADDED' && (
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 whitespace-pre-wrap">
                        <span className="font-bold text-emerald-400 block mb-1">
                          + [ADDED PROVISION]
                        </span>
                        {item.newContent}
                      </div>
                    )}

                    {item.changeType === 'REMOVED' && (
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 line-through whitespace-pre-wrap">
                        <span className="font-bold text-rose-400 block mb-1 no-underline">
                          - [REMOVED PROVISION]
                        </span>
                        {item.oldContent}
                      </div>
                    )}

                    {item.changeType === 'MODIFIED' && (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap">
                        <span className="font-bold text-amber-400 block mb-1">
                          ~ [MODIFIED CLAUSE]
                        </span>
                        {item.wordDiff ? (
                          item.wordDiff.map((frag, fIdx) => {
                            if (frag.type === 'INSERT') {
                              return (
                                <span key={fIdx} className="diff-added-word">
                                  {frag.text}
                                </span>
                              );
                            }
                            if (frag.type === 'DELETE') {
                              return (
                                <span key={fIdx} className="diff-removed-word">
                                  {frag.text}
                                </span>
                              );
                            }
                            return <span key={fIdx}>{frag.text}</span>;
                          })
                        ) : (
                          <>
                            <div className="text-rose-400/80 line-through mb-1">
                              - {item.oldContent}
                            </div>
                            <div className="text-emerald-400/90">+ {item.newContent}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
