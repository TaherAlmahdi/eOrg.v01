import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ALLOWED_GENRES = ['novel', 'humor', 'religious', 'essays', 'letters', 'others'];

async function getBooksByGenre(genreSlug: string) {
  const API_URL = 'https://eduliture.com/graphql';

  const query = `
    query GetBankimBooks {
      allSeries(where: { slug: "bankim-rachanabali" }) {
        nodes {
          contentNodes(first: 100) {
            nodes {
              ... on EBook {
                title
                slug
                date
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
    }
  `;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 } 
    });

    const json = await res.json();

    if (json.errors) {
      console.error('GraphQL Error Details:', json.errors);
      return [];
    }

    const allBankimBooks = json.data?.allSeries?.nodes?.[0]?.contentNodes?.nodes || [];

    // ১. নির্দিষ্ট জনরা অনুযায়ী ফিল্টার
    const filteredBooks = allBankimBooks.filter((book: any) => 
      book.genres?.nodes?.some((g: any) => g.slug === genreSlug)
    );

    // ২. তারিখ অনুযায়ী ASC (পুরানো থেকে নতুন) সাজানো
    const sortedBooks = filteredBooks.sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return sortedBooks;
  } catch (error) {
    console.error('Fetch Failed:', error);
    return [];
  }
}

export default async function DynamicGenrePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!ALLOWED_GENRES.includes(slug)) {
    return notFound();
  }

  const books = await getBooksByGenre(slug);

  const titleMap: Record<string, string> = {
    novel: 'উপন্যাস সমগ্র',
    humor: 'রম্যরচনা সমগ্র',
    religious: 'ধর্মীয় সাহিত্য',
    essays: 'প্রবন্ধাবলী',
    letters: 'পত্রাবলী',
    others: 'বিবিধ রচনা'
  };

  if (!books || books.length === 0) {
    return (
      <main className="min-h-screen bg-[#fdfdf7] py-10 px-3 text-center">
        <h1 className="text-xl text-gray-600 mb-4">বঙ্কিম রচনাবলীর এই বিভাগে কোনো বই পাওয়া যায়নি।</h1>
        <Link href="/" className="px-4 py-2 bg-[#669999] text-white rounded shadow transition-all hover:bg-[#558888]">
          হোমপেজে ফিরে যান
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfdf7] py-2 px-3">
      <div className="bg-[#669999] p-4 border border-[#669999] mb-8 rounded-sm shadow-sm text-center">
        <h1 className="text-2xl font-bold text-yellow-400">
          {titleMap[slug]}
        </h1>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
        {books.map((book: any) => (
          <Link href={`/${slug}/${book.slug}`} key={book.slug} className="group flex flex-col">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm shadow-md border bg-white transition-all duration-300 group-hover:-translate-y-2">
              <Image
                src={book.featuredImage?.node?.sourceUrl || '/placeholder.jpg'}
                alt={book.title}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover"
              />
            </div>
            <h3 className="mt-4 text-center text-[16px] font-bold text-gray-800 group-hover:text-[#cc7a00] line-clamp-2 px-1">
              {book.title}
            </h3>
          </Link>
        ))}
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  return ALLOWED_GENRES.map((slug) => ({
    slug: slug,
  }));
}