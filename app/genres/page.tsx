import Breadcrumb from '@/app/components/Breadcrumb';
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
  const dynamicMetaTitle = `ঘরানা ❀ ${siteName}`;

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
      <Breadcrumb items={[{ label: 'ঘরানা' }]} />

      <header>

      </header>
      {/* জনরা সেকশন */}
      <div className="flex w-full items-center justify-between mt-0 px-3 sm:px-4 py-2 mb-4">
        {/* GenreList কম্পোনেন্ট: কোনো limit না দেওয়ায় সব জনরা শো করবে */}
        <GenreList sortBy="alphabetical" />
      </div>
    </main>
  );
}