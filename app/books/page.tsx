import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Home, BookOpen, Tag } from "lucide-react";

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string) => {
  const englishToBengali: any = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit]);
};

export const metadata = {
  title: 'লাইব্রেরি | সকল বইয়ের তালিকা',
};

export default function BooksPage() {
  const contentDir = path.join(process.cwd(), 'content');
  
  // content ফোল্ডারের ভেতর থেকে সব বইয়ের (ডিরেক্টরি) লিস্ট নেওয়া
  const bookSlugs = fs.readdirSync(contentDir).filter(file => 
    fs.statSync(path.join(contentDir, file)).isDirectory()
  );

  const allBooks = bookSlugs.map(slug => {
    const indexPath = path.join(contentDir, slug, 'index.md');
    if (fs.existsSync(indexPath)) {
      const fileContent = fs.readFileSync(indexPath, 'utf8');
      const { data } = matter(fileContent);
      return {
        slug,
        title: data.title || slug,
        cover: data.cover_image || '/default-cover.jpg',
        author: data.author || 'অজানা লেখক'
      };
    }
    return null;
  }).filter((book): book is any => book !== null);

  // বইয়ের নাম (Bengali Title) অনুযায়ী ASC (অ-হ) ক্রমানুসারে সাজানো
  allBooks.sort((a, b) => a.title.localeCompare(b.title, 'bn'));

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link> 
        </div>
      </nav>

      {/* বইয়ের গ্রিড */}
      <div className="max-w-8xl mx-auto py-3 px-3">
        <div className="mb-2 border-b border-orange-200 pb-2">
          <h2 className="text-2xl text-center font-bold font-sabrina text-gray-800">গ্রন্থাগার</h2>
          <p className="text-gray-500 mt-2 text-center italic font-tarunima">
            {allBooks.length > 0 
              ? `মোট ${toBengaliNumber(allBooks.length)}টি বই রয়েছে; আপনার পছন্দের বইটি বেছে নিন` 
              : "এই মুহূর্তে কোনো বই পাওয়া যায়নি"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 border border-red-100">
          {allBooks.map((book: any) => (
            <Link 
              key={book.slug} 
              href={`/book/${book.slug}`}
              className="group flex flex-col h-full"
            >
              {/* কভার ইমেজ কার্ড */}
              <div className="relative aspect-[2/3] overflow-hidden rounded shadow-lg bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <img 
                  src={book.cover} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* বইয়ের তথ্য */}
              <div className="mt-1 flex flex-col flex-grow font-tarunima">
                <h3 className="text-lg text-center font-bold text-gray-900 group-hover:text-red-900 transition-colors line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-center text-gray-500 mt-1 uppercase tracking-tight">
                  {book.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}