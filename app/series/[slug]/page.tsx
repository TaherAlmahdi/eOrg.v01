import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getSeriesTitle } from '@/app/lib/content/core/registry';
import { getLibraryBooks, sortSeriesBooks, slugify } from '@/app/lib/books';

import SeriesView, { type BookSeries } from '@/app/components/SeriesView';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ author?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

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

  const filteredBooks = (latestBooks as BookSeries[]).filter((book) => {
    if (subdomain && !['library', 'localhost:3000', 'eduliture'].includes(subdomain)) {
      const bookAuthor = book.authorSlug || book.author || '';
      if (slugify(String(bookAuthor)) !== slugify(subdomain)) {
        return false;
      }
    }

    const rawSeries = book.Series || book.series;
    if (!rawSeries) return false;

    const seriesList = Array.isArray(rawSeries) ? rawSeries : [rawSeries];

    return seriesList.some((s) => {
      const sStr = String(s).trim();
      const sNorm = slugify(sStr);

      return (
        sStr.toLowerCase() === decodedSlug.toLowerCase() ||
        sNorm === normalizedTarget ||
        sNorm === normalizedSlug
      );
    });
  });

  const sortedBooks = sortSeriesBooks(filteredBooks);

  return (
    <SeriesView
      seriesTitle={String(targetBengaliSeries)}
      books={sortedBooks}
      subdomain={subdomain}
    />
  );
}