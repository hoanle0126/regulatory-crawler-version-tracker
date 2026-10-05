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

  const nodeTypeColors: Record<string, string> = {
    DOCUMENT: 'text-sky-400 bg-sky-950/80 border-sky-800/60',
    PART: 'text-purple-400 bg-purple-950/80 border-purple-800/60',
    CHAPTER: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/60',
    SECTION: 'text-blue-400 bg-blue-950/80 border-blue-800/60',
    ARTICLE: 'text-amber-400 bg-amber-950/80 border-amber-800/60',
    CLAUSE: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60',
    POINT: 'text-teal-400 bg-teal-950/80 border-teal-800/60',
  };

  const badgeColor = nodeTypeColors[node.type] || 'text-slate-400 bg-slate-800 border-slate-700';

  return (
    <div className="text-xs font-mono">
      <div
        className={cn(
          'flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-800/50 transition-colors group cursor-pointer',
          depth > 0 && 'ml-4 border-l border-slate-800/80 pl-3'
        )}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <button className="text-slate-500 hover:text-slate-300 mt-0.5">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        <span
          className={cn(
            'px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider shrink-0 uppercase',
            badgeColor
          )}
        >
          {node.type} {node.number ? `#${node.number}` : ''}
        </span>

        <div className="flex-1 min-w-0">
          {node.title && (
            <span className="font-semibold text-slate-200 block truncate mb-0.5">
              {node.title}
            </span>
          )}
          <p className="text-slate-400 font-sans text-xs leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
            {node.content}
          </p>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {node.children!.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HierarchyTree({ nodes }: HierarchyTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No legal structure nodes parsed for this version.
      </div>
    );
  }

  return (
    <div className="space-y-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Bookmark className="w-4 h-4 text-sky-400" />
          <span>Parsed Vietnamese Legal Hierarchy</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {nodes.length} top-level provision(s)
        </span>
      </div>

      <div className="space-y-1">
        {nodes.map((node) => (
          <TreeNodeItem key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
