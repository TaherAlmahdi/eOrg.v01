// app/items/page.tsx
import Link from 'next/link';
import { Home, Layers } from "lucide-react";
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import ItemList from '@/app/components/ItemList';
import { buildTabTitle } from '@/app/lib/get-site-data';

interface PageProps {
  searchParams: Promise<{ subdomain?: string }>;
  params?: Promise<{ author?: string }>;
}

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata({ searchParams, params }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = params ? await params : {};

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const headerSubdomain = headersList.get('x-subdomain');

  const subdomain = resolvedSearchParams?.subdomain || headerSubdomain;
  const authorSlug = resolvedParams?.author || (subdomain && subdomain !== 'library' ? subdomain : undefined);

  // সাবডোমেন বা হোস্টনেম অনুযায়ী সাইটের নাম ঠিক করার লজিক
  let siteName = 'এডুলিচার';

  if (host.includes('library.eduliture.org') || host.includes('library.') || subdomain === 'library') {
    siteName = 'এডুলিচার পাঠশালা';
  } else if (host.includes('nazrul.eduliture.org') || host.includes('nazrul.') || authorSlug === 'nazrul') {
    siteName = 'নজরুল রচনাবলী';
  } else if (authorSlug) {
    siteName = `${authorSlug} রচনাবলী`;
  }

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'প্রকরণাবলী',
    siteName: siteName,
  });

  return {
    title: dynamicMetaTitle,
    description: 'প্রকাশিত প্রকরণাবলী',
  };
}

export default async function ItemsPage({ searchParams, params }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = params ? await params : {};

  const headerList = await headers();
  const headerSubdomain = headerList.get('x-subdomain');

  const subdomain = resolvedSearchParams?.subdomain || headerSubdomain;
  const authorSlug = resolvedParams?.author || (subdomain && subdomain !== 'library' ? subdomain : undefined);

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/items" className="hover:text-red-100 shrink-0">প্রকরণ</Link>
        </div>
      </nav>

      {/* হেডার সেকশন */}
      <header>
        <div className="flex justify-center mt-5">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-teal-50/90 text-[#008080] mb-8 border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Layers size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-lg md:text-xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">
                {authorSlug ? 'রচনাবলী' : 'পাঠশালা'}
              </span>{' '}
              প্রকরণ{' '}
              <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
            </h1>
          </div>
        </div>
      </header>

      {/* প্রকরণ (ItemList) সেকশন */}
      <div className="max-w-8xl mx-auto py-2 px-2">
        <ItemList authorSlug={authorSlug} />
      </div>
    </main>
  );
}