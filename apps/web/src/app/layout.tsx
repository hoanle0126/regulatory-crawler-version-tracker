import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'RegTracker — Regulatory Crawler & Version Tracking System',
  description:
    'Enterprise regulatory monitoring, Vietnamese legal structure parsing, structural diff engine, and version tracking for compliance and legal AI systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 bg-[#090d16] py-6 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>RegTracker • Regulatory Intelligence &amp; Version Tracking System</span>
            <span>Isolated Environment — Portfolio Project Demo</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
