import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { Home, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import Notice from '../../../components/Notice'; 
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string; volume: string }>;
};

// ১. ডাইনামিক মেটাডেটা জেনারেশন (meta_title লজিক সহ)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, volume } = await params;
  const bookDir = path.join(process.cwd(), 'content', slug);
  const volPath = path.join(bookDir, volume);
  const volMainFile = path.join(volPath, `${volume}.md`);
  const bookIndexFile = path.join(bookDir, 'index.md');

  // মূল বইয়ের ডেটা রিড
  const bookIndexContent = fs.readFileSync(bookIndexFile, 'utf8');
  const { data: bookData } = matter(bookIndexContent);

  // খণ্ডের ডেটা রিড
  let volTitle = volume.toUpperCase();
  let volDescription = "";
  let customMetaTitle = "";

  if (fs.existsSync(volMainFile)) {
    const { data: volData } = matter(fs.readFileSync(volMainFile, 'utf8'));
    volTitle = volData.title || volTitle;
    volDescription = volData.meta_description || "";
    customMetaTitle = volData.meta_title || ""; // meta_title চেক করা হচ্ছে
  }

  // লজিক: meta_title থাকলে তাই, নাহলে "খণ্ড নাম | বইয়ের নাম | বঙ্কিম রচনাবলী"
  const fullTitle = customMetaTitle || `${volTitle} | ${bookData.title}`;
  const shareImage = bookData.og_image || bookData.cover_image || '/og-default.jpg';

  return {
    title: fullTitle,
    description: volDescription || `${bookData.title} - এর ${volTitle} অংশ।`,
    openGraph: {
      title: fullTitle,
      images: [{ url: shareImage }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      images: [shareImage],
    },
  };
}

const toBengaliNumber = (num: number | string) => 
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

