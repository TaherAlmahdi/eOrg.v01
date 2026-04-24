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
import TableOfContents from '../../../../components/TableOfContents';

type Props = {
  params: Promise<{ slug: string, volume: string, chapter: string }>;
};

const toBengaliNumber = (num: number) => 
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, volume, chapter } = await params;
  const chapterFile = path.join(process.cwd(), 'content', slug, volume, 'chapters', `${chapter}.md`);
  if (!fs.existsSync(chapterFile)) return { title: 'অধ্যায় পাওয়া হয়নি' };
  const fileContent = fs.readFileSync(chapterFile, 'utf8');
  const { data: chapData } = matter(fileContent);
  const bookIndexFile = path.join(process.cwd(), 'content', slug, 'index.md');
  const bookData = matter(fs.readFileSync(bookIndexFile, 'utf8')).data;
  return { title: `${chapData.title || chapter} | ${bookData.title || slug}` };
}

export default async function ChapterPage({ params }: Props) {
  const { slug, volume, chapter } = await params;
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

  // ১. বর্তমান খণ্ডের টাইটেল বের করা
  let currentVolTitle = volume.toUpperCase();
  if (fs.existsSync(volIndexFile)) {
    currentVolTitle = matter(fs.readFileSync(volIndexFile, 'utf8')).data.title || currentVolTitle;
  }

  // ২. নেভিগেশন লজিক: বর্তমান খণ্ডের অধ্যায়গুলো এবং পরবর্তী খণ্ড খুঁজে বের করা
  const allVolumes = fs.readdirSync(bookDir).filter(f => fs.statSync(path.join(bookDir, f)).isDirectory()).sort();
  const currentVolIndex = allVolumes.indexOf(volume);
  
  const currentVolChapters = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md')).sort();
  const currentChapterIndex = currentVolChapters.indexOf(`${chapter}.md`);

  // Previous Link লজিক
  let prevLink = null;
  if (currentChapterIndex > 0) {
    // বর্তমান খণ্ডের আগের অধ্যায়
    const prevChapSlug = currentVolChapters[currentChapterIndex - 1].replace('.md', '');
    const prevChapData = matter(fs.readFileSync(path.join(chaptersDir, `${prevChapSlug}.md`), 'utf8')).data;
    prevLink = { href: `/book/${slug}/${volume}/${prevChapSlug}`, title: prevChapData.title || prevChapSlug };
  } else {
    // প্রথম অধ্যায় হলে বর্তমান খণ্ডের মূল পাতায় ফিরে যাবে
    prevLink = { href: `/book/${slug}/${volume}`, title: currentVolTitle };
  }

  // Next Link লজিক
  let nextLink = null;
  if (currentChapterIndex < currentVolChapters.length - 1) {
    // বর্তমান খণ্ডের পরের অধ্যায়
    const nextChapSlug = currentVolChapters[currentChapterIndex + 1].replace('.md', '');
    const nextChapData = matter(fs.readFileSync(path.join(chaptersDir, `${nextChapSlug}.md`), 'utf8')).data;
    nextLink = { href: `/book/${slug}/${volume}/${nextChapSlug}`, title: nextChapData.title || nextChapSlug };
  } else if (currentVolIndex < allVolumes.length - 1) {
    // খণ্ড শেষ হলে পরবর্তী খণ্ডের মূল পাতায় যাবে
    const nextVolId = allVolumes[currentVolIndex + 1];
    let nextVolTitle = nextVolId.toUpperCase();
    const nextVolMeta = path.join(bookDir, nextVolId, `${nextVolId}.md`);
    if (fs.existsSync(nextVolMeta)) {
      nextVolTitle = matter(fs.readFileSync(nextVolMeta, 'utf8')).data.title || nextVolTitle;
    }
    nextLink = { href: `/book/${slug}/${nextVolId}`, title: nextVolTitle };
  } else {
    // বইয়ের একদম শেষ হলে গ্রন্থাগারে যাবে
    nextLink = { href: "/books", title: "গ্রন্থাগার" };
  }

  // ৩. কন্টেন্ট প্রসেসিং
  const footnotes: string[] = [];
  const processedMarkdown = content.replace(/\[note\]([\s\S]*?)\[\/note\]/g, (_: string, noteText: string) => {
    footnotes.push(noteText.trim());
    return `<sup class="footnote-ref"><a href="#fn-${footnotes.length}" id="fnref-${footnotes.length}" class="text-[#7D3C98] font-bold px-0.5">[${toBengaliNumber(footnotes.length)}]</a></sup>`;
  });

  const processedContent = await unified().use(remarkParse).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeStringify).process(processedMarkdown);

  // ৪. সাইডবার স্ট্রাকচার
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
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-3 px-4 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link> 
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/book/${slug}`} className="hover:text-red-100 shrink-0">{bookData.title}</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/book/${slug}/${volume}`} className="hover:text-red-100 shrink-0">{currentVolTitle}</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="font-medium shrink-0">{chapData.title || chapter}</span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-2 md:p-3 shadow-sm min-h-screen">
          <header className="mb-2 text-center font-tarunima">
            <h2 className="text-xl md:text-2xl text-red-900 mb-1">{bookData.title}</h2>
            <p className="text-xl md:text-md text-gray-500 uppercase tracking-wide mb-1">{currentVolTitle}</p>
            <h1 className="text-xl md:text-2xl font-normal font-sabrina text-gray-900 leading-tight">
              {chapData.title || chapter} {chapData.subtitle ? `: ${chapData.subtitle}` : ''}
            </h1>
            <div className="w-50 h-[2px] bg-red-900 mx-auto mt-2"></div>
          </header>

          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed font-tarunima">
            <div dangerouslySetInnerHTML={{ __html: processedContent.toString() }} />

              {footnotes.length > 0 && (
                <div className="mt-4 pt-2 border-t-2 border-orange-200 font-tarunima">
                  <h4 className="text-lg font-bold border-b-[1px] border-orange-200 text-red-900 mb-2">
                    টিকা ও মন্তব্য
                  </h4>
                  <ol className="bnlist flex flex-wrap gap-x-4 gap-y-0 list-outside ml-4 p-0 text-base text-gray-700 [list-style-type:bengali]">
                    {footnotes.map((note, i) => (
                      <li 
                        key={i} 
                        id={`fn-${i + 1}`} 
                        className="flex-auto min-w-[200px] max-w-full border-b-[1px] border-white pb-1 leading-relaxed"
                      >
                        <span className="inline">
                          {note}
                          <a href={`#fnref-${i + 1}`} className="ml-2 text-blue-500 hover:text-red-700 transition-all">↩</a>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

            <div className="mt-2 pt-2 border-t border-orange-200 grid grid-cols-2 gap-4 font-tarunima">
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

        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-4 lg:ml-4 space-y-1">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white shadow-sm mt-4">
              <img src={bookData.cover_image} alt={bookData.title} className="w-full max-w-sm lg:max-w-full h-auto object-cover mx-auto" />
            </div>
            <div className="bg-white font-tarunima pb-10">
              <h3 className="text-md font-bold border-b pb-2 mb-2 text-red-900 flex items-center gap-2 mt-4"><List size={18} /> {bookData.title}</h3>
              <div className="max-h-[500px] overflow-y-auto">
                <TableOfContents structure={nestedStructure} currentChapter={chapter} slug={slug} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}