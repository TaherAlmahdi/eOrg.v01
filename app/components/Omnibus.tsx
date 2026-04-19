import Image from 'next/image';
import Link from 'next/link';

const GET_BANKIM_BOOKS = `
  query GetBankimBySeries {
    allSeries(where: { slug: ["bankim-rachanabali"] }) {
      nodes {
        name
        contentNodes(first: 50) {
          nodes {
            ... on EBook {
              title
              slug
              featuredImage {
                node {
                  sourceUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function getBankimOmnibus() {
  // ভ্যারিয়েবল থেকে এন্ডপয়েন্ট নেওয়া
  const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://eduliture.com/graphql";

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // সাবডোমেন রিকোয়েস্ট নিশ্চিত করতে কিছু জেনেরিক হেডার
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: GET_BANKIM_BOOKS }),
      cache: 'no-store', 
    });

    // রেসপন্সটি টেক্সট হিসেবে চেক করা (HTML এরর এড়াতে)
    const responseText = await res.text();
    
    try {
      const json = JSON.parse(responseText);
      if (json.errors) {
        console.error('GraphQL Error:', json.errors);
        return [];
      }
      return json.data?.allSeries?.nodes[0]?.contentNodes?.nodes || [];
    } catch (parseError) {
      console.error("Server returned non-JSON response. Check if CORS is enabled on eduliture.com");
      return [];
    }
  } catch (error) {
    console.error('Fetch Failed:', error);
    return [];
  }
}

export default async function Omnibus() {
  const books = await getBankimOmnibus();

  if (!books || books.length === 0) return null;

  return (
    <section className="py-12 bg-[#fdfdf7]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex items-center gap-4 mb-10 border-b-2 border-[#008080]/10 pb-4">
          <h2 className="text-3xl font-bold text-[#008080]">অমনিবাস</h2>
          <div className="h-8 w-[1px] bg-gray-300 hidden md:block"></div>
          <span className="text-gray-500 italic text-lg leading-none">বঙ্কিম রচনাবলী সংগ্রহ</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {books.map((book: any) => (
            <Link 
              href={`/novel/${book.slug}`} 
              key={book.slug} 
              className="group flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm shadow-md transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl border border-gray-100 bg-white">
                <Image
                  src={book.featuredImage?.node?.sourceUrl || '/placeholder.jpg'}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 15vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-gray-800 group-hover:text-[#cc7a00] transition-colors line-clamp-2 leading-tight">
                {book.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}