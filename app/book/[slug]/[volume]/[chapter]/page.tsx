import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import Link from 'next/link';
import { Home, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Metadata } from 'next';
import Notice from '../../../../components/Notice'; 
import TableOfContents from '../../../../components/TableOfContents';

type Props = {
  params: Promise<{ slug: string, volume: string, chapter: string }>;
  searchParams: Promise<{ page?: string }>;
};

const toBengaliNumber = (num: number) => 
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

export async function generateMetadata({ params }: { params: Props['params'] }): Promise<Metadata> {
  const { slug, volume, chapter } = await params;
  const rootDir = process.cwd();
  
  const bookIndexFile = path.join(rootDir, 'content', slug, 'index.md');
  const volIndexFile = path.join(rootDir, 'content', slug, volume, `${volume}.md`);
  const chapterFile = path.join(rootDir, 'content', slug, volume, 'chapters', `${chapter}.md`);

  if (!fs.existsSync(chapterFile)) return { title: 'অধ্যায় পাওয়া যায়নি' };

  const bookData = matter(fs.readFileSync(bookIndexFile, 'utf8')).data;
  const chapData = matter(fs.readFileSync(chapterFile, 'utf8')).data;
  
  let volTitle = volume.toUpperCase();
  if (fs.existsSync(volIndexFile)) {
    volTitle = matter(fs.readFileSync(volIndexFile, 'utf8')).data.title || volTitle;
  }

  const fullTitle = chapData.meta_title || `${chapData.title || chapter} | ${volTitle} | ${bookData.title}`;
  const description = chapData.meta_description || `${bookData.title} গ্রন্থের ${volTitle}-এর অন্তর্গত ${chapData.title || chapter}।`;
  const shareImage = bookData.og_image || bookData.cover_image || '/og-default.jpg';

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: fullTitle,
      description: description,
      url: `https://bankim.eduliture.org/book/${slug}/${volume}/${chapter}`,
      images: [{ url: shareImage }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description,
      images: [shareImage],
    },
  };
}

