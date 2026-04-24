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
import Notice from '../../components/Notice';
import { Metadata } from 'next';

// ১. ডাইনামিক মেটাডেটা এবং ওজি ইমেজ লজিক
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { slug } = await params;
  const bookDir = path.join(process.cwd(), 'content', slug);
  const filePath = path.join(bookDir, 'index.md');

  if (!fs.existsSync(filePath)) return { title: "বই পাওয়া যায়নি" };

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContent);

  // আপনার রিকোয়ারমেন্ট অনুযায়ী টাইটেল: বইয়ের নাম | সাইট নেম
  const title = `${data.title} | বঙ্কিম রচনাবলী`;
  const description = data.meta_description || `${data.title} - বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের একটি অমূল্য সৃষ্টি।`;
  
  // ওজি ইমেজ ১৬:৯ রেশিও (শেয়ারিং এর জন্য)
  const shareImage = data.og_image || '/og-default.jpg'; 

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://bankim.eduliture.org/book/${slug}`,
      siteName: 'বঙ্কিম রচনাবলী',
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
      locale: 'bn_BD',
      type: 'book',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [shareImage],
    },
  };
}

const toBengaliNumber = (num: number | string) => 
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

// ২. মূল পেজ কম্পোনেন্ট (ডিজাইন অপরিবর্তিত)
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

  // ভলিউম ডিটেকশন
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

  // চ্যাপ্টার ডিটেকশন
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

  // নেক্সট বাটন লজিক
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
        <div className="max-w-[1440px] mx-auto text-sm text-white font-tarunima flex flex-wrap items-center gap-y-1">
          <Link href="/" className="hover:text-red-100 flex items-center gap-1 shrink-0">
            <Home size={16} />
          </Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0 whitespace-nowrap">গ্রন্থাগার</Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="text-white font-medium whitespace-nowrap">{data.title}</span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto px-0 py-0 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-2 md:p-3 shadow-sm min-h-screen">
          <header className="mb-2 text-center font-tarunima">
            <h1 className="text-2xl md:text-2xl font-bold font-sabrina text-gray-900 mb-2">{data.title}</h1>
            <p className="text-lg text-red-900 font-tarunima">{data.author}</p>
            <div className="w-50 h-[2px] bg-red-900 mx-auto mt-2"></div>
          </header>

          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed font-tarunima">
            {data.notice && <Notice message={data.notice} />}
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </article>

          <div className="mt-1 pt-2 border-t border-orange-200 flex justify-between items-center font-tarunima">
            <Link href="/books" className="text-gray-500 hover:text-red-900 flex items-center group transition-all text-sm md:text-base whitespace-nowrap">
              <span className="mr-2 transform group-hover:-translate-x-1">←</span> গ্রন্থাগার
            </Link>
            
            <Link 
              href={nextActionLink} 
              className="bg-red-900 text-white px-5 py-3 rounded font-bold hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base max-w-[60%]"
            >
              <span className="truncate whitespace-nowrap">{nextActionLabel}</span>
              <span className="ml-2 transform group-hover:translate-x-1 transition-transform shrink-0">→</span>
            </Link>
          </div>
        </section>

        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-4 lg:ml-4 space-y-1 mb-10 lg:mb-0">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white shadow-sm mt-2 flex justify-center border border-gray-100">
              {/* কভার ইমেজ (২:৩) যা কেবল সাইটে শো করবে */}
              <img src={data.cover_image} alt={data.title} className="w-full max-w-sm lg:max-w-full h-auto object-cover" />
            </div>

            <div className="bg-white font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-3 text-red-900 uppercase tracking-wide">পুস্তক বিবরণী</h3>
              <div className="text-sm space-y-2 text-gray-800">
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">বই</span>
                  <span className="text-gray-400">:</span>
                  <span>{data.title}</span>
                </div>
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">লেখক</span>
                  <span className="text-gray-400">:</span>
                  <span>{data.author}</span>
                </div>
                {/* অন্যান্য ডিটেইলস ... */}
                {data.pub_medium && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">প্রথম প্রকাশ</span>
                    <span className="text-gray-400">:</span>
                    <span>{data.pub_medium}</span>
                  </div>
                )}
                {data.first_published && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">গ্রন্থরূপ</span>
                    <span className="text-gray-400">:</span>
                    <span>{toBengaliNumber(data.first_published)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white max-h-[400px] overflow-y-auto font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-4 text-red-900">সূচিপত্র</h3>
              {volumes.length > 0 ? (
                volumes.map((v) => (
                  <div key={v.id} className="mb-1">
                    <Link href={`/book/${slug}/${v.id}`} className="text-blue-600 hover:text-red-900 text-[15px] block py-1">
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