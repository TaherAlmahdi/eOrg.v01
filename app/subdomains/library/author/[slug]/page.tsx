// app/subdomains/library/author/[slug]/page.tsx

import React from 'react';
import { getLibraryBooks } from '../../../../lib/books';
import { getSlug, getAuthorSlugFromTitle } from '../../../../lib/content/core/registry';
import AuthorBookSearchGrid from '@/app/components/AuthorBookSearchGrid';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SingleAuthorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug);

  // 🟢 ১. ডাটা ফেচ করা
  const libraryData = await getLibraryBooks();

  // 🟢 ২. allBooks অথবা latestBooks নিরাপদে সংগ্রহ করা (যা-ই পাওয়া যাক)
  // ডাটা না থাকলে নিরাপদ ব্যাকআপ হিসেবে খালি অ্যারে [] থাকবে
  const booksToFilter = (libraryData as any)?.allBooks || (libraryData as any)?.latestBooks || [];

  // 🟢 ৩. নিরাপদে ফিল্টার করা (এখন আর undefined এরর আসবে না)
  const authorBooks = booksToFilter.filter((book: any) => {
    const item = book as Record<string, unknown>;
    const authorName = String(item.author || '').trim();

    // রেজিস্ট্রি থেকে অথর স্লাগ বের করা
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

    // স্লাগ অথবা নামের সাথে মিললে তা ফিল্টার হবে
    return calculatedSlug === rawSlug || authorName === rawSlug;
  });

  return (
    <div className="w-full min-h-screen py-3 px-2 mx-auto font-tarunima">
      {/* 🟢 ৪. ক্লায়েন্ট কম্পোনেন্টে ফিল্টার করা বইগুলো পাস করা */}
      <AuthorBookSearchGrid books={authorBooks as any} />
    </div>
  );
}