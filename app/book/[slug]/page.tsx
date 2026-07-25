import Link from 'next/link';
import { Home } from "lucide-react";
import Notice from '@/app/components/Notice';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getBookBySlug } from '../../lib/books';
import { notFound } from 'next/navigation';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { parseNoteShortcodes } from '@/app/lib/parse-shortcodes';

interface BookPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface GenreLink {
  name: string;
  link: string;
}

interface Volume {
  id: string;
  title: string;
}

interface Chapter {
  slug: string;
  title: string;
}

const toBengaliNumber = (num?: number | string): string =>
  num ? num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]) : '';

// dynamic metadata Export
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const book = await getBookBySlug(slug, siteData.subdomain || 'library');

  if (!book) return { title: "বই পাওয়া যায়নি" };

  const dynamicMetaTitle = buildTabTitle({
    metaTitle: book.meta_title,
    currentPageTitle: book.chapter_title || book.currentChapterTitle || null,
    volumePageTitle: book.volume_title || book.currentVolumeTitle || null,
    bookTitle: book.title,
    siteName: siteData.title,
  });

  const description = book.meta_description || `${book.title} - একটি অমূল্য সৃষ্টি।`;
  const shareImage = book.og_image || book.cover_image || siteData.ogImage;

  return {
    title: dynamicMetaTitle,
    description,
    openGraph: {
      title: dynamicMetaTitle,
      description,
      url: `https://${siteData.subdomain ? `${siteData.subdomain}.` : ''}eduliture.org/book/${slug}`,
      siteName: siteData.title,
      images: [{ url: shareImage, width: 1200, height: 630, alt: book.title }],
      locale: 'bn_BD',
      type: 'book',
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description,
      images: [shareImage],
    },
  };
}

