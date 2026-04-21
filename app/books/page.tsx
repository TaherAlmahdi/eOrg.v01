import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Home, BookOpen } from "lucide-react";

export const metadata = {
  title: 'লাইব্রেরি | সকল বইয়ের তালিকা',
};

export default function BooksPage() {
  const contentDir = path.join(process.cwd(), 'content');
  
  // content ফোল্ডারের ভেতর থেকে সব বইয়ের (ডিরেক্টরি) লিস্ট নেওয়া
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
        cover: data.cover_image || '/default-cover.jpg', // ইমেজ না থাকলে একটি ডিফল্ট ইমেজ
        author: data.author || 'অজানা লেখক'
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] py-4 px-6 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-3 font-tarunima">
          <Link href="/" className="hover:text-orange-200 transition-colors">
            <Home size={20} />
          </Link>
          <span className="text-white/50">/</span>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <BookOpen size={20} /> লাইব্রেরি
          </h1>
        </div>
      </nav>

      {/* বইয়ের গ্রিড */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-10 border-b border-orange-200 pb-4">
          <h2 className="text-3xl font-bold font-sabrina text-gray-800">সংগ্রহশালা</h2>
          <p className="text-gray-500 font-tarunima mt-1">আপনার পছন্দের বইটি বেছে নিন</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {allBooks.map((book: any) => (
            <Link 
              key={book.slug} 
              href={`/book/${book.slug}`}
              className="group flex flex-col h-full"
            >
              {/* কভার ইমেজ কার্ড */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-lg bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <img 
                  src={book.cover} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* বইয়ের তথ্য */}
              <div className="mt-4 flex flex-col flex-grow font-tarunima">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-900 transition-colors line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 uppercase tracking-tight">
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