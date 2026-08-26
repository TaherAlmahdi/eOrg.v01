import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getAllBooks, Book } from '@/app/lib/books';
import BooksPageClient from './BooksPageClient';

// 🔹 টাইপ-সেফ বুকস ডাটা এক্সট্র্যাক্টর হেলপার
function parseBooksData(booksResponse: unknown): Book[] {
  if (Array.isArray(booksResponse)) {
    return booksResponse as Book[];
  }

  if (booksResponse && typeof booksResponse === 'object') {
    const res = booksResponse as Record<string, unknown>;
    if (Array.isArray(res.books)) {
      return res.books as Book[];
    }
    if (Array.isArray(res.data)) {
      return res.data as Book[];
    }
  }

  return [];
}

// 🔹 ডাইনামিক মেটাডেটা ফাংশন (ডাবল নাম আসা রোধ করতে সরাসরি ফরম্যাট করা হলো)
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const siteName = siteData?.title || 'এডুলিচার পাঠশালা';
  
  // কাঙ্ক্ষিত ট্যাব টাইটেল ফরম্যাট: গ্রন্থাগার ❀ {সাবডোমেন সাইট-টাইটেল} ❀ এডুলিচার
  const dynamicMetaTitle = `গ্রন্থাগার ❀ ${siteName}`;

  return {
    title: dynamicMetaTitle,
    openGraph: { title: dynamicMetaTitle },
    twitter: { title: dynamicMetaTitle },
  };
}

// 🔹 মেইন পেজ কম্পোনেন্ট
export default async function BooksPage() {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const currentSubdomain = siteData?.subdomain || 'library';

  const siteName = siteData?.title || 'এডুলিচার পাঠশালা';
  const booksResponse = await getAllBooks(currentSubdomain);
  const booksData = parseBooksData(booksResponse);

  return (
    <BooksPageClient
      initialBooks={booksData}
      siteTitle={`${siteName}`} // পেজের ভেতরের টাইটেল ঠিক রাখা হলো
    />
  );
}