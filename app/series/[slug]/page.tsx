import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllBooks } from '@/app/lib/books';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getSlug, getSeriesTitle } from '@/app/lib/content/core/registry';
import { sortSeriesBooks } from '@/app/utils/sortUtils';

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

// 🔹 ১. মেটাডেটা জেনারেটর (Next.js অনুমোদিত এক্সপোর্ট)
export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug).toLowerCase();

  const targetBengaliSeries = getSeriesTitle(decodedSlug);

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  const pageTitle = `${targetBengaliSeries} ❀ গ্রন্থাগার ❀ ${siteName}`;

  return {
    title: pageTitle,
    openGraph: {
      title: pageTitle,
    },
    twitter: {
      title: pageTitle,
    },
  };
}

// 🔹 ২. মূল পেজ কম্পোনেন্ট (অবশ্যই export default হতে হবে)
export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);

  const allBooks = await getAllBooks();

  // সিরিজের বই ফিল্টার করা
  const rawSeriesBooks = allBooks.filter((book: any) => {
    if (typeof book.series === 'string') {
      return getSlug('series', book.series) === decodedSlug;
    }
    if (Array.isArray(book.series)) {
      return book.series.some((s: string) => getSlug('series', s) === decodedSlug);
    }
    return false;
  });

  if (rawSeriesBooks.length === 0) {
    notFound();
  }

  const seriesBooks = sortSeriesBooks(rawSeriesBooks);
  const seriesTitle = getSeriesTitle(decodedSlug);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 font-tarunima">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 border-b pb-3">
        সিরিজ: <span className="text-indigo-600">{seriesTitle}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seriesBooks.map((book: any, index: number) => (
          <div
            key={book.slug || index}
            className="p-4 bg-white rounded border border-gray-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 inline-block mb-2">
                পর্ব {book.seriesOrder || book.part || index + 1}
              </span>
              <h3 className="font-bold text-lg text-indigo-950">{book.title}</h3>
              {book.author && <p className="text-sm text-gray-600 mt-1">{book.author}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🔹 ৩. স্ট্যাটিক স্লাগ জেনারেটর (Next.js অনুমোদিত এক্সপোর্ট)
export async function generateStaticParams() {
  const allBooks = await getAllBooks();
  const seriesSet = new Set<string>();

  allBooks.forEach((book: any) => {
    if (typeof book.series === 'string') {
      seriesSet.add(getSlug('series', book.series));
    } else if (Array.isArray(book.series)) {
      book.series.forEach((s: string) => seriesSet.add(getSlug('series', s)));
    }
  });

  return Array.from(seriesSet).map((slug) => ({
    slug,
  }));
}