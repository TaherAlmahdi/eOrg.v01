import React from 'react';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';

// 🟢 ১. PWA Theme Color ও Viewport কনফিগারেশন
export const viewport: Viewport = {
  themeColor: '#047857', // emerald-700 এর হেক্স কোড
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// সাবডোমেন বা হোস্ট থেকে সঠিক সাইট টাইটেল বের করার হেলপার ফাংশন
function getDynamicSiteName(host: string): string {
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  const subdomain = (hostname.includes('eduliture.org') && parts.length > 2 && parts[0] !== 'www') 
    ? parts[0] 
    : (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') 
    ? parts[0] 
    : null;

  switch (subdomain) {
    case 'library':
      return 'এডুলিচার পাঠশালা';
    case 'nazrul':
      return 'নজরুল রচনাবলী';
    case 'bankim':
    case 'bunkim':
      return 'বঙ্কিম রচনাবলী';
    default:
      return 'এডুলিচার পাঠশালা';
  }
}

// 🟢 ২. Dynamic Metadata Generator
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteName = getDynamicSiteName(host);

  // আপনার কাঙ্ক্ষিত ট্যাব টাইটেল ফরম্যাট: গ্রন্থাগার ❀ {সাবডোমেন সাইট-টাইটেল}
  const title = `গ্রন্থাগার ❀ ${siteName}`;
  const description = 'বাংলা ভাষায় সর্বাধিক গ্রন্থের সমাহার';

  return {
    title,
    description,
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      title,
      description,
      siteName: 'এডুলিচার',
      locale: 'bn_BD',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-slate-50 flex flex-col">
      {/* 🌟 লাইব্রেরির স্পেশাল হেডার */}
      <header className="bg-emerald-700 text-white shadow-md">
        {/* হেডারের কন্টেন্ট এখানে থাকবে */}
      </header>

      {/* লাইব্রেরি সাবডোমেনের মূল কন্টেন্ট */}
      <main className="flex-grow">{children}</main>
    </div>
  );
}