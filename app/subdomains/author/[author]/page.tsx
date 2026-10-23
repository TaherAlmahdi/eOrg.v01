import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import matter from 'gray-matter';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Sparkles } from 'lucide-react';
import { getLibraryBooks } from '../../../lib/books';
import { getSlug } from '../../../lib/content/core/registry';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { headerConfig } from '../../../lib/headerConfig';
import { readTextFromR2 } from '../../../lib/books/r2';

interface AuthorHomePageProps {
  params: Promise<{
    author: string;
    slug: string;
  }>;
}

// 🏷️ Dynamic Metadata Export for Tab Title & OG Image
export async function generateMetadata({ params }: AuthorHomePageProps): Promise<Metadata> {
  const { author } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const siteData = getSubdomainData(host);
  const subdomain = siteData.subdomain || 'library';
  const currentConfig = headerConfig[subdomain] || headerConfig.library || headerConfig.main;

  const r2Key = `pages/success/${author}.md`;
  let pageTitle = '';

  try {
    const fileSource = await readTextFromR2(r2Key);
    if (fileSource) {
      const { data } = matter(fileSource);
      if (data?.title) {
        pageTitle = data.title;
      }
    }
  } catch (err) {
    console.error('Metadata R2 MD parsing error:', err);
  }

  const fullTitle = pageTitle || (author ? author.charAt(0).toUpperCase() + author.slice(1) : '');

  const dynamicMetaTitle = buildTabTitle({
    siteName: currentConfig.siteName,
    tagline: currentConfig.tagline,
  });

  const description = `${fullTitle}-এর জীবন, সাহিত্য ও সমস্ত রচনার ডিজিটাল নির্ঘণ্ট দেখুন এডুলিচার পাঠশালায়।`;
  const ogImageUrl = `https://eduliture.org/api/og?title=${encodeURIComponent(fullTitle)}&tagline=${encodeURIComponent('লেখক ও সাহিত্যিক সংকলন')}`;

  return {
    title: dynamicMetaTitle,
    description: description,
    openGraph: {
      title: `${fullTitle} - এডুলিচার`,
      description: description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${fullTitle} - এডুলিচার`,
      description: description,
      images: [ogImageUrl],
    },
  };
}

export default async function AuthorHomePage({ params }: AuthorHomePageProps) {
  const { author } = await params;

  const r2Key = `pages/success/${author}.md`;
  let mdHtmlContent = '';
  let pageTitle = '';

  try {
    const fileSource = await readTextFromR2(r2Key);
    if (fileSource) {
      const { content, data } = matter(fileSource);
      mdHtmlContent = content;
      if (data?.title) {
        pageTitle = data.title;
      }
    } else {
      mdHtmlContent = `<div class="text-sm text-slate-500 italic py-4">${author} সংক্রান্ত কোনো কন্টেন্ট ফাইল পাওয়া যায়নি।</div>`;
    }
  } catch (err) {
    console.error('R2 MD parsing error:', err);
    mdHtmlContent = '<div class="text-sm text-red-500">পরিচিতি কন্টেন্ট লোড করার সময় সমস্যা হয়েছে।</div>';
  }

  // ইমেজের পাথ (fs ছাড়া সরাসরি পাবলিক পাথ ব্যবহার)
  const authorImageSrc = `/authors/${author}.webp`;

  const { latestBooks } = await getLibraryBooks();

  const fullTitle = pageTitle || (author ? author.charAt(0).toUpperCase() + author.slice(1) : '');
  const authorFirstName = fullTitle.split(' ')[0] || fullTitle;

  const authorBooks = latestBooks.filter((book) => {
    if (!book.author) return false;
    const formattedBookAuthor = book.author.toLowerCase().replace(/\s+/g, '-');
    return formattedBookAuthor === author.toLowerCase() || book.author.includes(authorFirstName);
  });

  const genreCounts: Record<string, number> = {};

  authorBooks.forEach((book) => {
    const genres = Array.isArray(book.genres)
      ? book.genres
      : typeof book.genres === 'string'
      ? [book.genres]
      : [];

    genres.filter(Boolean).forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const extractedGenres = Object.keys(genreCounts).sort(
    (a, b) => genreCounts[b] - genreCounts[a]
  );

  return (
    <div className="max-w-full mx-auto px-3 py-2 font-tarunima">
      <section aria-labelledby="welcome-heading" className="bg-white p-0 sm:p-0 overflow-hidden">
        <div className="flex justify-center pt-2 md:pt-6">
          <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
            <Sparkles size={28} className="shrink-0" />
            <h1 id="welcome-heading" className="text-xl md:text-3xl font-tarunima p-3 font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">{fullTitle}তে</span> <span className="text-[#cc7a00]"> স্বাগতম</span>!
            </h1>
          </div>
        </div>

        <div className="w-full text-slate-800 leading-relaxed">
          <div className="w-full aspect-[2/3] mb-3 md:float-left md:mr-3 md:mb-2 md:w-64 md:h-96 relative bg-slate-100 rounded border border-slate-200 overflow-hidden shadow-sm p-0 flex items-center justify-center">
            <Image
              src={authorImageSrc}
              alt={fullTitle ? `${fullTitle}-এর ছবি` : 'লেখকের ছবি'}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              priority
              className="object-contain drop-shadow-sm"
            />
          </div>

          <div 
            className="space-y-4 leading-relaxed [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-slate-900 [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:text-xl [&_ul]:md:text-2xl [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-1 [&_ol]:text-xl [&_ol]:md:text-2xl"
            dangerouslySetInnerHTML={{ __html: mdHtmlContent }}
          />
        </div>
      </section>

      <section aria-labelledby="genre-index-heading" className="mt-8">
        <div className="max-w-full mx-auto">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
              <Sparkles size={28} className="shrink-0" />
              <h1 id="genre-index-heading" className="text-xl md:text-2xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
                <span className="text-[#008080]">{authorFirstName}</span> <span className="text-gray-900">রচনা</span> <span className="text-[#cc7a00]">বিন্যাস</span>
              </h1>
            </div>
          </div> 

          {extractedGenres.length === 0 ? (
            <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
              <p className="text-lg text-slate-500 py-4 font-tarunima font-medium italic text-center">
                <span className="text-[#008080]">এডুলিচার</span> বিশুদ্ধজ্ঞান প্রকল্প <span className="text-[#cc7a00]">{fullTitle}</span>র নির্মাণের কাজ চলমান রয়েছে, অনুগ্রহ করে পরে আবার চেষ্টা করুন। আমাদের প্রকল্প উন্নয়ন কর্মীগণ চেষ্টা করছেন যতদূর সম্ভব দ্রুত আপনাদের সম্পূর্ণ <span className="text-[#cc7a00]">{fullTitle}</span> উপহার দেওয়ার জন্য। সাথে থাকার জন্য ধন্যবাদ।
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 w-full">
              {extractedGenres.map((genre) => {
                const genreSlug = getSlug("genres", genre) || genre;
                return (
                  <Link
                    key={genre}
                    href={`/genre/${genreSlug}`}
                    className="grow text-center min-w-30 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-medium p-3 rounded border border-slate-200 hover:border-emerald-300 transition-all text-sm md:text-base shadow-sm"
                  >
                    {genre}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}