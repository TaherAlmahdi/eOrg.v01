import Image from 'next/image';
import Link from 'next/link';

// পেজটিকে ডাইনামিক রেন্ডারিং নিশ্চিত করা হলো
export const dynamic = 'force-dynamic';

async function getBankimNovels() {
  const query = `
    query GetAllBankimBooks {
      allSeries(where: { slug: ["bankim-rachanabali"] }) {
        nodes {
          eBooks(first: 100, where: { orderby: { field: DATE, order: ASC } }) {
            nodes {
              title
              slug
              featuredImage {
                node {
                  sourceUrl
                }
              }
              genres {
                nodes {
                  slug
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
      headers: { 
        'Content-Type': 'application/json',
        // লাইভ সার্ভারে অনেক সময় ইউজার এজেন্ট না থাকলে রিকোয়েস্ট ব্লক হয়
        'User-Agent': 'Mozilla/5.0' 
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    });

    // রেসপন্স স্ট্যাটাস চেক করা (যদি ২০৩ বা ৪-০-৪ আসে)
    if (!res.ok) {
      console.error(`HTTP Error: ${res.status}`);
      return [];
    }

    const json = await res.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    // ডাটা পাথ আরও সুরক্ষিত করা হলো (Safe Extraction)
    const seriesNodes = json.data?.allSeries?.nodes || [];
    if (seriesNodes.length === 0) {
      console.warn('No series found with slug bankim-rachanabali');
      return [];
    }

    const allBooks = seriesNodes[0]?.eBooks?.nodes || [];

    // 'novel' স্লাগ ফিল্টার
    return allBooks.filter((book: any) => 
      book.genres?.nodes?.some((genre: any) => genre.slug === 'novel')
    );

  } catch (error) {
    console.error('Fetch Failed:', error);
    return [];
  }
}

export default async function NovelsPage() {
  const novels = await getBankimNovels();

  return (
    <>
      <main className="min-h-screen bg-[#fdfdf7] py-2 px-3">
        {/* হেডার অংশ */}
        <div className="bg-[#669999] p-2 border border-[#669999] mb-3">
          <h1 className="text-2xl md:text-2xl font-bold text-yellow-400 text-center">
            উপন্যাস সমগ্র
          </h1>
        </div>

        {/* উপন্যাস গ্রিড */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {novels && novels.length > 0 ? (
            novels.map((novel: any) => {
              const featuredImgUrl = novel.featuredImage?.node?.sourceUrl;

              return (
                <Link href={`/novel/${novel.slug}`} key={novel.slug} className="group">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded shadow-lg border bg-white transition-all duration-300 group-hover:-translate-y-2">
                    <Image
                      src={featuredImgUrl || '/placeholder.jpg'}
                      alt={novel.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      priority={false}
                    />
                  </div>
                  <h3 className="mt-6 p-2 text-center text-lg font-bold group-hover:text-yellow-400 transition-colors line-clamp-2 rounded-md">
                    {novel.title}
                  </h3>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-4xl mb-4 text-gray-300">📚</div>
              <p className="text-gray-500 text-lg">বর্তমানে কোনো উপন্যাস পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}