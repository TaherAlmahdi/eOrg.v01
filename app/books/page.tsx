import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
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

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const siteName = siteData?.title || 'এডুলিচার';
  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'গ্রন্থাগার',
    siteName,
  });

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

  const booksResponse = await getAllBooks(currentSubdomain);
  const booksData = parseBooksData(booksResponse);

  return (
    <BooksPageClient
      initialBooks={booksData}
      siteTitle={siteData?.title || 'এডুলিচার'}
    />
  );
}