import Link from 'next/link';
import { headers } from 'next/headers';
import { Home, Users } from "lucide-react";
import type { Metadata } from 'next';
import AuthorList from "@/app/components/AuthorList";
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'লেখক',
    siteName, // 👈 siteTitle বদলে siteName ব্যবহার করা হলো
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
          <Link href="/" className="shrink-0"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/authors" className="hover:text-red-100 shrink-0">লেখক</Link> 
        </div>
      </nav>

      <header>
        <div className="flex justify-center mt-5">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-teal-50/90 text-[#008080] mb-8 border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Users size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-lg md:text-xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">পাঠশালা</span> লেখক <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
            </h1>
          </div>
        </div>
      </header>

      {/* লেখক সেকশন */}
      <div className="max-w-8xl mx-auto py-2 px-2">
        {/* AuthorList কম্পোনেন্ট */}
        <AuthorList sortBy="alphabetical" />
      </div>
    </main>
  );
}