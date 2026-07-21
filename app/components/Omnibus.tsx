'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const GET_BANKIM_BOOKS = `
  query GetBankimBySeries($slug: [String]!) {
    allSeries(where: { slug: $slug }) {
      nodes {
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

export default function Omnibus() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // সরাসরি ডোমেইন না দিয়ে আমাদের তৈরি করা প্রক্সি URL ব্যবহার করছি
      const API_URL = "/api/graphql"; 
      
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: GET_BANKIM_BOOKS,
            variables: { slug: ["bankim-rachanabali"] }
          }),
        });
        
        const json = await res.json();
        const nodes = json.data?.allSeries?.nodes?.[0]?.contentNodes?.nodes || [];
        setBooks(nodes);
      } catch (error) {
        console.error('Fetch Failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="py-10 text-center">লোড হচ্ছে...</div>;
  if (!books.length) return null;

  return (
    <section className="py-12 bg-[#fdfdf7]">
      <div className="max-w-full mx-auto px-6">
        <h2 className="text-3xl font-bold text-[#008080] mb-10">অমনিবাস</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {books.map((book) => (
            <Link href={`/novel/${book.slug}`} key={book.slug} className="group flex flex-col">
              <div className="relative aspect-2/3 w-full overflow-hidden rounded-sm shadow-md transition-all group-hover:-translate-y-2 bg-gray-100">
                <Image
                  src={book.featuredImage?.node?.sourceUrl || '/placeholder.jpg'}
                  alt={book.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                  className="object-cover"
                  priority={false}
                />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-gray-800 group-hover:text-[#cc7a00]">
                {book.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}