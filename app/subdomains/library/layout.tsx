import React from 'react';
import type { Metadata, Viewport } from 'next';

// 🟢 ১. PWA Theme Color ও Viewport কনফিগারেশন
export const viewport: Viewport = {
  themeColor: '#047857', // emerald-700 এর হেক্স কোড
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// 🟢 ২. Library PWA-এর জন্য প্রয়োজনীয় Metadata
export const metadata: Metadata = {
  title: {
    default: 'eLibrary | Eduliture', // ডিফল্ট বা হোম পেজে যা দেখাবে
    template: '%s | Eduliture',     // অন্য পেজের জন্য (যেমন: "বইয়ের নাম | Eduliture")
  },
  description: 'বাংলা ভাষায় সর্বাধিক গ্রন্থের সমাহার',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'eLibrary', // ইনস্টল করা অ্যাপের নাম
  },
  formatDetection: {
    telephone: false,
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-slate-50 flex flex-col">
      {/* 🌟 লাইব্রেরির স্পেশাল হেডার */}
      <header className="bg-emerald-700 text-white shadow-md">
      </header>

      {/* লাইব্রেরি সাবডোমেনের মূল কন্টেন্ট */}
      <main className="flex-grow">{children}</main>
    </div>
  );
}