import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { Home, BookOpen, ChevronRight } from "lucide-react";

type Props = {
  params: Promise<{ slug: string; volume: string }>;
};

export default async function VolumePage({ params }: Props) {
  const { slug, volume } = await params;
  
  const bookDir = path.join(process.cwd(), 'content', slug);
  const volPath = path.join(bookDir, volume);
  const bookIndexFile = path.join(bookDir, 'index.md');

  if (!fs.existsSync(volPath)) {
    return <div className="text-center py-20 font-sans">খণ্ডটি পাওয়া যায়নি।</div>;
  }

  // ১. মূল বইয়ের তথ্য সংগ্রহ (সাইডবারের জন্য)
  const bookIndexContent = fs.readFileSync(bookIndexFile, 'utf8');
  const { data: bookData } = matter(bookIndexContent);

  // ২. খণ্ডের মূল কন্টেন্ট রিড করা (v01/v01.md)
  const volMainFile = path.join(volPath, `${volume}.md`);
  let volContentHtml = "";
  let volTitle = volume.toUpperCase();
  
  if (fs.existsSync(volMainFile)) {
    const fileContent = fs.readFileSync(volMainFile, 'utf8');
    const { data: volData, content } = matter(fileContent);
    volTitle = volData.title || volTitle;

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(content);
    volContentHtml = processedContent.toString();
  }

  // ৩. অধ্যায় তালিকা সংগ্রহ (v01/chapters/)
  const chaptersDir = path.join(volPath, 'chapters');
  let chapters: any[] = [];

  if (fs.existsSync(chaptersDir)) {
    chapters = fs.readdirSync(chaptersDir)
      .filter(file => file.endsWith('.md'))
      .sort()
      .map(file => {
        const { data } = matter(fs.readFileSync(path.join(chaptersDir, file), 'utf8'));
        return {
          slug: file.replace('.md', ''),
          title: data.title || `অধ্যায় ${file.replace('.md', '').replace('c', '')}`,
        };
      });
  }

  // ৪. সাইডবারের জন্য ভলিউম লিস্ট
  const volumes = fs.readdirSync(bookDir)
    .filter(file => fs.statSync(path.join(bookDir, file)).isDirectory())
    .sort();

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* ব্রেডক্রাম */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-3 px-4 text-white">
        <div className="max-w-[1440px] mx-auto text-sm font-tarunima flex items-center">
          <Link href="/" className="hover:text-red-100 flex items-center gap-1"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50">/</span>
          <Link href="/books" className="hover:text-red-100">লাইব্রেরি</Link> 
          <span className="mx-2 text-white/50">/</span>
          <Link href={`/book/${slug}`} className="hover:text-red-100">{bookData.title}</Link>
          <span className="mx-2 text-white/50">/</span>
          <span className="font-medium truncate">{volTitle}</span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-0">
        
        {/* সাইডবার (ডিজাইন হুবহু আগের মত) */}
        <aside className="col-span-12 ml-4 lg:col-span-3 space-y-1">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white shadow-sm mt-4">
              <img src={bookData.cover_image} alt={bookData.title} className="w-full h-auto object-cover" />
            </div>

            <div className="bg-white max-h-[400px] overflow-y-auto font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-4 text-red-900">সূচিপত্র (খণ্ডসমূহ)</h3>
              {volumes.map((v) => (
                <div key={v} className="mb-2">
                  <Link 
                    href={`/book/${slug}/${v}`}
                    className={`font-bold mb-2 px-2 py-1 uppercase text-[10px] tracking-widest block rounded ${v === volume ? 'bg-red-900 text-white' : 'bg-gray-50 text-blue-600 hover:text-red-900'}`}
                  >
                    {v}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* মূল কন্টেন্ট (ডান পাশে) */}
        <section className="col-span-12 lg:col-span-9 bg-[#fff2e6] p-4 md:p-4 shadow-sm">
          <header className="mb-6 text-center">
            <p className="text-xl text-red-900 font-tarunima uppercase tracking-widest mb-2">{bookData.title}</p>
            <h1 className="text-2xl md:text-2xl font-bold font-sabrina text-gray-900 mb-2">{volTitle}</h1>
            <div className="w-20 h-1 bg-red-900 mx-auto mt-4"></div>
          </header>

          {/* খণ্ডের বর্ণনা */}
          {volContentHtml && (
            <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed pl-0">
              <div dangerouslySetInnerHTML={{ __html: volContentHtml }} />
            </article>
          )}

          {/* অধ্যায় তালিকা */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-red-900 font-tarunima mb-6 flex items-center gap-2 border-b pb-2">
              <BookOpen size={20} /> এই খণ্ডের অধ্যায়সমূহ
            </h2>
            <div className="grid gap-3">
              {chapters.map((chap, index) => (
                <Link 
                  key={chap.slug}
                  href={`/book/${slug}/${volume}/${chap.slug}`}
                  className="group bg-white p-4 border border-gray-100 shadow-sm flex items-center justify-between hover:border-red-200 transition-all rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-serif text-gray-200 group-hover:text-red-100 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-lg font-bold text-gray-800 group-hover:text-red-900 font-tarunima transition-colors">
                      {chap.title}
                    </span>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-red-900 transition-colors" size={20} />
                </Link>
              ))}
            </div>
          </div>

          {/* নেভিগেশন */}
          <div className="mt-16 pt-8 border-t border-orange-200 flex justify-between items-center font-sans">
            <Link href={`/book/${slug}`} className="text-gray-500 hover:text-red-900 flex items-center group transition-all">
              <span className="mr-2 transform group-hover:-translate-x-1">←</span> {bookData.title}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}