// app/genre/[slug]/page.tsx

import React from 'react';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getLibraryBooks } from '@/app/lib/books';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getGenreTitle } from '@/app/lib/content/core/registry';
import BooksPageClient, { Book } from '@/app/books/BooksPageClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  const targetBengaliGenre = getGenreTitle(decodedSlug) || slug;

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  const pageTitle = buildTabTitle({
    currentPageTitle: targetBengaliGenre,
    siteName,
  });

  return {
    title: pageTitle,
    openGraph: { title: pageTitle },
    twitter: { title: pageTitle },
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = slug.toLowerCase();

  const headerList = await headers();
  const subdomain = headerList.get('x-subdomain') || '';
  const host = headerList.get('host');
  const siteData = getSubdomainData(host);
  const siteTitle = siteData?.title || 'এডুলিচার';
  
  const targetBengaliGenre = getGenreTitle(decodedSlug) || slug;
  const targetStr = String(targetBengaliGenre).trim().toLowerCase();

  const { latestBooks } = await getLibraryBooks();

  // ফিল্টারিং লজিক (১. লেখক সাবডোমেন এবং ২. ঘরানা)
  const filteredBooks = latestBooks.filter((book) => {
    if (subdomain && subdomain !== 'library' && subdomain !== 'localhost:3000' && subdomain !== 'eduliture') {
      const bookAuthorSlug = (book as unknown as Record<string, unknown>).authorSlug || book.author;
      const isMatchingAuthor = String(bookAuthorSlug).trim().toLowerCase() === subdomain.trim().toLowerCase();
      if (!isMatchingAuthor) return false;
    }

    const rawGenres = book.genres || (book as unknown as Record<string, unknown>).genre;
    if (!rawGenres) return false;

    if (Array.isArray(rawGenres)) {
      return rawGenres.some((g: unknown) => String(g).trim().toLowerCase() === targetStr);
    }
    if (typeof rawGenres === 'string') {
      return String(rawGenres).trim().toLowerCase() === targetStr;
    }
    return false;
  });

  return (
    <BooksPageClient 
      initialBooks={filteredBooks as unknown as Book[]} 
      siteTitle={siteTitle}
      genreTitle={targetBengaliGenre}
    />
  );
}