export default async function ChapterPage({ params, searchParams }: Props) {
  const { slug, volume, chapter } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1');
  
  const rootDir = process.cwd();
  const bookDir = path.join(rootDir, 'content', slug);
  const volPath = path.join(bookDir, volume);
  const chaptersDir = path.join(volPath, 'chapters');
  const chapterFile = path.join(chaptersDir, `${chapter}.md`);
  const bookIndexFile = path.join(bookDir, 'index.md');
  const volIndexFile = path.join(volPath, `${volume}.md`);

  if (!fs.existsSync(chapterFile)) {
    return (
      <div className="text-center py-20 font-sans">
        <h2 className="text-xl text-red-600 font-bold">অধ্যায়টি পাওয়া যায়নি।</h2>
        <Link href={`/book/${slug}/${volume}`} className="text-blue-500 underline mt-4 block">ফিরে যান</Link>
      </div>
    );
  }

  const bookData = matter(fs.readFileSync(bookIndexFile, 'utf8')).data;
  const { data: chapData, content } = matter(fs.readFileSync(chapterFile, 'utf8'));

  // Pagination Logic using <!--nextpage-->
  const pages = content.split('<!--nextpage-->');
  const totalPages = pages.length;
  const activeContent = pages[currentPage - 1] || pages[0];

  let activeNotice = chapData.notice || null;
  let currentVolTitle = volume.toUpperCase();

  if (fs.existsSync(volIndexFile)) {
    const volFileData = matter(fs.readFileSync(volIndexFile, 'utf8')).data;
    currentVolTitle = volFileData.title || currentVolTitle;
  }

  const allVolumes = fs.readdirSync(bookDir).filter(f => fs.statSync(path.join(bookDir, f)).isDirectory()).sort();
  const currentVolIndex = allVolumes.indexOf(volume);
  const currentVolChapters = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md')).sort();
  const currentChapterIndex = currentVolChapters.indexOf(`${chapter}.md`);

  // Chapter Navigation Logic
  let prevLink = null;
  if (currentPage > 1) {
    prevLink = { href: `/book/${slug}/${volume}/${chapter}?page=${currentPage - 1}`, title: `পূর্ববর্তী পৃষ্ঠা (${toBengaliNumber(currentPage - 1)})` };
  } else if (currentChapterIndex > 0) {
    const prevChapSlug = currentVolChapters[currentChapterIndex - 1].replace('.md', '');
    const prevChapData = matter(fs.readFileSync(path.join(chaptersDir, `${prevChapSlug}.md`), 'utf8')).data;
    prevLink = { href: `/book/${slug}/${volume}/${prevChapSlug}`, title: prevChapData.title || prevChapSlug };
  } else {
    prevLink = { href: `/book/${slug}/${volume}`, title: currentVolTitle };
  }

  let nextLink = null;
  if (currentPage < totalPages) {
    nextLink = { href: `/book/${slug}/${volume}/${chapter}?page=${currentPage + 1}`, title: `পরবর্তী পৃষ্ঠা (${toBengaliNumber(currentPage + 1)})` };
  } else if (currentChapterIndex < currentVolChapters.length - 1) {
    const nextChapSlug = currentVolChapters[currentChapterIndex + 1].replace('.md', '');
    const nextChapData = matter(fs.readFileSync(path.join(chaptersDir, `${nextChapSlug}.md`), 'utf8')).data;
    nextLink = { href: `/book/${slug}/${volume}/${nextChapSlug}`, title: nextChapData.title || nextChapSlug };
  } else if (currentVolIndex < allVolumes.length - 1) {
    const nextVolId = allVolumes[currentVolIndex + 1];
    let nextVolTitle = nextVolId.toUpperCase();
    const nextVolMeta = path.join(bookDir, nextVolId, `${nextVolId}.md`);
    if (fs.existsSync(nextVolMeta)) {
      nextVolTitle = matter(fs.readFileSync(nextVolMeta, 'utf8')).data.title || nextVolTitle;
    }
    nextLink = { href: `/book/${slug}/${nextVolId}`, title: nextVolTitle };
  } else {
    nextLink = { href: "/books", title: "গ্রন্থাগার" };
  }

  const footnotes: string[] = [];
  const processedMarkdown = activeContent.replace(/\[note\]([\s\S]*?)\[\/note\]/g, (_: string, noteText: string) => {
    footnotes.push(noteText.trim());
    return `<sup class="footnote-ref"><a href="#fn-${footnotes.length}" id="fnref-${footnotes.length}" class="text-[#7D3C98] font-bold px-0.5">[${toBengaliNumber(footnotes.length)}]</a></sup>`;
  });

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(processedMarkdown);

  const nestedStructure = {
    bookTitle: bookData.title,
    currentVolume: volume,
    items: allVolumes.map(v => {
      const vPath = path.join(bookDir, v);
      const cDir = path.join(vPath, 'chapters');
      let title = v.toUpperCase();
      const vMeta = path.join(vPath, `${v}.md`);
      if (fs.existsSync(vMeta)) title = matter(fs.readFileSync(vMeta, 'utf8')).data.title || title;
      const chaps = fs.existsSync(cDir) ? fs.readdirSync(cDir).filter(f => f.endsWith('.md')).sort().map(f => {
        const cData = matter(fs.readFileSync(path.join(cDir, f), 'utf8')).data;
        return { slug: f.replace('.md', ''), title: cData.title || f.replace('.md', '') };
      }) : [];
      return { type: 'volume', id: v, title, chapters: chaps };
    })
  };

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/book/${slug}`} className="hover:text-red-100 shrink-0">{bookData.title}</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/book/${slug}/${volume}`} className="hover:text-red-100 shrink-0">{currentVolTitle}</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="font-medium shrink-0">{chapData.title || chapter} {totalPages > 1 && `(পৃষ্ঠা ${toBengaliNumber(currentPage)})`}</span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-2 md:p-2 shadow-sm min-h-screen">
          <header className="mb-2 text-center font-tarunima">
            <h2 className="text-xl md:text-2xl text-red-900 mb-1">{bookData.title}</h2>
            <p className="text-xl md:text-md text-gray-500 uppercase tracking-wide mb-1">{currentVolTitle}</p>
            <h1 className="text-xl md:text-2xl font-normal font-sabrina text-gray-900 leading-tight">
              {chapData.title || chapter} {chapData.subtitle ? `: ${chapData.subtitle}` : ''}
              {totalPages > 1 && <span className="block text-sm text-gray-500 mt-1 italic">পৃষ্ঠা: {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}</span>}
            </h1>
            <div className="w-40 h-[2px] bg-red-900 mx-auto mt-2"></div>
          </header>
          
          {activeNotice && <Notice message={activeNotice} />}
          
          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed font-tarunima mt-6">
            <div dangerouslySetInnerHTML={{ __html: processedContent.toString() }} />

            {/* Page Number Indicator for Internal Pages */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8 mb-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/book/${slug}/${volume}/${chapter}?page=${p}`}
                    className={`px-3 py-1 border rounded ${currentPage === p ? 'bg-red-900 text-white' : 'bg-white text-red-900 hover:bg-orange-50'}`}
                  >
                    {toBengaliNumber(p)}
                  </Link>
                ))}
              </div>
            )}

            {footnotes.length > 0 && (
              <div className="mt-2 pt-2 border-t-2 border-orange-200">
                <h4 className="text-lg font-bold text-red-900 mb-1">টিকা ও মন্তব্য</h4>
                <ol className="bnlist flex flex-wrap gap-x-2 gap-y-2 list-outside ml-6 p-0 text-base text-gray-700 [list-style-type:bengali]">
                  {footnotes.map((note, i) => (
                    <li key={i} id={`fn-${i + 1}`} className="flex-auto min-w-[250px] border-b border-white text-justify">
                        <span className="inline">
                           {/* HTML কাজ করার জন্য নিচের পরিবর্তনটি করা হয়েছে */}
                        <span dangerouslySetInnerHTML={{ __html: note }} />
                        <a href={`#fnref-${i + 1}`} className="ml-1 text-blue-500 hover:text-red-700 transition-all">↑</a>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-orange-200 grid grid-cols-2 gap-1">
              <div>
                {prevLink && (
                  <Link href={prevLink.href} className="group flex items-center gap-2 p-3 rounded hover:bg-white transition-all border border-transparent hover:border-orange-100">
                    <ChevronLeft size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                    <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">{prevLink.title}</span>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {nextLink && (
                  <Link href={nextLink.href} className="group flex items-center justify-end gap-2 p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-orange-100">
                    <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">{nextLink.title}</span>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          </article>
        </section>

        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-2 lg:ml-1 space-y-1">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white shadow-sm mt-1 p-1">
              <img src={bookData.cover_image} alt={bookData.title} className="w-full h-auto object-cover" />
            </div>
            <div className="bg-white font-tarunima p-4 shadow-sm min-h-[400px]">
              <h3 className="text-md font-bold border-b pb-2 mb-2 text-red-900 flex items-center gap-2">
                <List size={18} /> সূচিপত্র
              </h3>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                <TableOfContents structure={nestedStructure} currentChapter={chapter} slug={slug} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}