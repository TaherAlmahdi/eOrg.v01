import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getBookContent(slug: string, subpath: string[]) {
  const API_URL = 'https://eduliture.com/graphql';
  
  // আমরা এখন 'search' কুয়েরি ব্যবহার করব যদি সরাসরি আইডি দিয়ে না পায়
  // এটি অনেক বেশি নির্ভরযোগ্য
  const targetSlug = subpath.length > 0 ? subpath[subpath.length - 1] : slug;

  const query = `
    query GetBook($id: ID!, $search: String!) {
      # ১. সরাসরি চেক (ID/URI দিয়ে)
      contentNode(id: $id, idType: URI) {
        ...ContentFields
      }
      # ২. যদি সরাসরি না পায়, তবে স্লাগ দিয়ে সার্চ
      ebooks(where: {name: $search}, first: 1) {
        nodes {
          ...ContentFields
        }
      }
    }

    fragment ContentFields on EBook {
      title
      content
      slug
      children(first: 100) {
        nodes {
          ... on EBook {
            title
            slug
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        variables: { id: targetSlug, search: targetSlug } 
      }),
      cache: 'no-store'
    });

    const json = await res.json();
    
    // ডাটা এক্সট্রাকশন লজিক
    const data = json.data?.contentNode || json.data?.ebooks?.nodes?.[0];
    return data || null;
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
}

export default async function IntegratedBookPage({ params }: { params: Promise<{ slug: string; subpath?: string[] }> }) {
  const { slug, subpath = [] } = await params;
  const bookData = await getBookContent(slug, subpath);

  if (!bookData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#fdfdf7] text-center font-serif">
        <h2 className="text-2xl text-red-500 mb-4 font-bold">দুঃখিত!</h2>
        <p className="text-gray-600 mb-6 italic">সাইটটি এখনও নির্মাণাধীন, তাই পরে আবার চেষ্টা করুন।</p>
        <Link href="/novel" className="px-6 py-2 bg-[#669999] text-white rounded hover:bg-[#4a7777] transition-all shadow-md">
          উপন্যাস তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  // ইউআরএল পাথ ম্যানেজমেন্ট
  const basePath = `/novel/${slug}`;
  const currentPath = subpath.length > 0 ? `${basePath}/${subpath.join('/')}` : basePath;

  return (
    <main className="min-h-screen bg-[#fdfdf7] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <article className="bg-white p-8 md:p-14 border border-gray-200 shadow-sm rounded-sm">
          {/* ব্রেডক্রাম্ব */}
          <nav className="text-sm text-gray-400 mb-8 font-sans">
            <Link href="/novel" className="hover:text-[#669999]">উপন্যাস</Link> 
            <span className="mx-2">/</span> 
            <span className="text-gray-600">{bookData.title}</span>
          </nav>

          <header className="mb-12 text-center border-b-2 border-[#6699991a] pb-10">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#669999] leading-tight mb-4">
              {bookData.title}
            </h1>
          </header>

          {bookData.content ? (
            <div 
              className="prose prose-lg max-w-none font-serif leading-[2.1] text-justify text-[#2c2c2c] selection:bg-[#66999933]"
              dangerouslySetInnerHTML={{ __html: bookData.content }}
            />
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-lg">
              <p className="text-gray-400 italic">এই স্তরে কোনো বিস্তারিত পাঠ্য নেই। নিচের সূচিপত্র দেখুন।</p>
            </div>
          )}

          {/* সূচিপত্র লজিক */}
          {bookData.children?.nodes?.length > 0 && (
            <div className="mt-16 border-t-4 border-[#669999] pt-12">
              <h3 className="text-2xl font-bold mb-8 text-[#333] font-serif">সূচিপত্র</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookData.children.nodes.map((child: any) => (
                  <Link 
                    key={child.slug}
                    href={`${currentPath}/${child.slug}`.replace(/\/+/g, '/')}
                    className="group p-5 bg-[#f9f9f2] border border-gray-100 hover:border-[#669999] hover:bg-white transition-all rounded-md flex justify-between items-center"
                  >
                    <span className="text-lg text-gray-700 group-hover:text-[#669999] font-serif transition-colors">
                       {child.title}
                    </span>
                    <span className="text-[#669999] font-bold group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {subpath.length > 0 && (
          <div className="mt-12 text-center">
            <Link href={basePath} className="text-[#669999] font-bold border-b border-[#669999] hover:text-[#4a7777] transition-all pb-1">
              ← মূল বইয়ের সূচিপত্রে ফিরে যান
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}