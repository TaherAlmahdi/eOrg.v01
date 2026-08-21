// app/components/GenreView.tsx
import React from 'react';
import { getLibraryBooks } from '@/app/lib/books'; // আপনার lib/books.ts ফাইলের সঠিক পাথ অনুযায়ী দিন

interface GenreViewProps {
  slug: string;
  authorSlug?: string; // সাবডোমেন বা নির্দিষ্ট লেখকের জন্য
}

export default async function GenreView({ slug, authorSlug }: GenreViewProps) {
  // ১. lib/books.ts এরgetLibraryBooks ব্যবহার করে ডাটা ফেচ করা
  // authorSlug পাস করলে এটি স্বয়ংক্রিয়ভাবে সেই সাবডোমেন/লেখকের বই ফিল্টার করে আনবে
  const { booksByGenre } = await getLibraryBooks(authorSlug);

  // ২. ইউআরএল স্লাগ (slug) অনুসারে নির্দিষ্ট ঘরানা বই বের করা
  // декоড করে নেওয়া হচ্ছে যাতে বাংলা স্লাগ বা স্পেস সম্পর্কিত সমস্যা না হয়
  const decodedSlug = decodeURIComponent(slug).toLowerCase();

  // ঘরানা অবজেক্ট থেকে ম্যাচিং কী (Key) খুঁজে বের করা
  const matchedGenreKey = Object.keys(booksByGenre).find(
    (gKey) => gKey.toLowerCase() === decodedSlug
  );

  const books = matchedGenreKey ? booksByGenre[matchedGenreKey] : [];

  return (
    <main className="p-4 font-tarunima">
      <h1 className="text-xl font-bold mb-6">
        {authorSlug ? `${authorSlug}-এর বই` : 'সকল বই'} — ঘরানা : {matchedGenreKey || slug}
      </h1>

      {books.length === 0 ? (
        <p className="text-gray-500">এই ঘরানায় কোনো বই পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {books.map((book) => (
            <article key={book.id} className="p-4 border rounded shadow-sm bg-white">
              <h2 className="text-base md:text-lg font-semibold">{book.title}</h2>
              {book.subtitle && (
                <p className="text-sm text-gray-600">{book.subtitle}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">লেখক : {book.author}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}