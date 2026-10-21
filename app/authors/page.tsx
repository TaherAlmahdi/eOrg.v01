import Breadcrumb from '@/app/components/Breadcrumb';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import AuthorList from '@/app/components/AuthorList';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'লেখক নির্ঘণ্ট',
    siteName,
  });

  return {
    title: dynamicMetaTitle, // আউটপুট: "লেখক ❀ এডুলিচার"
  };
}

export default async function AuthorsPage() {
  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <Breadcrumb items={[{ label: 'লেখক নির্ঘণ্ট' }]} />



      {/* লেখক সেকশন */}
      <div className="max-w-full mx-auto py-4 px-4">
        <AuthorList sortBy="alphabetical" />
      </div>
    </main>
  );
}