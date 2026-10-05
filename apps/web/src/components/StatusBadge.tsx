import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'change' | 'crawl' | 'changeset';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'status', size = 'md' }: StatusBadgeProps) {
  const s = (status || '').toUpperCase();

  let colorClasses = 'bg-[#f4efe6] text-ink-700 border-[#ded5c5]';
  let label = s.replace(/_/g, ' ');

  if (type === 'change') {
    switch (s) {
      case 'ADDED':
        colorClasses = 'bg-[#edf6ee] text-[#166534] border-[#bbf7d0]';
        label = 'THÊM MỚI';
        break;
      case 'MODIFIED':
        colorClasses = 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]';
        label = 'SỬA ĐỔI';
        break;
      case 'REMOVED':
        colorClasses = 'bg-[#fdf2f2] text-[#991b1b] border-[#fecaca]';
        label = 'BÃI BỎ';
        break;
      default:
        colorClasses = 'bg-[#f4efe6] text-ink-700 border-[#ded5c5]';
    }
  } else if (type === 'crawl') {
    switch (s) {
      case 'SUCCESS':
      case 'COMPLETED':
        colorClasses = 'bg-[#edf6ee] text-[#166534] border-[#bbf7d0]';
        label = 'HOÀN TẤT';
        break;
      case 'RUNNING':
        colorClasses = 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
        label = 'ĐANG CHẠY';
        break;
      case 'FAILED':
        colorClasses = 'bg-[#fdf2f2] text-[#991b1b] border-[#fecaca]';
        label = 'THẤT BẠI';
        break;
      case 'QUEUED':
        colorClasses = 'bg-[#f5f3eb] text-ink-700 border-[#ded5c5]';
        label = 'CHỜ XỬ LÝ';
        break;
      default:
        colorClasses = 'bg-[#f4efe6] text-ink-700 border-[#ded5c5]';
    }
  } else if (type === 'changeset') {
    switch (s) {
      case 'DETECTED':
        colorClasses = 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]';
        label = 'MỚI PHÁT HIỆN';
        break;
      case 'REVIEWED':
        colorClasses = 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
        label = 'ĐÃ THẨM TRA';
        break;
      case 'ACKNOWLEDGED':
        colorClasses = 'bg-[#edf6ee] text-[#166534] border-[#bbf7d0]';
        label = 'ĐÃ XÁC NHẬN';
        break;
      case 'IGNORED':
        colorClasses = 'bg-[#f4efe6] text-ink-500 border-[#ded5c5]';
        label = 'BỎ QUA';
        break;
      default:
        colorClasses = 'bg-[#f4efe6] text-ink-700 border-[#ded5c5]';
    }
  } else {
    // Document lifecycle status
    switch (s) {
      case 'EFFECTIVE':
        colorClasses = 'bg-[#edf6ee] text-[#166534] border-[#bbf7d0]';
        label = 'CÒN HIỆU LỰC';
        break;
      case 'AMENDED':
        colorClasses = 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]';
        label = 'ĐÃ SỬA ĐỔI / BỔ SUNG';
        break;
      case 'REPLACED':
        colorClasses = 'bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]';
        label = 'HẾT HIỆU LỰC (BỊ THAY THẾ)';
        break;
      case 'EXPIRED':
      case 'REPEALED':
        colorClasses = 'bg-[#fdf2f2] text-[#991b1b] border-[#fecaca]';
        label = 'HẾT HIỆU LỰC TOÀN BỘ';
        break;
      case 'NOT_YET_EFFECTIVE':
      case 'PUBLISHED':
        colorClasses = 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
        label = 'CHƯA CÓ HIỆU LỰC';
        break;
      default:
        colorClasses = 'bg-[#f4efe6] text-ink-700 border-[#ded5c5]';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-medium rounded-sm border uppercase tracking-wider whitespace-nowrap shrink-0',
        sizeClasses,
        colorClasses
      )}
    >
      {label}
    </span>
  );
}
