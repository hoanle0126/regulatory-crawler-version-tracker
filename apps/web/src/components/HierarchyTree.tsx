'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ILegalTreeNode {
  id: string;
  type: string;
  number?: string | null;
  title?: string | null;
  content: string;
  hierarchyPath: string;
  orderIndex: number;
  children?: ILegalTreeNode[];
}

interface HierarchyTreeProps {
  nodes: ILegalTreeNode[];
}

function TreeNodeItem({ node, depth = 0 }: { node: ILegalTreeNode; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const nodeTypeLabels: Record<string, string> = {
    DOCUMENT: 'VĂN BẢN',
    PART: 'PHẦN',
    CHAPTER: 'CHƯƠNG',
    SECTION: 'MỤC',
    ARTICLE: 'ĐIỀU',
    CLAUSE: 'KHOẢN',
    POINT: 'ĐIỂM',
  };

  const nodeTypeColors: Record<string, string> = {
    DOCUMENT: 'text-[#193354] bg-[#eef2f7] border-[#d5e0ee]',
    PART: 'text-[#581c87] bg-[#f5f3ff] border-[#ddd6fe]',
    CHAPTER: 'text-[#3730a3] bg-[#e0e7ff] border-[#c7d2fe]',
    SECTION: 'text-[#0369a1] bg-[#e0f2fe] border-[#bae6fd]',
    ARTICLE: 'text-[#92400e] bg-[#fef3c7] border-[#fde68a]',
    CLAUSE: 'text-[#166534] bg-[#edf6ee] border-[#bbf7d0]',
    POINT: 'text-ink-700 bg-[#f4efe6] border-[#ded5c5]',
  };

  const badgeColor = nodeTypeColors[node.type] || 'text-ink-700 bg-[#f4efe6] border-[#ded5c5]';
  const typeLabel = nodeTypeLabels[node.type] || node.type;

  return (
    <div className="text-xs">
      <div
        className={cn(
          'flex items-start gap-2.5 py-2 px-2.5 transition-colors group cursor-pointer border-b border-[#f4efe5]',
          depth > 0 && 'ml-4 border-l-2 border-[#ded7c8] pl-3.5',
          isExpanded ? 'bg-[#faf8f4]' : 'hover:bg-[#f5f0e6]/60'
        )}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <button className="text-ink-500 hover:text-ink-900 mt-0.5 shrink-0">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span
          className={cn(
            'px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold border tracking-wider shrink-0 uppercase',
            badgeColor
          )}
        >
          {typeLabel} {node.number ? node.number : ''}
        </span>

        <div className="flex-1 min-w-0">
          {node.title && (
            <span className="font-serif font-bold text-ink-950 block text-sm mb-1">
              {node.title}
            </span>
          )}
          <p className="text-ink-800 font-serif text-[13px] leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
            {node.content}
          </p>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HierarchyTree({ nodes }: HierarchyTreeProps) {
  const nodeList = Array.isArray(nodes)
    ? nodes
    : (nodes as any)?.tree || (nodes as any)?.flatNodes || [];

  if (!nodeList || nodeList.length === 0) {
    return (
      <div className="p-8 text-center text-ink-500 font-serif italic text-sm bg-[#fdfdfc] border border-[#ded7c8]">
        Chưa có cấu trúc điều khoản được bóc tách cho phiên bản này.
      </div>
    );
  }

  return (
    <div className="bg-[#fdfdfc] border border-[#ded7c8] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between p-4 bg-[#f8f6f0] border-b border-[#ded7c8] gap-2">
        <div className="flex items-center gap-2 text-xs font-serif font-bold text-ink-900 uppercase tracking-wider">
          <Bookmark className="w-4 h-4 text-[#193354] shrink-0" />
          <span className="whitespace-nowrap">Cây Cấu Trúc Điều Khoản Pháp Lý (Hệ Thống Hóa)</span>
        </div>
        <span className="text-[11px] font-mono text-ink-600 bg-[#ede8dc] px-2 py-0.5 rounded-sm border border-[#d8d2c2] whitespace-nowrap shrink-0">
          {nodeList.length} mục chính
        </span>
      </div>

      <div className="divide-y divide-[#f4efe5]">
        {nodeList.map((node: any) => (
          <TreeNodeItem key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
