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

// 🔹 হেলপার ফাংশন: যেকোনো নামের (লেখক/অনুবাদক/সম্পাদক) স্ল্যাগ বের করার নিয়ম
function resolveRoleSlug(nameVal: unknown, slugVal: unknown): { name: string; slug: string } {
  const name = String(nameVal || '').trim();
  let slug = '';

  if (name) {
    slug = getAuthorSlugFromTitle(name) || getSlug('authors', name) || '';
  }

  if (!slug && slugVal) {
    slug = String(slugVal).trim();
  }

  if (!slug && name) {
    slug = name.toLowerCase().replace(/\s+/g, '-');
  }

  return { name, slug };
}

// 🔹 হেলপার ফাংশন: লেখক, অনুবাদক ও সম্পাদক সংক্রান্ত ডাটা এবং সংশ্লিষ্ট বই ফিল্টার করা
async function getAuthorDataAndBooks(rawSlug: string) {
  const libraryData = await getLibraryBooks();
  const booksToFilter = (libraryData as any)?.allBooks || (libraryData as any)?.latestBooks || [];

  let matchedPersonName: string | null = null;

  const authorBooks = booksToFilter.filter((book: any) => {
    const item = book as Record<string, unknown>;

    // ১. লেখক (Author) ডাটা চেক
    const authorData = resolveRoleSlug(item.author, item.authorSlug);
    // ২. অনুবাদক (Translator) ডাটা চেক
    const translatorData = resolveRoleSlug(item.translator, item.translatorSlug);
    // ৩. সম্পাদক (Editor) ডাটা চেক
    const editorData = resolveRoleSlug(item.editor, item.editorSlug);

    // স্ল্যাগ বা নামের সাথে ম্যাচ করছে কিনা তা যাচাই
    const isAuthorMatch = authorData.slug === rawSlug || authorData.name === rawSlug;
    const isTranslatorMatch = translatorData.slug === rawSlug || translatorData.name === rawSlug;
    const isEditorMatch = editorData.slug === rawSlug || editorData.name === rawSlug;

    // যদি যেকোনো একটি ভূমিকায় ম্যাচ করে
    if (isAuthorMatch || isTranslatorMatch || isEditorMatch) {
      if (!matchedPersonName) {
        if (isAuthorMatch && authorData.name) matchedPersonName = authorData.name;
        else if (isTranslatorMatch && translatorData.name) matchedPersonName = translatorData.name;
        else if (isEditorMatch && editorData.name) matchedPersonName = editorData.name;
      }
      return true;
    }

    return false;
  });

  return {
    authorBooks,
    authorName: matchedPersonName,
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

  // ১.২ ব্যক্তির নাম বের করা
  const { authorName } = await getAuthorDataAndBooks(rawSlug);

  const fallbackName = rawSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const displayAuthorName = authorName || fallbackName;

  // ১.৩ ডাইনামিক ট্যাব টাইটেল বিল্ড করা
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
      'jobTitle': 'Author / Contributor',
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
      {/* 🔹 প্রপস হিসেবে সঠিক ব্যক্তির নাম এবং সাইট নেম পাস করা হলো */}
      <AuthorBookSearchGrid 
        books={authorBooks as any} 
        personName={displayAuthorName}
        siteName={siteData?.title || 'এডুলিচার পাঠশালা'}
      />
    </div>
  );
}