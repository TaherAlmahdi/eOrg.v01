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

  return {
    title: `${chapData.title || chapter} | ${bookData.title || slug}`,
  };
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
        <p className="text-gray-500 mt-2 text-sm italic">খোঁজা হচ্ছে: {chapterFile}</p>
        <Link href={`/book/${slug}/${volume}`} className="text-blue-500 underline mt-4 block">ফিরে যান</Link>
      </div>
    );
  }

  const bookIndexRaw = fs.readFileSync(bookIndexFile, 'utf8');
  const bookData = matter(bookIndexRaw).data;
  const chapterRaw = fs.readFileSync(chapterFile, 'utf8');
  const { data: chapData, content } = matter(chapterRaw);

  const footnotes: string[] = [];
  const processedMarkdown = content.replace(/\[note\]([\s\S]*?)\[\/note\]/g, (_: string, noteText: string) => {
    footnotes.push(noteText.trim());
    const index = footnotes.length;
    const bnIndex = toBengaliNumber(index);
    return `<sup class="footnote-ref"><a href="#fn-${index}" id="fnref-${index}" class="text-[#7D3C98] font-bold px-0.5">[${bnIndex}]</a></sup>`;
  });

  let volTitle = volume.toUpperCase();
  if (fs.existsSync(volIndexFile)) {
    const volMetaRaw = fs.readFileSync(volIndexFile, 'utf8');
    volTitle = matter(volMetaRaw).data.title || volTitle;
  }

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(processedMarkdown);
  const contentHtml = processedContent.toString();

  const allChapters = fs.readdirSync(chaptersDir).filter(file => file.endsWith('.md')).sort();
  const currentIndex = allChapters.indexOf(`${chapter}.md`);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1].replace('.md', '') : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1].replace('.md', '') : null;

  const allDirs = fs.readdirSync(bookDir).filter(f => fs.lstatSync(path.join(bookDir, f)).isDirectory());
  const nestedStructure = {
    bookTitle: bookData.title,
    currentVolume: volume,
    items: allDirs.map(d => {
      const vPath = path.join(bookDir, d);
      const cDir = path.join(vPath, 'chapters');
      const vIndex = path.join(vPath, `${d}.md`);
      let title = d.toUpperCase();
      if (fs.existsSync(vIndex)) {
        const vMeta = fs.readFileSync(vIndex, 'utf8');
        title = matter(vMeta).data.title || title;
      }
      if (fs.existsSync(cDir)) {
        const chapters = fs.readdirSync(cDir).filter(f => f.endsWith('.md')).sort().map(f => {
          const cRaw = fs.readFileSync(path.join(cDir, f), 'utf8');
          const cData = matter(cRaw).data;
          return { slug: f.replace('.md', ''), title: cData.title || f.replace('.md', '') };
        });
        return { type: 'volume', id: d, title, chapters };
      } else {
        return { type: 'chapter', id: d, title };
      }
    })
  };

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-3 px-4 text-white">
        <div className="max-w-[1440px] mx-auto text-sm font-tarunima flex items-center">
          <Link href="/"><Home size={16} /></Link> 
          <span className="mx-2 text-white/50">/</span>
          <Link href="/books" className="hover:text-red-100">গ্রন্থাগার</Link> 
          <span className="mx-2 text-white/50">/</span>
          <Link href={`/book/${slug}`} className="hover:text-red-100">{bookData.title}</Link>
          <span className="mx-2 text-white/50">/</span>
          <Link href={`/book/${slug}/${volume}`} className="hover:text-red-100">{volTitle}</Link>
          <span className="mx-2 text-white/50">/</span>
          <span className="font-medium truncate">{chapData.title || chapter}</span>
        </div>
      </nav>

      {/* Grid: মোবাইলে কলাম ১টি, বড় স্ক্রিনে ১২টি */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* কন্টেন্ট সেকশন: মোবাইলে order-1 (উপরে), ডেক্সটপে order-2 (ডানে) */}
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-4 md:p-4 shadow-sm min-h-screen">
          <header className="mb-4 text-center font-tarunima">
            <h2 className="text-xl md:text-2xl text-red-900 mb-1">{bookData.title}</h2>
            <p className="text-xl md:text-md text-gray-500 uppercase tracking-wide mb-1">{volTitle}</p>
            <h1 className="text-2xl md:text-2xl font-normal font-sabrina text-gray-900 leading-tight">
              {chapData.title || chapter} {chapData.subtitle ? `: ${chapData.subtitle}` : ''}
            </h1>
          </header>

          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

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

            <div className="mt-8 pt-2 border-t border-orange-300 flex justify-between items-center font-sans">
              {prevChapter ? (
                <Link href={`/book/${slug}/${volume}/${prevChapter}`} className="flex items-center gap-2 text-gray-600 hover:text-red-900 font-medium transition-all">
                  <ChevronLeft size={20} /> পূর্ববর্তী
                </Link>
              ) : <div />}

              <Link href={`/book/${slug}/${volume}`} className="bg-orange-100 text-red-900 px-6 py-2 rounded-full text-xs font-bold hover:bg-orange-200 transition-colors shadow-sm">
                সূচি
              </Link>

              {nextChapter ? (
                <Link href={`/book/${slug}/${volume}/${nextChapter}`} className="flex items-center gap-2 text-gray-600 hover:text-red-900 font-bold transition-all">
                  পরবর্তী <ChevronRight size={20} />
                </Link>
              ) : <span className="text-gray-400 font-tarunima italic">সমাপ্ত</span>}
            </div>
          </article>
        </section>

        {/* সাইডবার সেকশন: মোবাইলে order-2 (নিচে), ডেক্সটপে order-1 (বামে) */}
        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-4 lg:ml-4 space-y-1">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white shadow-sm mt-2 flex justify-center">
              {/* মোবাইলে ইমেজ ফুল ওয়াইড ও সেন্টার করার জন্য w-full এবং mx-auto */}
              <img src={bookData.cover_image} alt={bookData.title} className="w-full max-w-sm lg:max-w-full h-auto object-cover mx-auto" />
            </div>
            <div className="bg-white font-tarunima pr-2">
              <h3 className="text-md font-bold border-b pb-2 mb-2 text-red-900 flex items-center gap-2 mt-4">
                <List size={18} /> {bookData.title}
              </h3>
              <div className="max-h-[500px] overflow-y-auto mb-10 lg:mb-0">
                <TableOfContents structure={nestedStructure} currentChapter={chapter} slug={slug} />
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}