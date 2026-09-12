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

// 🔹 ইউনিকোড ও বানানগত ভিন্নতা (ই/ঈ, উ/ঊ, য়/য়, ড়/ড়) দূর করার নরমালাইজেশন ফাংশন
function normalizeBengaliSlug(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC') // ইউনিকোড প্রি-কম্পোজড ফর্ম নিশ্চিত করা
    .toLowerCase()
    // ই/ঈ, উ/ঊ এবং বর্ণগুলোর ভিন্ন রূপগুলো একীভূত করা যাতে বানান ভুল বা ভিন্নতা থাকলেও ম্যাচ করে
    .replace(/[ঈই]/g, 'ই')
    .replace(/[ঊউ]/g, 'উ')
    .replace(/য়/g, 'য়')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF-]+/g, '') // ইংরেজি, বাংলা ইউনিকোড এবং হাইফেন রাখা
    .replace(/--+/g, '-');
}

// 🔹 হেলপার ফাংশন: একক বা একাধিক নাম/অ্যারে থেকে নিখুঁতভাবে নাম ও স্লাগ রিট্রিভ করা
function resolveContributorRoles(fieldVal: unknown, slugVal: unknown): Array<{ name: string; slug: string; normalizedSlug: string }> {
  if (!fieldVal) return [];

  const rawNames: string[] = [];
  if (Array.isArray(fieldVal)) {
    fieldVal.forEach((v) => {
      if (typeof v === 'string') rawNames.push(v.trim());
      else if (v && typeof v === 'object') {
        const n = (v as any).name || (v as any).title || (v as any).label;
        if (n) rawNames.push(String(n).trim());
      }
    });
  } else if (typeof fieldVal === 'string' || typeof fieldVal === 'number') {
    const splitNames = String(fieldVal).split(/,|\s+এবং\s+/).map((s) => s.trim()).filter(Boolean);
    rawNames.push(...splitNames);
  }

  return rawNames.map((name, idx) => {
    let slug = '';
    if (name) {
      slug = getAuthorSlugFromTitle(name) || getSlug('authors', name) || '';
    }
    if (!slug && slugVal) {
      if (Array.isArray(slugVal)) {
        slug = String(slugVal[idx] || slugVal[0] || '').trim();
      } else {
        slug = String(slugVal).trim();
      }
    }
    if (!slug && name) {
      slug = normalizeBengaliSlug(name);
    }
    return {
      name,
      slug: slug.toLowerCase(),
      normalizedSlug: normalizeBengaliSlug(name)
    };
  });
}

// 🔹 হেলপার ফাংশন: বাংলা/ইংরেজি উভয় স্লাগ, বানান ভুল বা ভিন্ন রূপ মিলিয়ে বই ফিল্টার ও সর্ট করা
async function getAuthorDataAndBooks(rawSlug: string) {
  const libraryData = await getLibraryBooks();
  const booksToFilter = (libraryData as any)?.allBooks || (libraryData as any)?.latestBooks || [];

  let matchedPersonName: string | null = null;
  const decodedRawSlug = decodeURIComponent(rawSlug).trim();
  const normalizedRawSlug = normalizeBengaliSlug(decodedRawSlug);

  const authorBooks = booksToFilter.filter((book: any) => {
    const item = book as Record<string, unknown>;

    const authors = resolveContributorRoles(item.author || item.authors || item.writer, item.authorSlug || item.authorsSlug);
    const translators = resolveContributorRoles(item.translator || item.translators, item.translatorSlug || item.translatorsSlug);
    const editors = resolveContributorRoles(item.editor || item.editors, item.editorSlug || item.editorsSlug);

    let isMatchFound = false;

    const checkMatch = (person: { name: string; slug: string; normalizedSlug: string }) => {
      return (
        normalizedRawSlug === person.normalizedSlug ||
        normalizedRawSlug === normalizeBengaliSlug(person.slug) ||
        normalizeBengaliSlug(decodedRawSlug.toLowerCase()) === person.normalizedSlug ||
        person.normalizedSlug.includes(normalizedRawSlug) ||
        normalizedRawSlug.includes(person.normalizedSlug)
      );
    };

    for (const author of authors) {
      if (checkMatch(author)) {
        isMatchFound = true;
        if (!matchedPersonName) matchedPersonName = author.name;
        break;
      }
    }

    if (!isMatchFound) {
      for (const translator of translators) {
        if (checkMatch(translator)) {
          isMatchFound = true;
          if (!matchedPersonName) matchedPersonName = translator.name;
          break;
        }
      }
    }

    if (!isMatchFound) {
      for (const editor of editors) {
        if (checkMatch(editor)) {
          isMatchFound = true;
          if (!matchedPersonName) matchedPersonName = editor.name;
          break;
        }
      }
    }

    return isMatchFound;
  });

  // 🔹 Frontmatter-এর order প্রপার্টি অনুযায়ী বইগুলোকে ক্রমানুসারে (Ascending) সাজানো
  authorBooks.sort((a: any, b: any) => {
    const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : Infinity;
    const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : Infinity;
    return orderA - orderB;
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

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);

  const { authorName } = await getAuthorDataAndBooks(rawSlug);

  const fallbackName = rawSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const displayAuthorName = authorName || fallbackName;

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
    <div className="w-full min-h-screen mx-auto font-tarunima">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      <AuthorBookSearchGrid
        books={authorBooks as any}
        personName={displayAuthorName}
        siteName={siteData?.title || 'এডুলিচার পাঠশালা'}
      />
    </div>
  );
}