import { cache } from 'react';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getAllLibraryItems } from '@/app/lib/books';
import { getItemSlug } from '@/app/lib/content/core/registry/items';
import SingleItemView from '@/app/components/SingleItemView';

// স্থানীয় টাইপ ডিফিনিশন (অন্য ফাইল থেকে টাইপ ইম্পোর্ট করার উপর নির্ভরশীলতা এড়াতে)
export interface BaseItemData {
  title?: any;
  author?: any;
  bookTitle?: any;
  book?: any;
  slug?: string;
  href?: string;
  content?: string;
  body?: string;
  text?: string;
  description?: string;
  authorSlug?: string;
  author_slug?: string;
  itemSlug?: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * সেফ টেক্সট এক্সট্রাকশন
 */
function safeString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.name || val.title || val.slug || '';
  return String(val);
}

/**
 * ১. হেল্পার: নির্দিষ্ট সিঙ্গেল আইটেম এবং আইটেম নেভিগেশন (Prev/Next) বের করা
 */
const getSingleItemData = cache(async (targetSlug: string, authorSlug?: string) => {
  const rawItems = await getAllLibraryItems();
  const allItems: BaseItemData[] = Array.isArray(rawItems) ? rawItems : [];
  const decodedTargetSlug = getItemSlug(decodeURIComponent(targetSlug || '').trim());

  // সাবডোমেন বা লেখক ফিল্টারিং
  const filteredList = allItems.filter((entry) => {
    if (!authorSlug || authorSlug === 'library') return true;

    const rawAuthor = entry.authorSlug || entry.author_slug || safeString(entry.author);
    const entryAuthorSlug = getItemSlug(safeString(rawAuthor));

    return entryAuthorSlug === authorSlug.toLowerCase();
  });

  // বর্তমান স্লাগের সাথে মিলে যাওয়া আইটেম খুঁজে বের করা
  const currentIndex = filteredList.findIndex((entry) => {
    const rawTitle = safeString(entry.title);
    const entrySlug = getItemSlug(entry.slug || entry.itemSlug || rawTitle);
    return entrySlug === decodedTargetSlug;
  });

  if (currentIndex === -1) return null;

  return {
    item: filteredList[currentIndex],
    prevItem: currentIndex > 0 ? filteredList[currentIndex - 1] : null,
    nextItem: currentIndex < filteredList.length - 1 ? filteredList[currentIndex + 1] : null,
  };
});

// 🔹 ২. ডায়নামিক ট্যাব টাইটেল (Metadata)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  const data = await getSingleItemData(slug, siteData?.subdomain);
  if (!data?.item) {
    return { title: `আইটেম পাওয়া যায়নি ❀ ${siteName}` };
  }

  const itemTitle = safeString(data.item.title) || slug;
  const pageTitle = `${itemTitle} ❀ গ্রন্থাগার ❀ ${siteName}`;

  return {
    title: pageTitle,
    openGraph: { title: pageTitle },
    twitter: { title: pageTitle },
  };
}

// 🔹 ৩. মূল পেজ কম্পোনেন্ট
export default async function ItemPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const data = await getSingleItemData(slug, siteData?.subdomain);

  if (!data?.item) {
    notFound();
  }

  return (
    <SingleItemView
      item={data.item}
      prevItem={data.prevItem}
      nextItem={data.nextItem}
    />
  );
}