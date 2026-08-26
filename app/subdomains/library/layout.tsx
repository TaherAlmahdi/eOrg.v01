import React from 'react';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'এডুলিচার পাঠশালা ❀ এডুলিচার', // ফ্যালব্যাক বা ডিফল্ট টাইটেল
  description: 'বাংলা ভাষায় সর্বাধিক গ্রন্থের সমাহার',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'এডুলিচার পাঠশালা',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-slate-50 flex flex-col">
      <header className="bg-emerald-700 text-white shadow-md"></header>
      <main className="flex-grow">{children}</main>
    </div>
  );
}