export default async function LibraryBookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const book = await getBookBySlug(slug, siteData.subdomain || 'library');

  if (!book) notFound();

  const volumes: Volume[] = book.volumes || [];
  const directChapters: Chapter[] = book.directChapters || [];

  let nextActionLink = "/books";
  let nextActionLabel = "গ্রন্থাগার";

  if (volumes.length > 0) {
    nextActionLink = `/book/${slug}/${volumes[0].id}`;
    nextActionLabel = volumes[0].title;
  } else if (directChapters.length > 0) {
    nextActionLink = `/book/${slug}/${directChapters[0].slug}`;
    nextActionLabel = directChapters[0].title;
  }

  // শর্টকোড পার্স করার লজিক
  const { contentHtml, notes } = parseNoteShortcodes(book.content || '');

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="text-white font-medium whitespace-nowrap">{book.title}</span>
        </div>
      </nav>

      <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-2 md:p-3 shadow-sm min-h-screen">
          <header className="mb-2 text-center font-tarunima">
            <h1 className="text-2xl md:text-2xl font-normal font-sabrina text-gray-900 mb-2">{book.title}</h1>
            {book.subtitle && (
              <p className="text-xl md:text-xl text-red-900 uppercase tracking-widest mb-1 opacity-90">
                {book.subtitle}
              </p>
            )}
            <p className="text-lg text-red-900 font-tarunima">{book.author}</p>
            <div className="w-48 h-0.5 bg-red-900 mx-auto mt-2"></div>
          </header>

          <article className="prose lg:prose-xl max-w-none text-gray-900 leading-relaxed font-tarunima">
            {book.notice && <Notice message={book.notice} />}

            {/* মূল বইয়ের কন্টেন্ট রেন্ডার (ইনলাইনভাবে রেন্ডার হবে, লাইন ভাঙবে না) */}
            <div 
              className="space-y-4 markdown-body"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* টিকা ও মন্তব্য সেকশন */}
            {notes && notes.length > 0 && (
              <div className="mt-2 pt-2 border-t-2 border-orange-200">
                <h4 className="text-xl font-bold text-red-900 mb-1 font-tarunima">টিকা ও মন্তব্য</h4>
                <ol className="not-prose flex flex-wrap gap-x-4 gap-y-0 list-outside text-[0.7rem] md:text-[0.8rem] lg:text-[0.9rem] text-gray-700 ml-0">
                  {notes.map((note) => (
                    <li 
                      key={note.id} 
                      id={`fn-${note.id}`} 
                      className="flex-auto min-w-62.5 mb-0 border-t border-white text-justify">
                      <span className="text-gray-700 leading-normal text-[0.8rem] md:text-[0.9rem] lg:text-[1.0rem]">      
                        <span className="font-normal text-blue-600 font-tarunima">{note.label}. </span>
                        <a 
                          href={`#fnref-${note.id}`} 
                          className="mb-2 text-blue-500 hover:text-red-700 transition-all font-tarunima"
                          title="উপরে ফিরে যান">↑ </a>                        

                        {/* নিশ্চিত করুন এখানে note.text রেন্ডার করা হচ্ছে, পুরো note অবজেক্ট নয় */}
                        {typeof note.text === 'string' ? note.text : JSON.stringify(note.text)}

                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          </article>

          <div className="mt-6 pt-3 border-t border-orange-200 flex justify-between items-center font-tarunima">
            <Link href="/books" className="text-gray-600 hover:text-red-900 flex items-center group transition-all text-sm md:text-base whitespace-nowrap">
              <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span> গ্রন্থাগার
            </Link>

            <Link
              href={nextActionLink}
              className="bg-red-900 text-white px-3 py-1.5 rounded font-normal hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base max-w-[60%]"
            >
              <span className="truncate whitespace-nowrap">{nextActionLabel}</span>
              <span className="ml-2 transform group-hover:translate-x-1 transition-transform shrink-0">→</span>
            </Link>
          </div>
        </section>

        {/* সাইডবার */}
        <aside className="order-2 lg:order-1 col-span-1 lg:col-span-3 px-2 lg:ml-1 space-y-2">
          <div className="lg:sticky lg:top-6 space-y-3">
            {book.cover_image && (
              <div className="bg-white shadow-sm mt-2 flex justify-center">
                <img src={book.cover_image} alt={book.title} className="w-full max-w-sm lg:max-w-full h-auto object-cover" />
              </div>
            )}

            <div className="bg-white p-3 shadow-sm font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-3 text-red-900 uppercase tracking-wide">পুস্তক বিবরণী</h3>
              <div className="text-sm space-y-2 text-gray-800">
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">বই</span>
                  <span className="text-gray-400">:</span>
                  <span>{book.title}</span>
                </div>
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">লেখক</span>
                  <span className="text-gray-400">:</span>
                  <span>{book.author}</span>
                </div>
                {book.pub_medium && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">প্রথম প্রকাশ</span>
                    <span className="text-gray-400">:</span>
                    <span>{book.pub_medium}</span>
                  </div>
                )}
                {book.first_published && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">গ্রন্থরূপ</span>
                    <span className="text-gray-400">:</span>
                    <span>{toBengaliNumber(book.first_published)}</span>
                  </div>
                )}
                {book.source_book && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">অনুস্মৃতি</span>
                    <span className="text-gray-400">:</span>
                    <span>{toBengaliNumber(book.source_book)}</span>
                  </div>
                )}

                {book.genre && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">ঘরানা</span>
                    <span className="text-gray-400">:</span>
                    <span className="flex flex-wrap gap-x-1">
                      {Array.isArray(book.genre) ? (
                        book.genre.map((g: string, index: number) => {
                          const linkObj = book.genre_links?.find((l: GenreLink) => l.name === g);
                          return (
                            <span key={index}>
                              {linkObj ? (
                                <Link href={linkObj.link} className="text-blue-600 hover:underline">
                                  {toBengaliNumber(g)}
                                </Link>
                              ) : (
                                toBengaliNumber(g)
                              )}
                              {index < (book.genre?.length ?? 0) - 1 && <span className="mr-1">,</span>}
                            </span>
                          );
                        })
                      ) : (
                        toBengaliNumber(book.genre)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-3 shadow-sm max-h-100 overflow-y-auto font-tarunima">
              <h3 className="text-md font-bold border-b pb-2 mb-3 text-red-900">সূচিপত্র</h3>
              {volumes.length > 0 ? (
                volumes.map((v: Volume) => (
                  <div key={v.id} className="mb-1 bg-[#e0e0eb] px-2 py-0.5 rounded">
                    <Link href={`/book/${slug}/${v.id}`} className="text-blue-600 hover:text-red-900 text-[15px] block py-1">
                      {v.title}
                    </Link>
                  </div>
                ))
              ) : (
                <ul className="pl-2 border-l-2 border-gray-100 space-y-1">
                  {directChapters.map((c: Chapter) => (
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