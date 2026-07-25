import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { Home, BookOpen, ChevronRight, ChevronLeft, Folder } from 'lucide-react';
import Notice from '@/app/components/Notice';
import BookCover from '@/app/components/BookCover';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string; volume: string }>;
};

interface BookNode {
  type: 'volume' | 'chapter';
  href: string;
  title: string;
  volId: string;
  chapterSlug?: string;
  filePath: string;
}

// 🛠️ ১. ফাইল সিস্টেম থেকে পুরো বইয়ের স্ট্রাকচার রিডার ফাংশন
function buildBookHierarchy(slug: string): { nodes: BookNode[]; bookTitle: string; coverImage: string } {
  const bookDir = path.join(process.cwd(), 'content', 'books', slug);
  const nodes: BookNode[] = [];

  let bookTitle = slug;
  let coverImage = '/default-cover.jpg';

  if (!fs.existsSync(bookDir)) {
    return { nodes, bookTitle, coverImage };
  }

  // মেইন বইয়ের মেটাডেটা চেক
  const mainFiles = fs.readdirSync(bookDir).filter(f => f.endsWith('.md'));
  if (mainFiles.length > 0) {
    const mainMeta = matter(fs.readFileSync(path.join(bookDir, mainFiles[0]), 'utf8')).data;
    bookTitle = mainMeta.title || bookTitle;
    coverImage = mainMeta.cover_image || coverImage;
  }

  // সাবফোল্ডার (Volumes) স্ক্যান
  const volumes = fs.readdirSync(bookDir)
    .filter(file => fs.statSync(path.join(bookDir, file)).isDirectory())
    .sort();

  for (const vol of volumes) {
    const volPath = path.join(bookDir, vol);

    // ভলিউমের ডাইরেক্ট মার্কডাউন (যদি থাকে)
    const volMdFiles = fs.readdirSync(volPath)
      .filter(f => f.endsWith('.md') && fs.statSync(path.join(volPath, f)).isFile())
      .sort();

    let volTitle = vol.toUpperCase();
    let volFilePath = '';

    if (volMdFiles.length > 0) {
      volFilePath = path.join(volPath, volMdFiles[0]);
      const { data } = matter(fs.readFileSync(volFilePath, 'utf8'));
      volTitle = data.title || volTitle;
    }

    // ভলিউম নোড যুক্ত করুন
    nodes.push({
      type: 'volume',
      href: `/book/${slug}/${vol}`,
      title: volTitle,
      volId: vol,
      filePath: volFilePath,
    });

    // ভলিউমের ভিতরের চ্যাপ্টার চেক (যদি 'chapters' ফোল্ডার থাকে বা ডাইরেক্ট চ্যাপ্টার ফাইল থাকে)
    const chaptersDir = path.join(volPath, 'chapters');
    const targetDir = fs.existsSync(chaptersDir) ? chaptersDir : volPath;

    if (fs.existsSync(targetDir)) {
      const chapterFiles = fs.readdirSync(targetDir)
        .filter(f => f.endsWith('.md') && f !== (volMdFiles[0] || ''))
        .sort();

      for (const chapFile of chapterFiles) {
        const chapFilePath = path.join(targetDir, chapFile);
        const { data } = matter(fs.readFileSync(chapFilePath, 'utf8'));
        const chapSlug = chapFile.replace('.md', '');

        nodes.push({
          type: 'chapter',
          href: `/book/${slug}/${vol}/${chapSlug}`,
          title: data.title || `পরিচ্ছেদ ${chapSlug.replace('c', '')}`,
          volId: vol,
          chapterSlug: chapSlug,
          filePath: chapFilePath,
        });
      }
    }
  }

  return { nodes, bookTitle, coverImage };
}

// 🛠️ ২. ডাইনামিক মেটাডেটা জেনারেশন
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);
  const volume = decodeURIComponent(resolvedParams.volume);

  const { nodes, bookTitle } = buildBookHierarchy(slug);
  const currentVolNode = nodes.find(n => n.volId === volume && n.type === 'volume');

  if (!currentVolNode) {
    return { title: 'ভলিউম পাওয়া যায়নি' };
  }

  let description = `${bookTitle} - এর ${currentVolNode.title} অংশ।`;
  if (currentVolNode.filePath && fs.existsSync(currentVolNode.filePath)) {
    const { data } = matter(fs.readFileSync(currentVolNode.filePath, 'utf8'));
    if (data.meta_description) description = data.meta_description;
  }

  return {
    title: `${currentVolNode.title} | ${bookTitle}`,
    description,
  };
}

