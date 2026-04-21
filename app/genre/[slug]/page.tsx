import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { Home, Tag } from "lucide-react";

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const contentDir = path.join(process.cwd(), 'content');
  
  // সব বইয়ের ফোল্ডার রিড করা
  const bookSlugs = fs.readdirSync(contentDir).filter(file => 
    fs.statSync(path.join(contentDir, file)).isDirectory()
  );

  // জনরা অনুযায়ী বই ফিল্টার করা
  const filteredBooks = bookSlugs.map(bookSlug => {
    const indexPath = path.join(contentDir, bookSlug, 'index.md');
    if (fs.existsSync(indexPath)) {
      const fileContent = fs.readFileSync(indexPath, 'utf8');
      const { data } = matter(fileContent);
      
      // বইয়ের জনরা যদি ইউআরএল স্লাগের সাথে মেলে
      if (data.genre && data.genre.toLowerCase() === slug.toLowerCase()) {
        return {
          slug: bookSlug,
          title: data.title || bookSlug,
          cover: data.cover_image,
          author: data.author
        };
      }
    }
    return null;
  }).filter(Boolean);

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] py-4 px-6 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-3 font-tarunima">
          <Link href="/"><Home size={18} /></Link>
          <span className="text-white/50">/</span>
          <Link href="/books">লাইব্রেরি</Link>
          <span className="text-white/50">/</span>
          <span className="capitalize flex items-center gap-2">
            <Tag size={16} /> {slug}
          </span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-12 px-6">
        <header className="mb-10 border-b border-orange-200 pb-4">
          <h2 className="text-3xl font-bold font-sabrina text-gray-800 capitalize">
            বিভাগ: {slug}
          </h2>
          <p className="text-gray-500 font-tarunima mt-1">
            এই বিভাগে মোট {filteredBooks.length}টি বই পাওয়া গেছে
          </p>
        </header>

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {filteredBooks.map((book: any) => (
              <Link key={book.slug} href={`/book/${book.slug}`} className="group">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-md transition-transform group-hover:-translate-y-2">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="mt-3 font-tarunima font-bold text-gray-900 group-hover:text-red-900 line-clamp-1">
                  {book.title}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 font-tarunima text-gray-400">
            এই বিভাগে আপাতত কোনো বই নেই।
          </div>
        )}
      </div>
    </main>
  );
}