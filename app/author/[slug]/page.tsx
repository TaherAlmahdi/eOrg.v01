import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Home, User, BookOpen } from 'lucide-react';
import { getAllBooks } from '@/app/lib/books';
import { CONTENT_REGISTRY, getSlug, getAuthorSlugFromTitle } from '@/app/lib/content/core/registry';
import AuthorBookSearchGrid from '@/app/components/AuthorBookSearchGrid';

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

interface SingleAuthorPageProps {
  params: Promise<{
    authorSlug: string;
  }>;
}

export async function generateMetadata({ params }: SingleAuthorPageProps): Promise<Metadata> {
  const { authorSlug } = await params;
  const decodedSlug = decodeURIComponent(authorSlug);

  const authorName = CONTENT_REGISTRY.authors[decodedSlug] || decodedSlug;

  return {
    title: `${authorName}-এর বইসমূহ | এডুলিচার পাঠশালা`,
    description: `${authorName}-এর প্রকাশিত সকল বইয়ের তালিকা ও সংগ্রহের তথ্যাবলি।`,
  };
}

export default async function SingleAuthorPage({ params }: SingleAuthorPageProps) {
  const { authorSlug } = await params;
  const decodedSlug = decodeURIComponent(authorSlug);

  const allBooks = await getAllBooks();

  // 🔹 ১. উক্ত স্ল্যাগের লেখকের বইসমূহ ফিল্টার করা
  const authorBooks = allBooks.filter((book: any) => {
    const rawAuthor = book.author?.trim();
    if (!rawAuthor) return false;

    const currentSlug = getAuthorSlugFromTitle(rawAuthor) || getSlug("authors", rawAuthor);
    return currentSlug === decodedSlug;
  });

  if (!authorBooks || authorBooks.length === 0) {
    notFound();
  }

  // 🔹 ২. বইগুলোকে বর্ণানুক্রমিকভাবে (Alphabetical Order) সাজানো
  authorBooks.sort((a: any, b: any) => 
    (a.title || '').localeCompare(b.title || '', 'bn')
  );

  const rawAuthorName = authorBooks[0]?.author?.trim() || decodedSlug;
  const authorDisplayName = CONTENT_REGISTRY.authors[decodedSlug] || rawAuthorName;

  return (
    <main className="bg-[#fdfcf8] min-h-screen pb-12 font-tarunima">
      {/* ১. নেভিগেশন বার (Breadcrumb) */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0 hover:text-teal-200 transition-colors">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/authors" className="hover:text-teal-200 shrink-0 transition-colors">
            লেখক
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="text-amber-200 font-semibold shrink-0">{authorDisplayName}</span>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-3 md:px-6">
        {/* ২. হেডার এবং লেখক প্রোফাইল সেকশন */}
        <header className="mt-6 mb-8 p-6 md:p-8 bg-white/90 backdrop-blur-md rounded-xl border border-teal-100 shadow-xs">
          <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 text-center md:text-left">
            <div className="p-4 rounded-full bg-orange-50 text-[#cc7a00] border border-amber-200 shrink-0 shadow-inner">
              <User className="w-12 h-12 md:w-16 md:h-16" />
            </div>

            <div className="space-y-2 grow">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-[#008080] text-xs md:text-sm font-semibold border border-teal-100">
                <UsersIcon className="w-4 h-4" />
                <span>সম্মানিত লেখক</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
                {authorDisplayName}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                এডুলিচার পাঠশালা সংগ্রহশালায় মোট{' '}
                <span className="font-bold text-[#008080]">
                  {toBengaliNumber(authorBooks.length)}
                </span>{' '}
                টি বই রয়েছে।
              </p>
            </div>
          </div>
        </header>

        {/* ৩. সার্চ এবং বইয়ের গ্রিড সেকশন (Client Component) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200 gap-2">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#008080]" />
              <span>প্রকাশিত গ্রন্থসমূহ</span>
            </h2>
            <span className="text-xs md:text-sm text-gray-500">
              মোট: {toBengaliNumber(authorBooks.length)} টি
            </span>
          </div>

          <AuthorBookSearchGrid books={authorBooks} />
        </section>
      </div>
    </main>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}