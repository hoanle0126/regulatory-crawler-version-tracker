import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'RegTracker — Hệ thống Giám sát & Truy vết Quy định Pháp luật',
  description:
    'Hệ thống giám sát văn bản quy phạm pháp luật, phân tích cấu trúc điều khoản (Phần, Chương, Mục, Điều, Khoản, Điểm) và so sánh phiên bản tự động.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#f8f6f0] text-ink-900 flex flex-col font-sans selection:bg-[#e8decb] selection:text-[#141311]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-rule bg-[#f3efe6] py-6 text-xs text-ink-600 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-serif italic text-ink-700">
              RegTracker • Hệ thống Giám sát &amp; So chiếu Căn cứ Pháp lý
            </span>
            <span className="text-[11px] text-ink-500 uppercase tracking-widest">
              Phiên bản độc lập • Bàn làm việc phân tích thể chế
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
