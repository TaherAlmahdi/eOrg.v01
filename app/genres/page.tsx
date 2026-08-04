import Link from 'next/link';
import { Home, Layers } from "lucide-react";
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import GenreList from "@/app/components/GenreList"; // আপনার প্রজেক্টের সঠিক পাথ অনুযায়ী ইমপোর্ট করুন
import { buildTabTitle } from '@/app/lib/get-site-data';

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // সাবডোমেন বা হোস্টনেম অনুযায়ী সাইটের নাম ঠিক করার লজিক
  let siteName = 'এডুলিচার';

  if (host.includes('library.eduliture.org') || host.includes('library.')) {
    siteName = 'এডুলিচার পাঠশালা';
  } else if (host.includes('banglakosh.eduliture.org') || host.includes('banglakosh.')) {
    siteName = 'বাংলাকোষ';
  }

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'ঘরানা',
    siteName: siteName,
  });

  return {
    title: dynamicMetaTitle,
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
        <div className="flex justify-center mt-5">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-teal-50/90 text-[#008080] mb-8 border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Layers size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-lg md:text-xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">পাঠশালা</span> ঘরানা <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
            </h1>
          </div>
        </div></header>
      {/* জনরা সেকশন */}
      <div className="max-w-8xl mx-auto py-2 px-2">
        {/* GenreList কম্পোনেন্ট: কোনো limit না দেওয়ায় সব জনরা শো করবে */}
        <GenreList sortBy="alphabetical" />
      </div>
    </main>
  );
}