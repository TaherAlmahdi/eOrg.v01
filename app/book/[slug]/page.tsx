import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { Home } from "lucide-react";

export default async function BookIndexPage({ params }: { params: any }) {
  const { slug } = await params;
  const bookDir = path.join(process.cwd(), 'content', slug);
  const filePath = path.join(bookDir, 'index.md');

  if (!fs.existsSync(filePath)) {
    return <div className="text-center py-20 font-sans">বইটি পাওয়া যায়নি।</div>;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(content);

  const contentHtml = processedContent.toString();

  // ১. ভলিউম এবং সরাসরি চ্যাপ্টার ডিটেকশন
  const volumes = fs.readdirSync(bookDir)
    .filter(file => fs.statSync(path.join(bookDir, file)).isDirectory())
    .sort();

  const directChapters = fs.readdirSync(bookDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .sort();

  // ২. নেক্সট বাটন লজিক: স্লাগ 'book' এবং টেক্সট শুধুমাত্র টাইটেল
  let nextActionLink = "/books";
  let nextActionLabel = "";

  if (volumes.length > 0) {
    // ভলিউম থাকলে প্রথম ভলিউম পেজে যাবে
    nextActionLink = `/book/${slug}/${volumes[0]}`;
    nextActionLabel = volumes[0].toUpperCase(); 
  } else if (directChapters.length > 0) {
    // ভলিউম না থাকলে প্রথম অধ্যায়ে যাবে
    const firstChapFile = directChapters[0];
    nextActionLink = `/book/${slug}/${firstChapFile.replace('.md', '')}`;
    
    // অধ্যায়ের ফাইল থেকে টাইটেল রিড করা
    const firstChapContent = fs.readFileSync(path.join(bookDir, firstChapFile), 'utf8');
    const { data: chapData } = matter(firstChapContent);
    nextActionLabel = chapData.title || `অধ্যায় ${firstChapFile.replace('.md', '').replace('c', '')}`;
  }

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-3 px-4">
        <div className="max-w-[1440px] mx-auto text-sm text-white font-tarunima flex items-center">
          <Link href="/" className="hover:text-red-100 flex items-center gap-1"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50">/</span>
          <Link href="/books" className="hover:text-red-100">লাইব্রেরি</Link> 
          <span className="mx-2 text-white/50">/</span>
          <span className="text-white font-medium truncate">{data.title}</span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto px-0 py-0 grid grid-cols-12 gap-0">
        
        <aside className="col-span-12 ml-4 lg:col-span-3 space-y-1">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white shadow-sm mt-2">
              <img src={data.cover_image} alt={data.title} className="w-full h-auto object-cover" />
            </div>

            <div className="bg-white font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-2 text-red-900">পুস্তক বিবরণী</h3>
              <div className="text-sm space-y-1 text-gray-700">
                <p><strong>বই:</strong> {data.title}</p>
                <p><strong>লেখক:</strong> {data.author}</p>
              </div>
            </div>

            <div className="bg-white max-h-[400px] overflow-y-auto font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-4 text-red-900">সূচিপত্র</h3>
              {volumes.length > 0 ? (
                volumes.map((v) => (
                  <div key={v} className="mb-2">
                    <Link 
                      href={`/book/${slug}/${v}`}
                      className="font-bold text-blue-600 hover:text-red-900 mb-2 bg-gray-50 px-2 py-1 uppercase text-[10px] tracking-widest block rounded"
                    >
                      {v}
                    </Link>
                  </div>
                ))
              ) : (
                <ul className="pl-3 border-l-2 border-gray-100 space-y-1">
                  {directChapters.map(c => (
                    <li key={c}>
                      <Link href={`/book/${slug}/${c.replace('.md', '')}`} className="text-xs text-blue-600 block py-1">
                        অধ্যায় {c.replace('.md', '').replace('c', '')}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-9 bg-[#fff2e6] p-4 md:p-4 shadow-sm">
          <header className="mb-4 text-center font-tarunima">
            <h1 className="text-3xl md:text-4xl font-bold font-sabrina text-gray-900 mb-2">{data.title}</h1>
            <p className="text-lg text-red-900 font-tarunima">{data.author}</p>
          </header>

          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          <div className="mt-16 pt-8 border-t border-orange-200 flex justify-between items-center font-sans">
            <Link href="/books" className="text-gray-500 hover:text-red-900 flex items-center group transition-all">
              <span className="mr-2 transform group-hover:-translate-x-1">←</span> লাইব্রেরি
            </Link>
            
            <Link 
              href={nextActionLink} 
              className="bg-red-900 text-white px-8 py-3 rounded font-bold hover:bg-red-800 transition-all flex items-center group shadow-md"
            >
              {nextActionLabel} 
              <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}