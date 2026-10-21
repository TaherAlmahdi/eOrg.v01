import Breadcrumb from '@/app/components/Breadcrumb';
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
      <Breadcrumb items={[{ label: 'সিরিজ', href: '/series' }, { label: 'সকল সিরিজ' }]} />


      {/* সিরিজ লিস্ট সেকশন */}
      <div className="w-full mx-auto px-2 py-4">
        <SeriesList sortBy="alphabetical" />
      </div>
    </main>
  );
}