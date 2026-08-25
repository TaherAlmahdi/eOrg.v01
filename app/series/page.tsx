import Link from 'next/link';
import { Home, Layers } from 'lucide-react';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import SeriesList from '@/app/components/SeriesList';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';

// 🔹 ডায়নামিক মেটাডেটা
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);

  const siteName = siteData?.title || 'এডুলিচার';

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'সিরিজ',
    siteName: siteName,
  });

  return {
    title: dynamicMetaTitle,
    openGraph: {
      title: dynamicMetaTitle,
    },
    twitter: {
      title: dynamicMetaTitle,
    },
  };
}

// 🔹 মূল সিরিজ ইনডেক্স পেজ
export default async function SeriesPage() {
  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার (ব্রেডকাম) */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
          <Link href="/" className="transition-colors shrink-0 hover:text-orange-200">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/series" className="transition-colors hover:text-orange-200 shrink-0">
            সিরিজ
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="font-medium">সকল সিরিজ</span>
        </div>
      </nav>


      {/* সিরিজ লিস্ট সেকশন */}
      <div className="w-full mx-auto px-2 py-4">
        <SeriesList sortBy="alphabetical" />
      </div>
    </main>
  );
}