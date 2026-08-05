import React from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getLibraryBooks } from '../../../../lib/books';
import { getSlug, getAuthorSlugFromTitle } from '../../../../lib/content/core/registry';
import AuthorBookSearchGrid from '@/app/components/AuthorBookSearchGrid';
import { buildTabTitle, getSubdomainData } from '@/app/lib/get-site-data';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 🔹 হেলপার ফাংশন: লেখক সংক্রান্ত ডাটা ও বই ফিল্টার করা
async function getAuthorDataAndBooks(rawSlug: string) {
  const libraryData = await getLibraryBooks();
  const booksToFilter = (libraryData as any)?.allBooks || (libraryData as any)?.latestBooks || [];

  const authorBooks = booksToFilter.filter((book: any) => {
    const item = book as Record<string, unknown>;
    const authorName = String(item.author || '').trim();

    let calculatedSlug = '';
    if (authorName) {
      calculatedSlug = getAuthorSlugFromTitle(authorName) || getSlug('authors', authorName) || '';
    }

    if (!calculatedSlug && item.authorSlug) {
      calculatedSlug = String(item.authorSlug);
    }

    if (!calculatedSlug && authorName) {
      calculatedSlug = authorName.toLowerCase().replace(/\s+/g, '-');
    }

    return calculatedSlug === rawSlug || authorName === rawSlug;
  });

  const matchedAuthorName = authorBooks.length > 0 ? (authorBooks[0] as any)?.author?.trim() : null;

  return {
    authorBooks,
    authorName: matchedAuthorName,
  };
}

// 🔹 ১. শতভাগ ডাইনামিক মেটাডেটা জেনারেশন ফাংশন
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug);

  // ১.১ হোস্টনেম থেকে সাবডোমেন/ডোমেনের সাইট ডাটা রিট্রিভ করা
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);

  // ১.২ লেখকের নাম বের করা
  const { authorName } = await getAuthorDataAndBooks(rawSlug);

  const fallbackName = rawSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const displayAuthorName = authorName || fallbackName;

  // ১.৩ ডাইনামিক ট্যাব টাইটেল বিল্ড করা
  // 🔹 siteTitle-এর বদলে siteName ব্যবহার করা হলো এবং siteData?.title পাস করা হলো
  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: displayAuthorName,
    siteName: siteData?.title || 'এডুলিচার',
  });

  return {
    title: dynamicMetaTitle,
  };
}

// 🔹 ২. মূল পেজ কম্পোনেন্ট
export default async function SingleAuthorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug);

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);

  const { authorBooks, authorName } = await getAuthorDataAndBooks(rawSlug);

  const fallbackName = rawSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const displayAuthorName = authorName || fallbackName;
  const currentFullUrl = `https://${siteData.subdomain ? `${siteData.subdomain}.` : ''}eduliture.org/author/${encodeURIComponent(rawSlug)}`;

  // 🌐 JSON-LD (Structured Data) তৈরি
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'mainEntity': {
      '@type': 'Person',
      'name': displayAuthorName,
      'url': currentFullUrl,
      'jobTitle': 'Author',
      'workExample': authorBooks.map((book: any) => ({
        '@type': 'Book',
        'name': book.title || 'শিরোনামহীন বই',
        'url': book.slug ? `https://${siteData.subdomain ? `${siteData.subdomain}.` : ''}eduliture.org/book/${book.slug}` : undefined,
        'image': book.cover_image || book.og_image || undefined
      }))
    }
  };

  return (
    <div className="w-full min-h-screen py-3 px-2 mx-auto font-tarunima">
      {/* 🚀 JSON-LD Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      <AuthorBookSearchGrid books={authorBooks as any} />
    </div>
  );
}