import { headers } from 'next/headers';
import { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getAllBooks, Book } from '@/app/lib/books';
import BooksPageClient from './BooksPageClient';

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
    twitter: { title: dynamicMetaTitle }
  };
}

export default async function BooksPage() {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const currentSubdomain = siteData?.subdomain || 'library';

  const booksResponse = await getAllBooks(currentSubdomain);

  // TypeScript Type Safety Handling
  let booksData: Book[] = [];

  if (Array.isArray(booksResponse)) {
    booksData = booksResponse;
  } else if (booksResponse && typeof booksResponse === 'object') {
    const res = booksResponse as Record<string, unknown>;
    if (Array.isArray(res.books)) {
      booksData = res.books as Book[];
    } else if (Array.isArray(res.data)) {
      booksData = res.data as Book[];
    }
  }

  return (
    <BooksPageClient 
      initialBooks={booksData} 
      siteTitle={siteData?.title || 'এডুলিচার'} 
    />
  );
}