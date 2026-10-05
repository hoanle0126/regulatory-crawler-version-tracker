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
  FileCheck2,
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
      {/* Top Header Legislative Docket Bar */}
      <div className="bg-[#fdfdfc] border border-[#ded7c8] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-ink-600 uppercase tracking-widest font-semibold">
              <span className="text-[#193354]">Biên Bản Đối Chiếu Quy Phạm Pháp Luật</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 bg-[#f0ebd9] rounded-sm text-ink-900 border border-[#dfd5c1]">
                Phiên bản v{fromVersionNumber} ➔ v{toVersionNumber}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-ink-950 mt-1.5 tracking-tight">
              {documentNumber ? `${documentNumber} — ` : ''}{documentTitle || 'Đối chiếu nội dung văn bản'}
            </h2>
            {summary.textSummary && (
              <p className="text-xs text-ink-700 mt-2.5 flex items-center gap-2 font-serif italic bg-[#f7f4ed] border border-[#ded7c8] px-3.5 py-2">
                <FileCheck2 className="w-4 h-4 text-[#193354] shrink-0 not-italic" />
                <span>{summary.textSummary}</span>
              </p>
            )}
          </div>

          {/* Counts & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f7f4ed] border border-[#ded7c8] rounded-sm whitespace-nowrap shrink-0">
              <span className="flex items-center gap-1 text-xs font-mono font-medium text-[#166534] whitespace-nowrap">
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                +{summary.addedCount} Thêm mới
              </span>
              <span className="text-[#d8d2c2]">|</span>
              <span className="flex items-center gap-1 text-xs font-mono font-medium text-[#854d0e] whitespace-nowrap">
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                {summary.modifiedCount} Sửa đổi
              </span>
              <span className="text-[#d8d2c2]">|</span>
              <span className="flex items-center gap-1 text-xs font-mono font-medium text-[#991b1b] whitespace-nowrap">
                <MinusCircle className="w-3.5 h-3.5 shrink-0" />
                -{summary.removedCount} Bãi bỏ
              </span>
            </div>

            {/* Split / Unified Toggle */}
            <div className="flex items-center bg-[#ede8dc] p-0.5 rounded-sm border border-[#d8d2c2] shrink-0">
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors rounded-sm whitespace-nowrap shrink-0',
                  viewMode === 'split'
                    ? 'bg-[#fdfdfc] text-[#193354] font-semibold shadow-xs border border-[#d8d2c2]'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                <Columns className="w-3.5 h-3.5 shrink-0" />
                <span>Song Song</span>
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors rounded-sm whitespace-nowrap shrink-0',
                  viewMode === 'unified'
                    ? 'bg-[#fdfdfc] text-[#193354] font-semibold shadow-xs border border-[#d8d2c2]'
                    : 'text-ink-600 hover:text-ink-900'
                )}
              >
                <Rows className="w-3.5 h-3.5 shrink-0" />
                <span>Hợp Nhất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 pt-3.5 border-t border-[#ede7d8] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <span className="text-xs text-ink-600 font-serif font-medium mr-2 whitespace-nowrap shrink-0">Lọc điều khoản:</span>
          {(['ALL', 'MODIFIED', 'ADDED', 'REMOVED'] as const).map((filter) => {
            const filterLabels = {
              ALL: 'TẤT CẢ',
              MODIFIED: 'SỬA ĐỔI',
              ADDED: 'THÊM MỚI',
              REMOVED: 'BÃI BỎ',
            };
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-mono transition-colors rounded-sm border whitespace-nowrap shrink-0',
                  selectedFilter === filter
                    ? 'bg-[#193354] text-white font-semibold border-[#193354]'
                    : 'bg-[#f7f4ed] text-ink-700 hover:bg-[#ede8dc] border-[#ded7c8]'
                )}
              >
                {filterLabels[filter]}
                {filter === 'ALL' && ` (${changeItems.length})`}
                {filter === 'MODIFIED' && ` (${summary.modifiedCount})`}
                {filter === 'ADDED' && ` (${summary.addedCount})`}
                {filter === 'REMOVED' && ` (${summary.removedCount})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Diff Content Container */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#fdfdfc] border border-[#ded7c8] p-12 text-center">
          <Info className="w-7 h-7 text-ink-400 mx-auto mb-2.5" />
          <p className="text-ink-900 font-serif font-semibold">Không có điều khoản nào khớp với bộ lọc đã chọn.</p>
          <p className="text-xs text-ink-500 mt-1 font-serif italic">Chọn &quot;TẤT CẢ&quot; để xem toàn bộ danh mục quy định thay đổi.</p>
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
                  'border transition-all bg-[#fdfdfc] shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
                  item.changeType === 'ADDED' && 'border-[#bbf7d0]',
                  item.changeType === 'MODIFIED' && 'border-[#fef08a]',
                  item.changeType === 'REMOVED' && 'border-[#fecaca]'
                )}
              >
                {/* Provision Header */}
                <div className="px-4 py-2.5 bg-[#f8f6f0] border-b border-[#ded7c8] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={item.changeType} type="change" size="sm" />
                    <span className="text-xs font-mono font-bold text-ink-950">
                      {item.hierarchyPath}
                    </span>
                    <span className="text-[11px] text-ink-500 font-mono">
                      [{item.nodeType}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyChunk(item, idx)}
                      title="Sao chép cấu trúc JSON của điều khoản cho hệ thống Legal RAG"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-mono bg-[#f2eee5] border border-[#ded7c8] text-ink-700 hover:text-ink-950 hover:bg-[#eae4d7] transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-[#166534]" />
                          <span className="text-[#166534] font-semibold">Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-ink-500" />
                          <span>Xuất RAG Chunk</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Provision Body: Split View or Unified View */}
                {viewMode === 'split' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#ded7c8] text-sm font-serif leading-relaxed">
                    {/* Old Version Provision */}
                    <div className="p-4 bg-[#faf8f4]">
                      <div className="text-[11px] font-mono font-bold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-[#ede7d8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-400" />
                        Phiên Bản Trước (v{fromVersionNumber})
                      </div>
                      {item.changeType === 'ADDED' ? (
                        <div className="text-ink-400 italic py-3 text-xs font-serif">
                          [Điều khoản chưa tồn tại trong Phiên bản v{fromVersionNumber}]
                        </div>
                      ) : item.changeType === 'MODIFIED' && item.wordDiff ? (
                        <div className="text-ink-900 whitespace-pre-wrap leading-relaxed text-[13.5px]">
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
                            'text-ink-900 whitespace-pre-wrap leading-relaxed text-[13.5px]',
                            item.changeType === 'REMOVED' && 'text-[#991b1b] line-through bg-[#fdf2f2] p-2 border border-[#fecaca]'
                          )}
                        >
                          {item.oldContent || '—'}
                        </div>
                      )}
                    </div>

                    {/* New Version Provision */}
                    <div className="p-4 bg-[#fbfdfa]">
                      <div className="text-[11px] font-mono font-bold text-[#166534] uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-[#cce3c5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
                        Phiên Bản Cập Nhật (v{toVersionNumber})
                      </div>
                      {item.changeType === 'REMOVED' ? (
                        <div className="text-[#991b1b] italic py-3 text-xs font-serif">
                          [Điều khoản đã bị bãi bỏ hoặc chấm dứt hiệu lực trong Phiên bản v{toVersionNumber}]
                        </div>
                      ) : item.changeType === 'MODIFIED' && item.wordDiff ? (
                        <div className="text-ink-950 whitespace-pre-wrap leading-relaxed text-[13.5px]">
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
                            'text-ink-950 whitespace-pre-wrap leading-relaxed text-[13.5px]',
                            item.changeType === 'ADDED' && 'text-[#166534] bg-[#edf6ee] p-2 border border-[#bbf7d0]'
                          )}
                        >
                          {item.newContent || '—'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Unified Redline View */
                  <div className="p-4 text-[13.5px] font-serif leading-relaxed bg-[#fdfdfc]">
                    {item.changeType === 'ADDED' && (
                      <div className="p-3.5 bg-[#edf6ee] border border-[#bbf7d0] text-[#166534] whitespace-pre-wrap">
                        <span className="font-mono text-xs font-bold block mb-1">
                          + [QUY ĐỊNH BỔ SUNG MỚI]
                        </span>
                        {item.newContent}
                      </div>
                    )}

                    {item.changeType === 'REMOVED' && (
                      <div className="p-3.5 bg-[#fdf2f2] border border-[#fecaca] text-[#991b1b] line-through whitespace-pre-wrap">
                        <span className="font-mono text-xs font-bold block mb-1 no-underline text-[#991b1b]">
                          - [QUY ĐỊNH BỊ BÃI BỎ]
                        </span>
                        {item.oldContent}
                      </div>
                    )}

                    {item.changeType === 'MODIFIED' && (
                      <div className="p-3.5 bg-[#fffdf5] border border-[#fef08a] text-ink-950 whitespace-pre-wrap leading-relaxed">
                        <span className="font-mono text-xs font-bold text-[#854d0e] block mb-1.5 pb-1 border-b border-[#fef08a]">
                          ~ [ĐIỀU KHOẢN SỬA ĐỔI NỘI DUNG]
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
                            <div className="text-[#991b1b] line-through mb-1.5 bg-[#fdf2f2] p-2 border border-[#fecaca]">
                              - {item.oldContent}
                            </div>
                            <div className="text-[#166534] bg-[#edf6ee] p-2 border border-[#bbf7d0]">
                              + {item.newContent}
                            </div>
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
