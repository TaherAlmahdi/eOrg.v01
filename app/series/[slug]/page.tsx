import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getSeriesTitle } from '@/app/lib/content/core/registry';
import { getLibraryBooks, sortSeriesBooks, slugify, type Book } from '@/app/lib/books';

import SeriesView, { type SeriesBook } from '@/app/components/SeriesView';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ author?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim();

  const targetBengaliSeries = getSeriesTitle(decodedSlug) || decodedSlug;

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  const pageTitle = buildTabTitle({
    currentPageTitle: `${targetBengaliSeries} ❀ গ্রন্থাগার`,
    siteName,
  });

  return {
    title: pageTitle,
    openGraph: { title: pageTitle },
    twitter: { title: pageTitle },
  };
}

export default async function SeriesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const author = resolvedSearchParams.author;

  const decodedSlug = decodeURIComponent(slug).trim();

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);
  const subdomain = author || siteData?.subdomain || '';

  const targetBengaliSeries = getSeriesTitle(decodedSlug) || decodedSlug;
  const normalizedTarget = slugify(targetBengaliSeries);
  const normalizedSlug = slugify(decodedSlug);

  const { latestBooks = [] } = await getLibraryBooks();

  const filteredBooks = (latestBooks as Book[]).filter((book) => {
    // ১. সাবডোমেইন / লেখক ফিল্টার
    if (subdomain && !['library', 'localhost:3000', 'eduliture'].includes(subdomain)) {
      const bookAuthor = book.authorSlug || book.author || '';
      if (slugify(String(bookAuthor)) !== slugify(subdomain)) {
        return false;
      }
    }

    // ২. সিরিজ ফিল্টারিং (স্ট্রিং ও অবজেক্ট উভয় স্ট্রাকচার সাপোর্ট সহ)
    const rawSeries = book.Series || book.series || book.series_list || book.series_info;
    if (!rawSeries) return false;

    const seriesList = Array.isArray(rawSeries) ? rawSeries : [rawSeries];

    return seriesList.some((s) => {
      let sName = '';
      let sSlug = '';

      if (typeof s === 'string') {
        sName = s.trim();
        sSlug = slugify(sName);
      } else if (typeof s === 'object' && s !== null) {
        sName = String((s as Record<string, unknown>).name || '').trim();
        sSlug = (s as Record<string, unknown>).slug
          ? String((s as Record<string, unknown>).slug).trim()
          : slugify(sName);
      }

      const sNormName = slugify(sName);

      return (
        sName.toLowerCase() === decodedSlug.toLowerCase() ||
        sSlug === normalizedTarget ||
        sSlug === normalizedSlug ||
        sNormName === normalizedTarget ||
        sNormName === normalizedSlug
      );
    });
  });

  // ৩. টাইপ কাস্টিং সহ টার্গেট সিরিজ উল্লেখ করে সর্টিং হেলপার কল
  const sortedBooks = sortSeriesBooks(filteredBooks, targetBengaliSeries) as unknown as SeriesBook[];

  return (
    <SeriesView
      seriesTitle={String(targetBengaliSeries)}
      books={sortedBooks}
      subdomain={subdomain}
    />
  );
}