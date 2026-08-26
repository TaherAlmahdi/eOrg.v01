import Link from 'next/link';
import { headers } from 'next/headers';
import { Home, Users } from 'lucide-react';
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
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/authors" className="hover:text-red-100 shrink-0">
            লেখক
          </Link>
        </div>
      </nav>



      {/* লেখক সেকশন */}
      <div className="max-w-8xl mx-auto py-4 px-4">
        <AuthorList sortBy="alphabetical" />
      </div>
    </main>
  );
}