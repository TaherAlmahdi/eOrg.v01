import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import GenreList from '@/app/components/GenreList';
import AuthorList from '@/app/components/AuthorList';
import SeriesList from '@/app/components/SeriesList';
import ItemList from '@/app/components/ItemList';
import { LibraryStats } from '@/app/components/LibraryStats';
import LatestBooks from '@/app/components/LatestBooks';
import { BookCopy, Calendar, ChevronRight, Layers, Users } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';
import { getSlug, getAuthorSlugFromTitle } from '../../lib/content/core/registry';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { headerConfig } from '../../lib/headerConfig';
import { getLibraryStats } from '@/app/lib/getLibraryStats';

// 🔹 টাইপ ডেফিনিশন
interface BookItem {
  id?: string;
  slug?: string;
  title?: string;
  author?: string;
  authorSlug?: string;
  cover?: string;
  published?: string | number;
  [key: string]: unknown;
}

interface LibraryData {
  latestBooks?: BookItem[];
  booksByGenre?: Record<string, BookItem[]>;
  booksBySeries?: Record<string, BookItem[]>;
  booksByItem?: Record<string, BookItem[] | { books?: BookItem[] } | BookItem>;
  totalItems?: number;
}

// 🏷️ Dynamic Metadata Export
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const siteData = getSubdomainData(host);
  const subdomain = siteData.subdomain || 'library';

  const currentConfig = headerConfig[subdomain] || headerConfig.library || headerConfig.main;

  const dynamicMetaTitle = buildTabTitle({
    siteName: currentConfig.siteName,
    tagline: currentConfig.tagline,
  });

  const description = `${currentConfig.siteName}-এর পাঠশালায় নতুন প্রকাশিত বই, লেখক এবং বিভিন্ন ঘরানার সমৃদ্ধ সংগ্রহ দেখুন।`;

  const ogTitle = currentConfig.siteName || 'এডুলিচার পাঠশালা';
  const dynamicOgImage = `https://eduliture.org/api/og?title=${encodeURIComponent(ogTitle)}&tagline=${encodeURIComponent('অনলাইন লাইব্রেরি ও পাঠশালা')}`;
  const shareImage = siteData?.ogImage || dynamicOgImage;

  return {
    title: dynamicMetaTitle,
    description: description,
    openGraph: {
      title: dynamicMetaTitle,
      description: description,
      images: shareImage ? [{ url: shareImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description: description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function LibraryHomePage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const siteData = getSubdomainData(host);
  const subdomain = siteData.subdomain || 'library';
  const currentConfig = headerConfig[subdomain] || headerConfig.library || headerConfig.main;

  // ক্লাউডফ্লেয়ার ফ্রেন্ডলি ডেটা ফেচিং (try-catch দিয়ে নিরাপদ রাখা হয়েছে)
  let libraryData: LibraryData = {};
  try {
    libraryData = (await getLibraryBooks()) as LibraryData;
  } catch (error) {
    console.error("Failed to load library books on Cloudflare Edge:", error);
  }

  const {
    latestBooks = [],
    booksByGenre = {},
    booksBySeries = {},
    booksByItem = {},
  } = libraryData;

  const bookMap = new Map<string, BookItem>();

  // সব সোর্স থেকে ইউনিক বই সংগ্রহ
  const registerBooks = (bookCollection: unknown) => {
    if (!bookCollection) return;

    if (Array.isArray(bookCollection)) {
      bookCollection.forEach((book) => {
        if (book && typeof book === 'object') {
          const item = book as BookItem;
          const id = String(item.id || item.slug || item.title || '');
          if (id) bookMap.set(id, item);
        }
      });
    } else if (typeof bookCollection === 'object') {
      const item = bookCollection as BookItem;
      const id = String(item.id || item.slug || item.title || '');
      if (id) bookMap.set(id, item);
    }
  };

  registerBooks(latestBooks);
  Object.values(booksByGenre).forEach(registerBooks);
  Object.values(booksBySeries).forEach(registerBooks);

  if (booksByItem && typeof booksByItem === 'object') {
    Object.values(booksByItem).forEach((itemGroup) => {
      if (Array.isArray(itemGroup)) {
        registerBooks(itemGroup);
      } else if (itemGroup && typeof itemGroup === 'object') {
        if ('books' in itemGroup && Array.isArray(itemGroup.books)) {
          registerBooks(itemGroup.books);
        } else {
          registerBooks(itemGroup);
        }
      }
    });
  }

  const allBooksList = Array.from(bookMap.values());

  // 🔹 সেন্ট্রালাইজড হেল্পার দিয়ে সঠিক স্ট্যাটস বের করা
  const stats = getLibraryStats(allBooksList);

  // 🔹 মোট জঁরা (Genre) সংখ্যা গণনা
  const totalGenresCount = Object.keys(booksByGenre).length;

  const sortedLatestBooks = [...latestBooks]
    .sort((a, b) => {
      const pubA = a.published;
      const pubB = b.published;

      const timeA = pubA ? new Date(Date.parse(String(pubA))).getTime() : 0;
      const timeB = pubB ? new Date(Date.parse(String(pubB))).getTime() : 0;

      const validA = !isNaN(timeA) && timeA > 0;
      const validB = !isNaN(timeB) && timeB > 0;

      if (validA && validB) return timeB - timeA;
      if (validA) return -1;
      if (validB) return 1;

      return (a.title || '').localeCompare(b.title || '', 'bn');
    })
    .slice(0, 16);

  const currentUrl = `https://${siteData.subdomain ? `${siteData.subdomain}.` : ''}eduliture.org`;

  const jsonLdData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': currentConfig.siteName || siteData.title || 'এডুলিচার',
      'url': currentUrl,
      'description': `${currentConfig.siteName}-এর পাঠশালায় নতুন প্রকাশিত বই, লেখক এবং বিভিন্ন ঘরানার সমৃদ্ধ সংগ্রহ দেখুন।`,
      'inLanguage': 'bn'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': currentConfig.siteName || 'এডুলিচার পাঠশালা',
      'url': currentUrl,
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': sortedLatestBooks.map((book, idx) => {
          const rawBookSlug = book.slug || book.id;
          const bookSlug = String(rawBookSlug);

          return {
            '@type': 'ListItem',
            'position': idx + 1,
            'item': {
              '@type': 'Book',
              'name': book.title || 'শিরোনামহীন',
              'author': {
                '@type': 'Person',
                'name': book.author || 'অজানা লেখক'
              },
              'url': `${currentUrl}/book/${encodeURIComponent(bookSlug)}`,
              ...(book.cover && { 'image': book.cover })
            }
          };
        })
      }
    }
  ];

  return (
    <div
      className="relative w-full min-h-screen px-2 py-4 bg-fixed bg-center bg-no-repeat bg-cover sm:px-4"
      style={{ backgroundImage: "url('/bg01.png')" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData).replace(/</g, '\\u003c'),
        }}
      />

      <div className="relative w-full h-auto mt-2 overflow-x-clip font-tarunima">

        {/* ১. Library Stats */}
        <section aria-labelledby="library-stats-heading">
          <div className="relative w-full h-auto overflow-x-clip">
            <div className="relative z-20 w-full mx-auto max-w-none">
              {(() => {
                const combinedPeople = new Set<string>();
                allBooksList.forEach((b: any) => {
                  if (b.author) {
                    String(b.author).split(',').forEach(name => {
                      const cleanName = name.trim();
                      if (cleanName) combinedPeople.add(cleanName);
                    });
                  }
                  if (b.editor) {
                    String(b.editor).split(',').forEach(name => {
                      const cleanName = name.trim();
                      if (cleanName) combinedPeople.add(cleanName);
                    });
                  }
                  if (b.translator) {
                    String(b.translator).split(',').forEach(name => {
                      const cleanName = name.trim();
                      if (cleanName) combinedPeople.add(cleanName);
                    });
                  }
                });

                return (
                  <LibraryStats />
                );
              })()}
            </div>
          </div>
        </section>

        {/* ২. নতুন বই সেকশন (LatestBooks কম্পোনেন্ট) */}
        <section aria-labelledby="latest-books-heading">
          <LatestBooks books={sortedLatestBooks} limit={16} />
        </section>

        {/* ৩. ঘরানা নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-up" className="relative">
          <div className="flex w-full items-center justify-between mt-4 px-3 sm:px-4 py-2 mb-4 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-3">
              <BookCopy size={22} className="shrink-0 animate-pulse text-[#008080]" />
              <h2 className="flex items-center gap-2 text-lg md:text-xl font-black text-slate-800 font-tarunima">
                <span className="text-[#008080]">ঘরানা</span> <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h2>
            </div>
            <Link
              href="/genres"
              className="text-xs sm:text-sm md:text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group shrink-0"
            >
              সব ঘরানা
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <GenreList limit={20} />
        </section>

        {/* ৪. প্রকরণ নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-up" className="relative">
          <div className="flex w-full items-center justify-between mt-4 px-3 sm:px-4 py-2 mb-4 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-3">
              <BookCopy size={22} className="shrink-0 animate-pulse text-[#008080]" />
              <h2 className="flex items-center gap-2 text-lg md:text-xl font-black text-slate-800 font-tarunima">
                <span className="text-[#008080]">প্রকরণ</span> <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h2>
            </div>
            <Link
              href="/items"
              className="text-xs sm:text-sm md:text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group shrink-0"
            >
              সব প্রকরণ
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ItemList limit={20} />
        </section>

        {/* ৫. সিরিজ নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-down" className="relative">
          <div className="flex w-full items-center justify-between mt-4 px-3 sm:px-4 py-2 mb-4 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Layers size={22} className="shrink-0 animate-pulse sm:w-6 sm:h-6" />
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 font-tarunima truncate">
                <span className="text-[#008080]">সিরিজ</span> <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h2>
            </div>
            <Link
              href="/series"
              className="text-xs sm:text-sm md:text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group shrink-0"
            >
              সব সিরিজ
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <SeriesList limit={20} />
        </section>

        {/* ৬. লেখক নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-up" className="relative">
          <div className="flex w-full items-center justify-between mt-4 px-3 sm:px-4 py-2 mb-4 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Users size={22} className="shrink-0 animate-pulse sm:w-6 sm:h-6" />
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-800 font-tarunima truncate">
                <span className="text-[#008080]">লেখক</span> <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h2>
            </div>
            <Link
              href="/authors"
              className="text-xs sm:text-sm md:text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group shrink-0"
            >
              সব লেখক
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <AuthorList limit={20} />
        </section>

      </div>
    </div>
  );
}