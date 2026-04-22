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

  // ১. ভলিউম ডিটেকশন এবং টাইটেল রিড
  const volumeFolders = fs.readdirSync(bookDir)
    .filter(file => fs.statSync(path.join(bookDir, file)).isDirectory())
    .sort();

  const volumes = volumeFolders.map(v => {
    const volIndex = path.join(bookDir, v, `${v}.md`);
    let title = v.toUpperCase();
    if (fs.existsSync(volIndex)) {
      const volMeta = matter(fs.readFileSync(volIndex, 'utf8')).data;
      title = volMeta.title || title;
    }
    return { id: v, title };
  });
// ইংরেজি নম্বরকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string) => 
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
  // ২. সরাসরি চ্যাপ্টার ডিটেকশন এবং টাইটেল রিড
  const chapterFiles = fs.readdirSync(bookDir)
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .sort();

  const directChapters = chapterFiles.map(c => {
    const chapContent = fs.readFileSync(path.join(bookDir, c), 'utf8');
    const { data: chapData } = matter(chapContent);
    return { 
      slug: c.replace('.md', ''), 
      title: chapData.title || `খণ্ড ${c.replace('.md', '').replace('c', '')}` 
    };
  });

  // ৩. নেক্সট বাটন লজিক
  let nextActionLink = "/books";
  let nextActionLabel = "গ্রন্থাগার";

  if (volumes.length > 0) {
    nextActionLink = `/book/${slug}/${volumes[0].id}`;
    nextActionLabel = volumes[0].title; 
  } else if (directChapters.length > 0) {
    nextActionLink = `/book/${slug}/${directChapters[0].slug}`;
    nextActionLabel = directChapters[0].title;
  }

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-3 px-4">
        <div className="max-w-[1440px] mx-auto text-sm text-white font-tarunima flex items-center">
          <Link href="/" className="hover:text-red-100 flex items-center gap-1"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50">/</span>
          <Link href="/books" className="hover:text-red-100">গ্রন্থাগার</Link> 
          <span className="mx-2 text-white/50">/</span>
          <span className="text-white font-medium truncate">{data.title}</span>
        </div>
      </nav>

      {/* মোবাইলে কলাম ১টি (grid-cols-1), ডেক্সটপে ১২টি (lg:grid-cols-12) */}
      <div className="max-w-[1440px] mx-auto px-0 py-0 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* কন্টেন্ট সেকশন: মোবাইলে order-1 (উপরে) */}
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-4 md:p-8 shadow-sm">
          <header className="mb-4 text-center font-tarunima">
            <h1 className="text-3xl md:text-4xl font-bold font-sabrina text-gray-900 mb-2">{data.title}</h1>
            <p className="text-lg text-red-900 font-tarunima">{data.author}</p>
          </header>

          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          <div className="mt-16 pt-8 border-t border-orange-200 flex justify-between items-center font-sans">
            <Link href="/books" className="text-gray-500 hover:text-red-900 flex items-center group transition-all">
              <span className="mr-2 transform group-hover:-translate-x-1">←</span> গ্রন্থাগার
            </Link>
            
            <Link 
              href={nextActionLink} 
              className="bg-red-900 text-white px-6 py-3 rounded font-bold hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base"
            >
              <span className="truncate max-w-[150px] md:max-w-none">{nextActionLabel}</span>
              <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </section>

        {/* সাইডবার: মোবাইলে order-2 (নিচে) */}
        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-4 lg:ml-4 space-y-1 mb-10 lg:mb-0">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* মোবাইলে ইমেজ ফুল ওয়াইড সেন্টার */}
            <div className="bg-white shadow-sm mt-2 flex justify-center">
              <img src={data.cover_image} alt={data.title} className="w-full max-w-sm lg:max-w-full h-auto object-cover" />
            </div>

            <div className="bg-white font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-3 text-red-900 uppercase tracking-wide">পুস্তক বিবরণী</h3>
              <div className="text-sm space-y-2 text-gray-800">
                
                {/* বইয়ের নাম */}
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">বই</span>
                  <span className="text-gray-400">:</span>
                  <span>{data.title}</span>
                </div>

                {/* লেখক */}
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">লেখক</span>
                  <span className="text-gray-400">:</span>
                  <span>{data.author}</span>
                </div>

                {/* প্রথম প্রকাশ */}
                {data.first_published && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">প্রকাশ</span>
                    <span className="text-gray-400">:</span>
                    <span>{toBengaliNumber(data.first_published)}</span>
                  </div>
                )}

                {/* ঘরানা/জনরা উইথ লিংক */}
                {data.genre && data.genre.length > 0 && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">ঘরানা</span>
                    <span className="text-gray-400">:</span>
                    <div className="flex flex-wrap gap-1">
                      {data.genre.map((g: string, index: number) => {
                        // genre_links থেকে ম্যাচিং লিংক খুঁজে বের করা
                        const genreLink = data.genre_links?.find((l: any) => l.name === g);
                        return (
                          <span key={g}>
                            <Link 
                              href={genreLink ? genreLink.link : `/genre/${g.toLowerCase()}`} 
                              className="text-blue-600 hover:text-red-900 hover:underline transition-all"
                            >
                              {g}
                            </Link>
                            {index < data.genre.length - 1 && <span className="ml-1 text-gray-400">,</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
              </div>
            </div>

            <div className="bg-white max-h-[400px] overflow-y-auto font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-4 text-red-900">সূচিপত্র</h3>
              {volumes.length > 0 ? (
                volumes.map((v) => (
                  <div key={v.id} className="mb-1">
                    <Link 
                      href={`/book/${slug}/${v.id}`}
                      className="font-normal text-blue-600 hover:text-red-900 mb-0 bg-gray-50 px-0 py-0 text-[15px] tracking-wider block hover:border-gray-200"
                    >
                      {v.title}
                    </Link>
                  </div>
                ))
              ) : (
                <ul className="pl-3 border-l-2 border-gray-100 space-y-1">
                  {directChapters.map(c => (
                    <li key={c.slug}>
                      <Link href={`/book/${slug}/${c.slug}`} className="text-[15px] text-blue-600 hover:text-red-900 block py-1 transition-colors">
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}