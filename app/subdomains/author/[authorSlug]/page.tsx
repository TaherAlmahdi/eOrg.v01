import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Calendar, ChevronRight } from 'lucide-react';
import { compileMDX } from 'next-mdx-remote/rsc';

interface AuthorHomePageProps {
  params: {
    authorSlug: string; // যেমন: bankim
  };
}

export default async function AuthorHomePage({ params }: AuthorHomePageProps) {
  const { authorSlug } = params;

  // -------------------------------------------------------------
  // ১. MDX কন্টেন্ট সরাসরি ফাইল সিস্টেম (fs) থেকে রিড ও পার্স করা
  // -------------------------------------------------------------
  const mdxFilePath = path.join(process.cwd(), 'content', 'about', `${authorSlug}.mdx`);
  let mdxContent: React.ReactNode = null;

  if (fs.existsSync(mdxFilePath)) {
    const fileSource = fs.readFileSync(mdxFilePath, 'utf8');
    try {
      const { content } = await compileMDX({
        source: fileSource,
        options: { parseFrontmatter: true },
      });
      mdxContent = content;
    } catch (err) {
      console.error('MDX parsing error:', err);
      mdxContent = <p className="text-sm text-red-500">পরিচিতি কন্টেন্ট লোড করা যায়নি।</p>;
    }
  } else {
    mdxContent = (
      <p className="text-sm text-slate-500 italic py-4">
        {authorSlug} সংক্রান্ত বিস্তারিত তথ্য পাওয়া যায়নি।
      </p>
    );
  }

  // -------------------------------------------------------------
  // ২. আপনার প্রজেক্টের রুট থেকে বইয়ের ডাটা লোড করা (কাল্পনিক ফলব্যাক ডাটা রাখা হয়েছে)
  // -------------------------------------------------------------
  // আপনার প্রজেক্টে বইয়ের ডাটা যেখানে রাখা থাকে (যেমন: public/data/books.json বা কোনো API call) 
  // সে অনুযায়ী এখানে Fetching বসাতে পারেন।
  const authorBooks: Array<{ id: string; title: string; cover?: string; published?: string }> = [];

  return (
    <div className="max-w-full mx-auto px-4 py-6 space-y-16 font-tarunima">
      
      {/* 📜 ১. ওয়েলকাম সেকশন (বায়োগ্রাফি / পরিচিতি) */}
      <section 
        aria-labelledby="welcome-heading" 
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <h1 id="welcome-heading" className="sr-only">
          {authorSlug} - পরিচিতি ও রচনাবলী
        </h1>
        
        <div className="w-full text-slate-800 leading-relaxed text-base md:text-lg">
          {/* 🖼️ লেখকের ছবি: float-left ইনসেট */}
          <div className="float-left mr-6 mb-4 w-40 h-52 sm:w-48 sm:h-64 relative bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <Image
              src={`/authors/${authorSlug}.jpg`} // যেমন: public/authors/bankim.jpg
              alt={authorSlug}
              fill
              sizes="(max-w-768px) 160px, 192px"
              priority
              className="object-cover"
            />
          </div>

          {/* 📄 MDX থেকে আসা পরিচিতি অংশ */}
          <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:mb-4">
            {mdxContent}
          </div>
        </div>
      </section>

      {/* 🆕 ২. লেখকের সাম্প্রতিক প্রকাশনা সেকশন */}
      <section aria-labelledby="author-latest-books-heading">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-3">
          <h2 
            id="author-latest-books-heading" 
            className="text-2xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-3.5"
          >
            <Calendar className="w-5 h-5 text-emerald-600" />
            সাম্প্রতিক প্রকাশনা
          </h2>
          
          <Link 
            href={`/books`} 
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1 font-sans"
          >
            সকল বই 
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {authorBooks.length === 0 ? (
          <p className="text-sm text-slate-500 py-6">কোনো প্রকাশিত বই পাওয়া যায়নি।</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-5">
            {authorBooks.map((book) => (
              <div 
                key={book.id} 
                className="flex flex-col bg-white rounded border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <Link href={`/book/${book.id}`} className="relative aspect-2/3 w-full bg-slate-100 block">
                  <Image
                    src={book.cover || '/images/default-book-cover.png'}
                    alt={book.title}
                    fill
                    sizes="(max-w-768px) 50vw, (max-w-1200px) 25vw, 16vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </Link>
                
                <div className="p-3 flex flex-col grow justify-between">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors">
                    <Link href={`/book/${book.id}`}>
                      {book.title || 'শিরোনামহীন'}
                    </Link>
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}