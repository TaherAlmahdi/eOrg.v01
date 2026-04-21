import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Home, Tag, BookOpen } from "lucide-react";

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string) => {
  const englishToBengali: any = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit]);
};

// ইংরেজি স্লাগ থেকে বাংলা শব্দের ম্যাপিং
const genreMap: Record<string, string> = {
  "novel": "উপন্যাস",
  "humor" : "রম্য সাহিত্য",
  "religious" : "ধর্মীয় সাহিত্য",
  "essays" : "প্রবন্ধাবলী",
  "poetry": "কবিতা",
  "classic": "ধ্রুপদী সাহিত্য",
  "folklore": "লোকগাথা",
  "history": "ইতিহাস",
  "story": "ছোটগল্প",
  "essay": "প্রবন্ধ",
  "drama": "নাটক",
  "letters": "পত্রাবলী",
  "others": "বিবিধ"
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const bengaliTitle = genreMap[slug.toLowerCase()] || slug;
  return {
    title: `${bengaliTitle} | গ্রন্থাগার`,
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = slug.toLowerCase();
  
  const targetBengaliGenre = genreMap[decodedSlug];
  const contentDir = path.join(process.cwd(), 'content');
  
  if (!fs.existsSync(contentDir)) {
    return <div className="text-center py-20">Content directory not found.</div>;
  }

  const bookSlugs = fs.readdirSync(contentDir).filter(file => 
    fs.statSync(path.join(contentDir, file)).isDirectory()
  );

  const filteredBooks = bookSlugs.map(bookSlug => {
    const indexPath = path.join(contentDir, bookSlug, 'index.md');
    if (fs.existsSync(indexPath)) {
      const fileContent = fs.readFileSync(indexPath, 'utf8');
      const { data } = matter(fileContent);
      const bookGenre = data.genre;

      const isMatch = Array.isArray(bookGenre)
        ? bookGenre.includes(targetBengaliGenre)
        : typeof bookGenre === 'string' && bookGenre === targetBengaliGenre;

      if (isMatch) {
        return {
          slug: bookSlug,
          title: data.title || bookSlug,
          cover: data.cover_image || '/default-cover.jpg',
          author: data.author || 'অজানা লেখক',
          first_published: data.first_published || Infinity
        };
      }
    }
    return null;
  }).filter((book): book is any => book !== null);

  // সর্টিং লজিক: প্রথমে সাল অনুযায়ী, সাল মিলে গেলে নাম অনুযায়ী (বাংলা বর্ণমালা)
  filteredBooks.sort((a, b) => {
    if (a.first_published !== b.first_published) {
      return a.first_published - b.first_published;
    }
    return a.title.localeCompare(b.title, 'bn');
  });

  return (
    <main className="bg-[#fdfcf8] min-h-screen font-tarunima">
      <nav className="w-full bg-[#7575a3] py-2 px-3 text-white shadow-md">
        <div className="max-w-8xl mx-auto flex items-center gap-3">
          <Link href="/" className="hover:text-orange-200"><Home size={18} /></Link>
          <span className="text-white/50">/</span>
          <Link href="/books" className="hover:text-orange-200">গ্রন্থাগার</Link>
          <span className="text-white/50">/</span>
          <span className="flex items-center gap-2 font-medium">
            <Tag size={16} /> {targetBengaliGenre || slug}
          </span>
        </div>
      </nav>

      <div className="max-w-8xl mx-auto py-2 px-3">
        <header className="mb-2 border-b border-orange-200 pb-3">
          <h2 className="text-2xl text-center md:text-2xl font-bold font-sabrina text-gray-800">
            ঘরানা: {targetBengaliGenre || slug}
          </h2>
          <p className="text-gray-500 text-center mt-2 italic">
            {filteredBooks.length > 0 
              ? `এই ঘরানায় মোট ${toBengaliNumber(filteredBooks.length)}টি বই রয়েছে` 
              : "এই ঘরানায় বর্তমানে কোনো বই নেই"}
          </p>
        </header>

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredBooks.map((book: any) => (
              <Link key={book.slug} href={`/book/${book.slug}`} className="group flex flex-col h-full">
                <div className="relative aspect-[2/3] overflow-hidden rounded shadow-lg bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                  <img 
                    src={book.cover} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-center text-gray-900 group-hover:text-red-900 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-center text-gray-500 mt-1 uppercase tracking-tight font-sans">
                    {book.author}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-orange-100 rounded-2xl">
            <BookOpen size={48} className="mx-auto text-orange-200 mb-4" />
            <p className="text-gray-400 text-lg italic">দুঃখিত, এই বিভাগে কোনো বই খুঁজে পাওয়া যায়নি।</p>
            <Link href="/books" className="mt-6 inline-block text-blue-600 underline">সকল বই দেখুন</Link>
          </div>
        )}
      </div>
    </main>
  );
}