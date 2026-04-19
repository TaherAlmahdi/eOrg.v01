import Image from 'next/image';
import Link from 'next/link';

async function getBankimOmnibus() {
  const query = `
    query GetBankimOmnibus {
      eBooks(first: 50, where: {
        taxQuery: {
          taxArray: [
            {
              taxonomy: series, 
              field: SLUG, 
              terms: ["bankim-rachanabali"], 
              operator: IN
            }
          ]
        },
        orderby: { field: DATE, order: ASC }
      }) {
        nodes {
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
  `;

  try {
    const res = await fetch('https://eduliture.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }, // ১ ঘণ্টা ক্যাশ থাকবে
    });

    const json = await res.json();
    
    if (json.errors) {
      console.error('GraphQL Error:', json.errors);
      return [];
    }

    return json.data?.eBooks?.nodes || [];
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
        
        {/* হেডার */}
        <div className="flex items-center gap-4 mb-10 border-b-2 border-[#008080]/10 pb-4">
          <h2 className="text-3xl font-bold text-[#008080]">অমনিবাস</h2>
          <div className="h-8 w-[1px] bg-gray-300 hidden md:block"></div>
          <span className="text-gray-500 italic text-lg">বঙ্কিম রচনাবলী সংগ্রহ</span>
        </div>

        {/* বুক লিস্ট গ্রিড */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {books.map((book: any) => (
            <Link 
              href={`/novel/${book.slug}`} 
              key={book.slug} 
              className="group flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm shadow-md transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl border border-gray-100">
                <Image
                  src={book.featuredImage?.node?.sourceUrl || '/placeholder.jpg'}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 15vw"
                  className="object-cover"
                />
                {/*overlay effect*/}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
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