import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Home } from 'lucide-react';

async function getNovelData(slug: string) {
  const fullUri = `/ebook/${slug}/`;
  const query = `
    query GetNovelByUri($id: ID!) {
      eBook(id: $id, idType: URI) {
        title
        content
        slug
		date
        featuredImage {
          node {
            sourceUrl
          }
        }		
        parent {
          node {
            ... on EBook {
              title
              slug
              featuredImage { node { sourceUrl } }
              children(first: 100) {
                nodes {
                  ... on EBook {
                    title
                    slug
                    date
                    children(first: 50) {
                      nodes {
                        ... on EBook {
                          title
                          slug
                          date
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        children(first: 100) {
          nodes {
            ... on EBook {
              title
              slug
              date
              children(first: 50) {
                nodes {
                  ... on EBook {
                    title
                    slug
                    date
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://eduliture.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: fullUri } }),
      next: { revalidate: 60 }, 
    });
    const json = await res.json();
    if (json.errors || !json.data?.eBook) return null;
    return json.data?.eBook;
  } catch (error) {
    console.error("Fetch Error:", error);    
    return null;
  }
}

export const dynamic = 'force-dynamic';
export default async function NovelDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novel = await getNovelData(slug);

  if (!novel) notFound();

  // প্যারেন্ট নাকি চাইল্ড তা নির্ধারণ এবং সাইডবার সোর্স ঠিক করা
  const isParent = !novel.parent;
  const sidebarSource = isParent ? novel : novel.parent.node;
  const parentFeaturedImage = sidebarSource.featuredImage?.node?.sourceUrl;

  return (
    <article className="min-h-screen bg-white pb-20 max-w-[1440px] mx-auto font-sans">
      {/* Breadcrumb Section */}
      <div className="border-none bg-gray-50 py-3 px-4 lg:px-8 rounded-lg mb-2">
        <nav className="flex flex-wrap items-center gap-y-2 gap-x-2 text-sm text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#008080] shrink-0">
            <Home size={16} />
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400 line-clamp-1">{novel.title}</span>
        </nav>
      </div>        

      {/* Title Header */}
      <div className="bg-[#669999] p-2 border border-[#669999] mb-3">
        <h1 className="text-2xl md:text-2xl font-bold text-yellow-400 text-center">
          {novel.title}
        </h1>
      </div>

      <main className="px-3 lg:px-10 py-5">
        <div className="flex flex-col-reverse md:flex-row gap-8 items-start">
          
          {/* Sidebar Area */}
          <aside className="bg-[#f0f5f5] w-full md:w-72 shrink-0 md:sticky md:top-0 rounded overflow-hidden shadow-sm">

            {/* Featured Image Container */}
            <div className="w-full bg-white mb-0 mt-0 overflow-hidden shadow-sm">
              {parentFeaturedImage ? (
                <Image 
                  src={parentFeaturedImage} 
                  alt={sidebarSource.title || "Featured Image"}
                  width={300} // সাইডবারের আনুমানিক উইডথ
                  height={450} // ২:৩ রেশিও অনুযায়ী হাইট
                  className="w-full h-auto block object-cover" 
                  priority
                  sizes="(max-width: 768px) 100vw, 300px" 
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center text-gray-500 text-xs italic">
                  ছবি নেই
                </div>
              )}
            </div>

            <div className="pl-4 pr-4 md:p-5">
              <Link href={`/ebook/${sidebarSource.slug}`}>
                <h2 className="font-bold text-lg mb-6 text-[#008080] border-b-2 border-[#008080]/20 pb-2 hover:text-[#999966] transition-colors">
                  {sidebarSource.title}
                </h2>
              </Link>

              {/* সাইডবার নেভিগেশন */}
              <nav>
                <ul className="space-y-0">
                  {sidebarSource.children?.nodes
                    ?.slice()
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((child: any) => (
                      <li key={child.slug} className="space-y-1">
                        {/* চাইল্ড লিংক */}
                        <Link 
                          href={`/ebook/${child.slug}`}
                          className={`block p-2 rounded transition-all font-bold text-x ${
                            slug === child.slug 
                            ? 'bg-[#999966] text-white shadow-md' 
                            : 'text-gray-800 hover:bg-[#008080]/10 hover:text-[#008080]'
                          }`}
                        >
                          {child.title}
                        </Link>

                        {/* গ্র্যান্ড-চাইল্ড সেকশন */}
                        {child.children?.nodes && child.children.nodes.length > 0 && (
                          <ul className="ml-4 border-l-2 border-[#999966]/30 pl-3 space-y-1 mt-1">
                            {child.children.nodes
                              .slice()
                              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((grandChild: any) => (
                                <li key={grandChild.slug}>
                                  <Link 
                                    href={`/ebook/${grandChild.slug}`}
                                    className={`block py-0 text-x transition-colors ${
                                      slug === grandChild.slug 
                                      ? 'text-[#008080] font-bold underline' 
                                      : 'text-gray-600 hover:text-[#008080]'
                                    }`}
                                  >
                                    • {grandChild.title}
                                  </Link>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full">
            <div 
              className="prose prose-stone prose-lg max-w-none text-gray-800 leading-[1.8] text-justify
              prose-headings:text-[#008080] prose-a:text-[#999966]
              prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: novel.content }}
            />
          </div>
        </div>
      </main>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const novel = await getNovelData(slug);
  return { 
    title: `${novel?.title || 'রচনাবলী'} | বঙ্কিম রচনাবলী`,
    description: `বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের অমর সৃষ্টি - ${novel?.title || ''}`
  };
}