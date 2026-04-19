import Image from 'next/image';
import Link from 'next/link';

// ১. পেজটিকে ডাইনামিক রেন্ডারিং করার জন্য কনফিগার করা হলো
export const dynamic = 'force-dynamic';

async function getBankimHumor() {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      // cache: 'no-store' ব্যবহার করা হয়েছে ডাইনামিক ডাটা নিশ্চিত করতে
      cache: 'no-store',
    });

    const json = await res.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    const allBooks = json.data?.allSeries?.nodes?.[0]?.eBooks?.nodes || [];

    // এখানে 'humor' স্লাগ ফিল্টার রাখা হয়েছে
    return allBooks.filter((book: any) => 
      book.genres?.nodes?.some((genre: any) => genre.slug === 'humor')
    );

  } catch (error) {
    console.error('Fetch Failed:', error);
    return [];
  }
}

export default async function HumorPage() {
  const humorBooks = await getBankimHumor();

  return (
    <>
      <main className="min-h-screen bg-[#fdfdf7] py-2 px-3">
        {/* হেডার অংশ */}
        <div className="bg-[#669999] p-2 border border-[#669999] mb-3">
          <h1 className="text-2xl md:text-2xl font-bold text-yellow-400 text-center">
            রম্যরচনা সমগ্র
          </h1>
        </div>

        {/* কন্টেন্ট গ্রিড */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {humorBooks && humorBooks.length > 0 ? (
            humorBooks.map((book: any) => {
              const featuredImgUrl = book.featuredImage?.node?.sourceUrl;

              return (
                <Link href={`/novel/${book.slug}`} key={book.slug} className="group">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded shadow-lg border bg-white transition-all duration-300 group-hover:-translate-y-2">
                    <Image
                      src={featuredImgUrl || '/placeholder.jpg'}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="mt-6 p-2 text-center text-lg font-bold group-hover:text-[#008080] transition-colors line-clamp-2 rounded-md">
                    {book.title}
                  </h3>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="text-4xl mb-4 text-gray-300">📚</div>
              <p className="text-gray-500 text-lg">বর্তমানে কোনো রম্যরচনা পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}