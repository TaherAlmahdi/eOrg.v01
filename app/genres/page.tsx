import Link from 'next/link';
import { Home, Layers } from "lucide-react";
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GenreList from "@/app/components/GenreList"; // আপনার প্রজেক্টের সঠিক পাথ অনুযায়ী ইমপোর্ট করুন
import { getSubdomainData } from '@/app/lib/get-site-data';

// 🔹 ডাইনামিক মেটাডেটা ফাংশন (প্রথম পেজের আদলে আপডেট করা)
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const siteName = siteData?.title || 'এডুলিচার পাঠশালা';
  
  // ট্যাব টাইটেল ফরম্যাট: ঘরানা ❀ {সাবডোমেন সাইট-টাইটেল}
  const dynamicMetaTitle = `ঘরানা ❀ ${siteName} ❀ এডুলিচার`;

  return {
    title: dynamicMetaTitle,
    openGraph: { title: dynamicMetaTitle },
    twitter: { title: dynamicMetaTitle },
  };
}

export default async function GenresPage() {
  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/genres" className="hover:text-red-100 shrink-0">ঘরানা</Link>
        </div>
      </nav>

      <header>
        <div className="flex justify-center mt-3">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-teal-50/90 text-[#008080] mb-2 border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Layers size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-lg md:text-xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">পাঠশালা</span> ঘরানা <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
            </h1>
          </div>
        </div>
      </header>
      {/* জনরা সেকশন */}
      <div className="flex w-full items-center justify-between mt-0 px-3 sm:px-4 py-2 mb-4">
        {/* GenreList কম্পোনেন্ট: কোনো limit না দেওয়ায় সব জনরা শো করবে */}
        <GenreList sortBy="alphabetical" />
      </div>
    </main>
  );
}