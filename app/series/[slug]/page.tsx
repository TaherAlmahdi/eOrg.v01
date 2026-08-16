import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getSeriesTitle } from '@/app/lib/content/core/registry';
import { getLibraryBooks } from '@/app/lib/books';

// ⚠️ SeriesView Default Export নাকি Named Export নিশ্চিত করে সঠিক ইম্পোর্টটি বেছে নিন:
// যদি SeriesView ফাইলে "export default function SeriesView" থাকে:
import SeriesView, { type BookSeries } from '@/app/components/SeriesView';

// যদি SeriesView ফাইলে "export function SeriesView" থাকে, তবে ওপরের লাইনটি কমেন্ট করে নিচেরটি আনকমেন্ট করুন:
// import { SeriesView, type BookSeries } from '@/app/components/SeriesView';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ author?: string }>;
}

// 🔹 ইউটিলিটি: স্লাগ নরম্যালাইজার (বাংলা ও ইংরেজি সাপোর্ট সহ)
const slugify = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF-]+/g, '')
    .replace(/\-\-+/g, '-');

// 🔹 ডায়নামিক মেটাডাটা জেনারেটর
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

// 🔹 সিরিজ পেজ মূল কম্পোনেন্ট
export default async function SeriesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const author = resolvedSearchParams.author;
  
  const decodedSlug = decodeURIComponent(slug).trim();

  // ১. সাবডোমেন ও হোস্ট ডেটা স্ট্র্যাক্ট করা
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteData = getSubdomainData(host);
  const subdomain = author || siteData?.subdomain || '';

  // ২. সিরিজের নাম ও নরম্যালাইজড স্লাগ নির্ধারণ
  const targetBengaliSeries = getSeriesTitle(decodedSlug) || decodedSlug;
  const normalizedTarget = slugify(targetBengaliSeries);
  const normalizedSlug = slugify(decodedSlug);

  // ৩. ডেটাবেস/রেজিস্ট্রি থেকে বই লোড করা
  const { latestBooks = [] } = await getLibraryBooks();

  // ৪. সাবডোমেন ও সিরিজ ভিত্তিক ফিল্টারিং
  const filteredBooks = (latestBooks as BookSeries[]).filter((book) => {
    // সাবডোমেন ফিল্টার (যদি নির্দিষ্ট কোনো লেখক সাবডোমেনে থাকে)
    if (subdomain && !['library', 'localhost:3000', 'eduliture'].includes(subdomain)) {
      const bookAuthor = book.authorSlug || book.author || '';
      if (slugify(String(bookAuthor)) !== slugify(subdomain)) {
        return false;
      }
    }

    // সিরিজের প্রপার্টি চেক (Series বা series)
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

  // ৫. প্রকাশনার প্রথম সাল অনুসারে শর্টিং
  filteredBooks.sort((a, b) => {
    const rawA = a.first_published || a.published;
    const rawB = b.first_published || b.published;

    const pubA = rawA ? parseInt(String(rawA), 10) || 0 : Infinity;
    const pubB = rawB ? parseInt(String(rawB), 10) || 0 : Infinity;

    if (pubA !== pubB) return pubA - pubB;
    return (a.title || '').localeCompare(b.title || '', 'bn');
  });

  return (
    <SeriesView
      seriesTitle={String(targetBengaliSeries)}
      books={filteredBooks}
      subdomain={subdomain}
    />
  );
}