// ২. মূল পেজ কম্পোনেন্ট
export default async function VolumePage({ params }: Props) {
  const { slug, volume } = await params;
  
  const bookDir = path.join(process.cwd(), 'content', slug);
  const volPath = path.join(bookDir, volume);
  const bookIndexFile = path.join(bookDir, 'index.md');

  if (!fs.existsSync(volPath)) {
    return <div className="text-center py-20 font-tarunima">খণ্ডটি পাওয়া যায়নি।</div>;
  }

  const bookIndexContent = fs.readFileSync(bookIndexFile, 'utf8');
  const { data: bookData } = matter(bookIndexContent);

  const volMainFile = path.join(volPath, `${volume}.md`);
  let volContentHtml = "";
  let volTitle = volume.toUpperCase();
  let volSubtitle = ""; 
  let volNotice = ""; 
  
  if (fs.existsSync(volMainFile)) {
    const fileContent = fs.readFileSync(volMainFile, 'utf8');
    const { data: volData, content } = matter(fileContent);
    volTitle = volData.title || volTitle;
    volSubtitle = volData.subtitle || ""; 
    volNotice = volData.notice || "";

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(content);
    volContentHtml = processedContent.toString();
  }

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

  const volumeFolders = fs.readdirSync(bookDir)
    .filter(file => fs.statSync(path.join(bookDir, file)).isDirectory())
    .sort();

  const volumesWithTitles = volumeFolders.map(v => {
    const volMetaFile = path.join(bookDir, v, `${v}.md`);
    let title = v.toUpperCase();
    if (fs.existsSync(volMetaFile)) {
      const { data: vMeta } = matter(fs.readFileSync(volMetaFile, 'utf8'));
      title = vMeta.title || title;
    }
    return { id: v, title };
  });

  const currentVolIndex = volumesWithTitles.findIndex(v => v.id === volume);
  const prevVol = currentVolIndex > 0 ? volumesWithTitles[currentVolIndex - 1] : null;
  const nextVol = currentVolIndex < volumesWithTitles.length - 1 ? volumesWithTitles[currentVolIndex + 1] : null;

  const firstChapter = chapters.length > 0 ? chapters[0] : null;

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-2 text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="hover:text-red-100 flex items-center gap-1 shrink-0"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/book/${slug}`} className="hover:text-red-100 shrink-0">{bookData.title}</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] md:max-w-none">{volTitle}</span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-2 grid grid-cols-1 lg:grid-cols-12 gap-0">
        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-2 lg:ml-2 space-y-1 mb-1 lg:mb-1">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white shadow-sm mt-2 flex justify-center">
              <img src={bookData.cover_image} alt={bookData.title} className="w-full max-w-sm lg:max-w-full h-auto object-contain" />
            </div>
            <div className="bg-white max-h-[400px] overflow-y-auto font-tarunima p-0">
              <h3 className="text-md font-bold border-b pb-2 mb-2 border-red-100 text-red-900">সূচিপত্র</h3>
              {volumesWithTitles.map((v) => (
                <Link 
                  key={v.id}
                  href={`/book/${slug}/${v.id}`}
                  className={`font-xl mb-1 px-1 py-1 block transition-all border-l-2 ${v.id === volume ? 'bg-red-50 border-red-900 text-red-900 font-bold' : 'bg-[#e0e0eb] border-transparent text-blue-600 hover:bg-gray-50'}`}
                >
                  {v.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-2 md:p-3 shadow-sm min-h-screen">
          <header className="mb-2 text-center font-tarunima">
            <p className="text-xl md:text-xl text-red-900 uppercase tracking-widest mb-1 opacity-90">
              {bookData.title}
            </p>
            <h1 className="text-2xl md:text-2xl font-bold font-sabrina text-gray-900 mb-2">
              {volTitle}
              {volSubtitle && ` : ${volSubtitle}`}
            </h1>
            <div className="w-50 h-[2px] bg-red-900 mx-auto mt-2"></div>
          </header>

          {volNotice && <Notice message={volNotice} />}

          {volContentHtml && (
            <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed font-tarunima mb-10">
              <div dangerouslySetInnerHTML={{ __html: volContentHtml }} />
            </article>
          )}

          <div className="mt-1">
            <h2 className="text-xl font-bold text-red-900 font-tarunima mb-2 flex items-center gap-2 border-b border-red-100 pb-2">
              <BookOpen size={22} /> সূচিপত্র
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {chapters.map((chap) => (
                <Link 
                  key={chap.slug}
                  href={`/book/${slug}/${volume}/${chap.slug}`}
                  className="group bg-white p-2 border border-gray-100 shadow-sm flex items-center justify-between hover:border-red-300 transition-all rounded-sm"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-red-400 group-hover:text-red-600 transition-colors text-xl shrink-0">❀</span>
                    <span className="text-md md:text-lg font-normal text-gray-800 group-hover:text-red-900 font-tarunima transition-colors">
                      {chap.title}
                    </span>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-red-900 transition-colors shrink-0" size={18} />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-orange-200 grid grid-cols-2 gap-4 font-tarunima">
            <div>
              {prevVol ? (
                <Link href={`/book/${slug}/${prevVol.id}`} className="group flex items-center gap-2 p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-orange-100">
                  <ChevronLeft size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {prevVol.title}
                  </span>
                </Link>
              ) : (
                <Link href={`/book/${slug}`} className="group flex items-center gap-2 p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-orange-100">
                  <ChevronLeft size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {bookData.title}
                  </span>
                </Link>
              )}
            </div>

            <div className="text-right">
              {firstChapter ? (
                <Link href={`/book/${slug}/${volume}/${firstChapter.slug}`} className="group flex items-center justify-end gap-2 p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-orange-100">
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {firstChapter.title}
                  </span>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                </Link>
              ) : nextVol ? (
                <Link href={`/book/${slug}/${nextVol.id}`} className="group flex items-center justify-end gap-2 p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-orange-100">
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {nextVol.title}
                  </span>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                </Link>
              ) : (
                <Link href="/books" className="group flex items-center justify-end gap-2 p-2 rounded-lg hover:bg-white transition-all border border-transparent hover:border-orange-100">
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">গ্রন্থাগার</span>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}