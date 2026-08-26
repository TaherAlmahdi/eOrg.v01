import React from 'react';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// লেআউটের মেটাডেটা একদম সাধারণ রাখা হলো, যাতে পেজ ফাইলের টাইটেল সরাসরি বসে
export const metadata: Metadata = {
  title: 'এডুলিচার পাঠশালা',
  description: 'বাংলা ভাষায় সর্বাধিক গ্রন্থের সমাহার',
  manifest: '/manifest.webmanifest',
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-slate-50 flex flex-col">
      <header className="bg-emerald-700 text-white shadow-md"></header>
      <main className="flex-grow">{children}</main>
    </div>
  );
}