import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import GenreList from '@/app/components/GenreList';
import AuthorList from '@/app/components/AuthorList';
import { BookCopy, Calendar, ChevronRight, Layers, Users } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';
import { getSlug, getAuthorSlugFromTitle } from '../../lib/content/core/registry';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { headerConfig } from '../../lib/headerConfig';
import SeriesList from '@/app/components/SeriesList';
import { LibraryStats } from '@/app/components/LibraryStats';

// 🏷️ Dynamic Metadata Export
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // 🔹 getSubdomainData থেকেই সেফলি সাবডোমেন এক্সট্র্যাক্ট করা
  const siteData = getSubdomainData(host);
  const subdomain = siteData.subdomain || 'library';
  
  // 🔹 headerConfig থেকে সঠিক ডাটা রিট্রিভ করা
  const currentConfig = headerConfig[subdomain] || headerConfig.library || headerConfig.main;

  // 🔹 ট্যাব টাইটেল: সাইট নেম ❀ ট্যাগলাইন ❀ মেইন ডোমেন টাইটেল
  const dynamicMetaTitle = buildTabTitle({
    siteName: currentConfig.siteName,
    tagline: currentConfig.tagline,
  });

  const description = `${currentConfig.siteName}-এর পাঠশালায় নতুন প্রকাশিত বই, লেখক এবং বিভিন্ন ঘরানার সমৃদ্ধ সংগ্রহ দেখুন।`;
  
  // 🖼️ ডাইনামিক OG Image বা সাইট ডাটার প্রচ্ছদ
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

  // 🔹 getLibraryBooks থেকে রিটার্ন হওয়া অবজেক্ট আনপ্যাক করা
  const { latestBooks = [], booksByGenre = {}, booksBySeries = {} } = await getLibraryBooks();

  // 🔹 সব ক্যাটাগরি ও সিরিজ থেকে ইউনিক বইগুলোর তালিকা তৈরি (allBooks-এর বিকল্প হিসেবে)
  const bookMap = new Map<string, Record<string, unknown>>();

  latestBooks.forEach((book) => {
    const item = book as unknown as Record<string, unknown>;
    const id = String(item.id || item.slug || book.title);
    bookMap.set(id, item);
  });

  Object.values(booksByGenre).flat().forEach((book) => {
    const item = book as unknown as Record<string, unknown>;
    const id = String(item.id || item.slug || book.title);
    if (!bookMap.has(id)) bookMap.set(id, item);
  });

  Object.values(booksBySeries).flat().forEach((book) => {
    const item = book as unknown as Record<string, unknown>;
    const id = String(item.id || item.slug || book.title);
    if (!bookMap.has(id)) bookMap.set(id, item);
  });

  const allBooksList = Array.from(bookMap.values());

  // 🔹 লেখক ও সিরিজের ইউনিক কাউন্ট বের করা
  const contributorSet = new Set(
    allBooksList
      .map((b) => String(b.author || '').trim())
      .filter(Boolean)
  );

  const seriesSet = new Set(
    Object.keys(booksBySeries).concat(
      allBooksList
        .map((b) => String(b.series || '').trim())
        .filter(Boolean)
    )
  );

  const getAuthorSlug = (bookItem: Record<string, unknown>): string => {
    const authorName = String(bookItem.author || '').trim();

    if (authorName) {
      const registrySlug = getAuthorSlugFromTitle(authorName) || getSlug('authors', authorName);
      if (registrySlug && registrySlug !== authorName && registrySlug !== encodeURIComponent(authorName)) {
        return registrySlug;
      }
    }

    if (bookItem.authorSlug) {
      return String(bookItem.authorSlug);
    }

    return authorName
      .toLowerCase()
      .replace(/\s+/g, '-');
  };

  const sortedLatestBooks = [...latestBooks]
    .sort((a, b) => {
      const pubA = a.published || (a as unknown as Record<string, unknown>).published;
      const pubB = b.published || (b as unknown as Record<string, unknown>).published;

      const timeA = pubA ? new Date(Date.parse(String(pubA))).getTime() : 0;
      const timeB = pubB ? new Date(Date.parse(String(pubB))).getTime() : 0;

      const validA = !isNaN(timeA) && timeA > 0;
      const validB = !isNaN(timeB) && timeB > 0;

      if (validA && validB) {
        return timeB - timeA;
      }
      if (validA) return -1;
      if (validB) return 1;

      return (a.title || '').localeCompare(b.title || '', 'bn');
    })
    .slice(0, 16);

  // 🌐 JSON-LD Structured Data (WebSite + CollectionPage)
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
          const item = book as unknown as Record<string, unknown>;
          const rawBookSlug = item.slug || book.id;
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
              'image': book.cover || undefined
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
      {/* 🚀 JSON-LD Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData).replace(/</g, '\\u003c'),
        }}
      />

      <div className="relative w-full h-auto mt-2 overflow-x-clip font-tarunima">
        
        {/* ১. Library Stats */}
        <section aria-labelledby="latest-books-heading">
          <div className="relative w-full h-auto overflow-x-clip">
            <div className="relative z-20 w-full mx-auto max-w-none">
              {/* 🔹 আলাদা করা স্ট্যাটস কম্পোনেন্ট */}
              <LibraryStats 
                totalAuthors={contributorSet.size}
                totalBooks={allBooksList.length}
                totalSeries={seriesSet.size}
              />
            </div>
          </div>
        </section>

        {/* ১. নতুন বই সেকশন */}
        <section aria-labelledby="latest-books-heading">
          <div className="flex items-end justify-between pb-2 mb-2 border-b border-slate-200">
            <h2 
              id="latest-books-heading" 
              className="flex items-center gap-2 pb-2 -mb-3 text-xl font-black border-b-2 text-slate-800 border-emerald-600"
            >
              <Calendar className="w-5 h-5 text-emerald-600" />
              নতুন বই
            </h2>
            <Link 
              href="/books" 
              className="text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1"
            >
              সকল বই 
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          
          {sortedLatestBooks.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">কোনো নতুন বই পাওয়া যায়নি।</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-0 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8">
              {sortedLatestBooks.map((book, index) => {
                const item = book as unknown as Record<string, unknown>;
                const rawBookSlug = item.slug || book.id;
                const bookSlug = String(rawBookSlug);
                const authorSlug = getAuthorSlug(item);

                const responsiveVisibilityClass = 
                  index >= 16 
                    ? "block sm:hidden xl:block"         
                    : index >= 8 
                      ? "block sm:hidden md:block"         
                      : "block";                          

                return (
                  <div 
                    key={bookSlug} 
                    className={`flex flex-col bg-white rounded border border-slate-200 shadow-sm transition-all hover:shadow-md group ${responsiveVisibilityClass}`}
                  >
                    <Link href={`/book/${encodeURIComponent(bookSlug)}`} className="relative block w-full overflow-hidden rounded-t aspect-2/3 bg-slate-100">
                      <Image
                        src={book.cover || '/images/default-book-cover.png'}
                        alt={book.title || 'বইয়ের প্রচ্ছদ'}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </Link>
                    
                    <div className="flex flex-col justify-between p-3 grow">
                      <div>
                        <h3 className="text-base font-bold leading-snug transition-colors text-slate-900 line-clamp-2 hover:text-emerald-600">
                          <Link href={`/book/${encodeURIComponent(bookSlug)}`}>
                            {book.title || 'শিরোনামহীন'}
                          </Link>
                        </h3>
                        
                        <p className="mt-1 text-xs text-slate-600 font-tarunima">
                          {book.author ? (
                            <Link 
                              href={`/author/${encodeURIComponent(authorSlug)}`}
                              className="transition-colors hover:text-emerald-600 hover:underline"
                            >
                              {book.author}
                            </Link>
                          ) : (
                            'অজানা লেখক'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ২. ঘরানা নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-up" className="relative">
          <div className="flex justify-center mt-5 mb-5">
            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded bg-teal-50/90 text-[#008080] mb-0 border border-teal-100 shadow-xs text-center backdrop-blur-md">
              <BookCopy size={24} className="shrink-0 animate-pulse" />
              <h1 className="text-xl font-black leading-none tracking-tight text-gray-900 md:text-2xl font-tarunima">
                <span className="text-[#008080]">এডুলিচার</span> ঘরানা <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h1>
            </div>
          </div>
          <GenreList limit={20} />
        </section>

        {/* ৩. সিরিজ নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-down" className="relative">
          <div className="flex justify-center mt-5 mb-5">
            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded bg-teal-50/90 text-[#008080] mb-0 border border-teal-100 shadow-xs text-center backdrop-blur-md">
              <Layers size={24} className="shrink-0 animate-pulse" />
              <h1 className="text-xl font-black leading-none tracking-tight text-gray-900 md:text-2xl font-tarunima">
                <span className="text-[#008080]">এডুলিচার</span> সিরিজ <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h1>
            </div>
          </div>
          <SeriesList limit={20} />
        </section>        

        {/* ৪. লেখক নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-up" className="relative">
          <div className="flex justify-center mt-5 mb-5">
            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded bg-teal-50/90 text-[#008080] mb-0 border border-teal-100 shadow-xs text-center backdrop-blur-md">
              <Users size={24} className="shrink-0 animate-pulse" />
              <h1 className="text-xl font-black leading-none tracking-tight text-gray-900 md:text-2xl font-tarunima">
                <span className="text-[#008080]">এডুলিচার</span> লেখক <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
              </h1>
            </div>
          </div>
          <AuthorList limit={20} />
        </section>

      </div>
    </div>
  );
}