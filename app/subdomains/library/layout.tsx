import React from 'react';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';


export const viewport: Viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

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

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteName = getDynamicSiteName(host);

  const title = `গ্রন্থাগার ❀ ${siteName}`;
  const description = 'বাংলা ভাষায় সর্বাধিক গ্রন্থের সমাহার';

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

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteName = getDynamicSiteName(host);

  return (
    <div className="min-h-screen max-w-full bg-slate-50 flex flex-col font-tarunima">
      <main className="flex-grow">{children}</main>
    </div>
  );
}