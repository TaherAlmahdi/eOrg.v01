import { Metadata } from 'next';
import { getAllBooks, Book } from '@/app/lib/books';
import BooksPageClient from './BooksPageClient';

function parseBooksData(booksResponse: unknown): Book[] {
  if (Array.isArray(booksResponse)) return booksResponse as Book[];
  if (booksResponse && typeof booksResponse === 'object') {
    const res = booksResponse as Record<string, unknown>;
    if (Array.isArray(res.books)) return res.books as Book[];
    if (Array.isArray(res.data)) return res.data as Book[];
  }
  return [];
}

// 🟢 এখানে আপনার ইচ্ছেমতো কারেন্ট পেজ টাইটেল বসিয়ে দিন
export async function generateMetadata(): Promise<Metadata> {
  const currentPageTitle = 'গ্রন্থাগার'; // অন্য পেজে গেলে এখানে শুধু নাম বদল হবে (যেমন: 'বইয়ের বিবরণ', 'যোগাযোগ' ইত্যাদি)
  const fullTitle = `${currentPageTitle} ❀ এডুলিচার পাঠশালা ❀ এডুলিচার`;

  return {
    title: fullTitle,
    openGraph: { title: fullTitle },
    twitter: { title: fullTitle },
  };
}

export default async function BooksPage() {
  const booksResponse = await getAllBooks('library');
  const booksData = parseBooksData(booksResponse);

  return (
    <BooksPageClient
      initialBooks={booksData}
      siteTitle="এডুলিচার পাঠশালা"
    />
  );
}