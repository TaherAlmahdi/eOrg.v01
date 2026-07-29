import Link from 'next/link';
import { Home } from "lucide-react";
import { headers } from 'next/headers';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getAllBooks } from '@/app/lib/books'; // আপনার lib/books.ts থেকে হেল্পার

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string) => {
  const englishToBengali: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit] || digit);
};

export const metadata = {
  title: 'লাইব্রেরি | সকল বইয়ের তালিকা',
};

export default async function BooksPage() {
  // ১. বর্তমান সাবডোমেন সনাক্তকরণ
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const currentSubdomain = siteData.subdomain || 'library';

  // ২. সেন্ট্রাল হেল্পার থেকে সাবডোমেন অনুযায়ী বই ফেচ করা
  const booksData = await getAllBooks(currentSubdomain);

  // ৩. বাংলা শিরোনাম অনুযায়ী বর্ণানুক্রমিক (A-Z / অ-হ) সাজানো
  const allBooks = [...booksData].sort((a, b) => 
    (a.title || '').localeCompare(b.title || '', 'bn')
  );

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link> 
        </div>
      </nav>

      {/* বইয়ের গ্রিড */}
      <div className="max-w-8xl mx-auto py-2 px-2">
        <div className="mb-2 border-b border-orange-200 pb-2">
          <h2 className="text-2xl text-center font-bold font-sabrina text-gray-800">গ্রন্থাগার</h2>
          <p className="text-gray-500 mt-2 text-center italic font-tarunima">
            {allBooks.length > 0 
              ? `মোট ${toBengaliNumber(allBooks.length)}টি বই রয়েছে; আপনার পছন্দের বইটি বেছে নিন` 
              : "এই মুহূর্তে কোনো বই পাওয়া যায়নি"}
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 gap-2 border-b border-red-100">
          {allBooks.map((book) => (
            <Link 
              key={book.slug} 
              href={`/book/${book.slug}`}
              className="group font-tarunima flex flex-col h-full"
            >
              {/* কভার ইমেজ কার্ড */}
              <div className="relative aspect-2/3 overflow-hidden rounded shadow-lg bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <img 
                  src={book.cover_image || book.cover || '/default-cover.jpg'} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* বইয়ের তথ্য */}
              <div className="mt-1 flex flex-col grow font-tarunima">
                <h3 className="text-lg text-center font-bold text-gray-900 group-hover:text-red-900 transition-colors line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-center text-gray-500 mt-1 uppercase tracking-tight">
                  {book.author || 'অজানা লেখক'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}