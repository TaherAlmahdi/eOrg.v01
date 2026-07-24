import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { Sparkles } from 'lucide-react';
import { getLibraryBooks } from '../../../lib/books';
import { getSlug } from '../../../lib/content/core/registry';

interface AuthorHomePageProps {
  params: Promise<{
    authorSlug: string;
  }>;
}

export default async function AuthorHomePage({ params }: AuthorHomePageProps) {
  const { authorSlug } = await params;

  // ১. লেখক পরিচিতির জন্য মার্কডাউন ফাইল পড়া
  const mdFilePath = path.join(
    process.cwd(),
    'content',
    'pages',
    'about',
    `${authorSlug}.md`
  );

  let mdContent: React.ReactNode = null;
  let pageTitle = '';

  if (fs.existsSync(mdFilePath)) {
    const fileSource = fs.readFileSync(mdFilePath, 'utf8');
    try {
      const { content, frontmatter } = await compileMDX<{ title?: string }>({
        source: fileSource,
        options: { parseFrontmatter: true },
        components: {
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl md:text-4xl font-black mb-4 mt-6 text-slate-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl md:text-3xl font-bold mb-3 mt-5 text-slate-900" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-xl md:text-2xl" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-xl md:text-2xl" {...props} />
          ),
        },
      });

      mdContent = content;
      if (frontmatter?.title) {
        pageTitle = frontmatter.title;
      }
    } catch (err) {
      console.error('MD parsing error:', err);
      mdContent = (
        <div className="text-sm text-red-500">
          পরিচিতি কন্টেন্ট লোড করার সময় সমস্যা হয়েছে।
        </div>
      );
    }
  } else {
    mdContent = (
      <div className="text-sm text-slate-500 italic py-4">
        {authorSlug} সংক্রান্ত কোনো কন্টেন্ট ফাইল পাওয়া যায়নি।
      </div>
    );
  }

  // 🖼️ ইমেজের অস্তিত্ব পরীক্ষা করা (404 এরর রোধে)
  const imageRelativePath = `/authors/${authorSlug}.webp`;
  const absoluteImagePath = path.join(process.cwd(), 'public', 'authors', `${authorSlug}.webp`);
  
  // যদি নির্দিষ্ট লেখকের ফাইল না থাকে, তবে ডিফল্ট ইমেজ দেখাবে
  const authorImageSrc = fs.existsSync(absoluteImagePath) 
    ? imageRelativePath 
    : '/authors/default.webp';

  // ২. লাইব্রেরি থেকে বইয়ের ডাটা আনা
  const { latestBooks } = await getLibraryBooks();

  // টাইটেল বা স্ল্যাগ থেকে প্রথমাংশ নেওয়া
  const fullTitle = pageTitle || (authorSlug ? authorSlug.charAt(0).toUpperCase() + authorSlug.slice(1) : '');
  const authorFirstName = fullTitle.split(' ')[0] || fullTitle;

  // ঐ লেখকের সব বই ফিল্টার করা
  const authorBooks = latestBooks.filter((book) => {
    if (!book.author) return false;
    const formattedBookAuthor = book.author.toLowerCase().replace(/\s+/g, '-');
    return formattedBookAuthor === authorSlug.toLowerCase() || book.author.includes(authorFirstName);
  });

  // ৩. 'genres' প্রপার্টি ব্যবহার করে ইউনিক ঘরানা তালিকা বের করা
  const extractedGenres = Array.from(
    new Set(
      authorBooks.flatMap((book) => {
        if (Array.isArray(book.genres)) return book.genres;
        if (typeof book.genres === 'string') return [book.genres];
        return [];
      }).filter(Boolean)
    )
  );

  return (
    <div className="max-w-full mx-auto px-3 py-2 font-tarunima">
      
      {/* 🌟 ১. পরিচিতি সেকশন */}
      <section
        aria-labelledby="welcome-heading"
        className="bg-white p-0 sm:p-0 overflow-hidden"
      >
        <div className="flex justify-center pt-2 md:pt-6">
          <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
            <Sparkles size={28} className="shrink-0" />
            <h1 id="welcome-heading" className="text-xl md:text-3xl font-tarunima p-3 font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">{fullTitle}তে</span> <span className="text-[#cc7a00]"> স্বাগতম</span>!
            </h1>
          </div>
        </div>

        <div className="w-full text-slate-800 leading-relaxed">
          <div className="w-full mb-6 md:float-left md:mr-6 md:mb-4 md:w-64 md:h-96 relative bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-sm p-2 flex items-center justify-center">
            <Image
              src={authorImageSrc}
              alt={fullTitle ? `${fullTitle}-এর ছবি` : 'লেখকের ছবি'}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              priority
              className="object-contain drop-shadow-sm p-2"
            />
          </div>

          <div className="space-y-4 leading-relaxed">
            {mdContent}
          </div>
        </div>
      </section>

      {/* 📚 ২. ঘরানা নির্ঘণ্ট সেকশন */}
      <section aria-labelledby="genre-index-heading" className="mt-8">
        <div className="max-w-full mx-auto">
          {/* হেডিং */}
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
              <p className="text-lg text-slate-500 py-4 font-tarunima font-medium italic text-center"><span className="text-[#008080]">এডুলিচার</span> বিশুদ্ধজ্ঞান প্রকল্প <span className="text-[#cc7a00]">{fullTitle}</span>র নির্মাণের কাজ চলমান রয়েছে, অনুগ্রহ করে পরে আবার চেষ্টা করুন। আমাদের প্রকল্প উন্নয়ন কর্মীগণ চেষ্টা করছেন যতদূর সম্ভব দ্রুত আপনাদের সম্পূর্ণ <span className="text-[#cc7a00]">{fullTitle}</span> উপহার দেওয়ার জন্য। সাথে থাকার জন্য ধন্যবাদ।</p>
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