// 🛠️ ৩. মূল পেজ কম্পোনেন্ট
export default async function VolumePage({ params }: Props) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug);
  const volume = decodeURIComponent(resolvedParams.volume);

  const { nodes, bookTitle, coverImage } = buildBookHierarchy(slug);

  // বর্তমান ভলিউম সার্চ
  const currentVolIndex = nodes.findIndex(n => n.volId === volume && n.type === 'volume');

  if (currentVolIndex === -1) {
    notFound();
  }

  const currentNode = nodes[currentVolIndex];

  // কনটেন্ট প্রসেসিং
  let volContentHtml = '';
  let volSubtitle = '';
  let volNotice = '';

  if (currentNode.filePath && fs.existsSync(currentNode.filePath)) {
    const fileContent = fs.readFileSync(currentNode.filePath, 'utf8');
    const { data: volData, content } = matter(fileContent);

    volSubtitle = volData.subtitle || '';
    volNotice = volData.notice || '';

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(content);

    volContentHtml = processedContent.toString();
  }

  // বর্তমান ভলিউমের অধীনে যেসব পরিচ্ছেদ রয়েছে সেগুলো ফিল্টার
  const childChapters = nodes.filter(
    n => n.volId === volume && n.type === 'chapter'
  );

  // সব ভলিউম ফোল্ডারের ফিল্টার করা তালিকা (সাইডবারের জন্য)
  const allVolumes = nodes.filter(n => n.type === 'volume');

  // 🔄 অটোমেটিক নেভিগেশন লজিক (পূর্ববর্তী ও পরবর্তী লিংক)
  const prevNode = currentVolIndex > 0 ? nodes[currentVolIndex - 1] : null;
  const nextNode = currentVolIndex < nodes.length - 1 ? nodes[currentVolIndex + 1] : null;

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* Breadcrumb নেভিগেশন */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="hover:text-red-100 flex items-center gap-1 shrink-0">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">
            গ্রন্থাগার
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/book/${slug}`} className="hover:text-red-100 shrink-0">
            {bookTitle}
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] md:max-w-none">
            {currentNode.title}
          </span>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* বাম সাইডবার */}
        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-2 lg:ml-1 space-y-1">
          <div className="lg:sticky lg:top-6 space-y-1">
            <div className="bg-white shadow-sm mt-2 flex justify-center">
              <BookCover coverImage={coverImage} title={bookTitle} />
            </div>
            <div className="bg-white max-h-[400px] overflow-y-auto font-tarunima p-0">
              {allVolumes.map(v => (
                <Link
                  key={v.volId}
                  href={v.href}
                  className={`font-xl mb-1 px-1 py-1 block transition-all border-l-2 ${
                    v.volId === volume
                      ? 'bg-red-50 border-red-900 text-red-900 font-bold'
                      : 'bg-[#e0e0eb] border-transparent text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Folder size={16} /> {v.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* প্রধান কনটেন্ট সেকশন */}
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-2 md:p-3 shadow-sm min-h-screen">
          <header className="mb-2 text-center font-tarunima">
            <p className="text-xl md:text-xl text-red-900 uppercase tracking-widest mb-1 opacity-90">
              {bookTitle}
            </p>
            <h1 className="text-xl md:text-xl font-normal font-sabrina text-gray-900 mb-2">
              {currentNode.title}
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

          {/* সূচিপত্র (পরিচ্ছেদসমূহ) */}
          {childChapters.length > 0 && (
            <div className="mt-1">
              <h2 className="text-xl font-bold text-red-900 font-tarunima mb-2 flex items-center gap-2 border-b border-red-100 pb-2">
                <BookOpen size={22} /> সূচিপত্র
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {childChapters.map(chap => (
                  <Link
                    key={chap.href}
                    href={chap.href}
                    className="group bg-white p-2 border border-gray-100 shadow-sm flex items-center justify-between hover:border-red-300 transition-all rounded-sm"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-red-400 group-hover:text-red-600 transition-colors text-xl shrink-0">
                        ❀
                      </span>
                      <span className="text-md md:text-lg font-normal text-gray-800 group-hover:text-red-900 font-tarunima transition-colors">
                        {chap.title}
                      </span>
                    </div>
                    <ChevronRight
                      className="text-gray-300 group-hover:text-red-900 transition-colors shrink-0"
                      size={18}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* অটোমেটিক নেভিগেশন ফুটার */}
          <div className="mt-2 pt-2 border-t border-orange-200 grid grid-cols-2 gap-1 font-tarunima">
            <div>
              {prevNode ? (
                <Link
                  href={prevNode.href}
                  className="group flex items-center gap-1 p-2 rounded hover:bg-white transition-all border border-transparent hover:border-orange-100"
                >
                  <ChevronLeft size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {prevNode.title}
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/book/${slug}`}
                  className="group flex items-center gap-1 p-2 rounded hover:bg-white transition-all border border-transparent hover:border-orange-100"
                >
                  <ChevronLeft size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {bookTitle} (সূচি)
                  </span>
                </Link>
              )}
            </div>

            <div className="text-right">
              {nextNode ? (
                <Link
                  href={nextNode.href}
                  className="group flex items-center justify-end gap-1 p-2 rounded hover:bg-white transition-all border border-transparent hover:border-orange-100"
                >
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    {nextNode.title}
                  </span>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-red-900 shrink-0" />
                </Link>
              ) : (
                <Link
                  href="/books"
                  className="group flex items-center justify-end gap-2 p-2 rounded hover:bg-white transition-all border border-transparent hover:border-orange-100"
                >
                  <span className="text-sm md:text-base font-bold text-blue-600 group-hover:text-red-900 line-clamp-1">
                    গ্রন্থাগার
                  </span>
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