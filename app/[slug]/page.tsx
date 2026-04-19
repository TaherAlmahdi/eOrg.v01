import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ALLOWED_GENRES = ['novel', 'humor', 'religious', 'essays', 'letters', 'others'];

async function getBooksByGenre(genreSlug: string) {
  // genre স্লাগ অনুযায়ী সরাসরি কুয়েরি করার জন্য এই ফরম্যাটটি ব্যবহার করুন
  const query = `
    query GetBooksByGenre($genre: [String]) {
      eBooks(first: 100, where: {
        taxQuery: {
          taxArray: [
            {
              taxonomy: GENRE, # এখানে আপনার ট্যাক্সোনমি নাম বড় হাতের 'GENRE' ট্রাই করুন
              field: SLUG,
              terms: $genre,
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
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ 
        query,
        variables: { genre: [genreSlug] } 
      }),
      cache: 'no-store',
    });

    const json = await res.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return [];
    }

    return json.data?.eBooks?.nodes || [];
  } catch (error) {
    console.error('Fetch Failed:', error);
    return [];
  }
}

export default async function DynamicGenrePage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!ALLOWED_GENRES.includes(slug)) {
    return notFound();
  }

  const books = await getBooksByGenre(slug);

  // ডাটা না আসলে ইউজারকে মেসেজ দেখানো
  if (!books || books.length === 0) {
    return (
      <main className="min-h-screen bg-[#fdfdf7] py-10 px-3 text-center">
        <h1 className="text-xl text-gray-600">বর্তমানে এই বিভাগে কোনো বই পাওয়া যায়নি।</h1>
        <Link href="/" className="text-blue-500 underline mt-4 inline-block">হোমপেজে ফিরে যান</Link>
      </main>
    );
  }

  const titleMap: Record<string, string> = {
    novel: 'উপন্যাস সমগ্র',
    humor: 'রম্যরচনা সমগ্র',
    religious: 'ধর্মীয় সাহিত্য',
    essays: 'ইতিহাস ও প্রবন্ধ',
    letters: 'পত্রাবলী ও বিবিধ',
    others: 'বিবিধ রচনা'
  };

  return (
    <main className="min-h-screen bg-[#fdfdf7] py-2 px-3">
      <div className="bg-[#669999] p-2 border border-[#669999] mb-3">
        <h1 className="text-2xl font-bold text-yellow-400 text-center">
          {titleMap[slug]}
        </h1>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {books.map((book: any) => (
          <Link href={`/novel/${book.slug}`} key={book.slug} className="group">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded shadow-lg border bg-white transition-all duration-300 group-hover:-translate-y-2">
              <Image
                src={book.featuredImage?.node?.sourceUrl || '/placeholder.jpg'}
                alt={book.title}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h3 className="mt-6 p-2 text-center text-lg font-bold group-hover:text-yellow-400 transition-colors line-clamp-2">
              {book.title}
            </h3>
          </Link>
        ))}
      </div>
    </main>
  );
}