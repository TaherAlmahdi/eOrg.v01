// app/items/[itemSlug]/page.tsx

import Link from 'next/link';
import { getAllLibraryItems } from '@/app/lib/books';

interface PageProps {
  params: Promise<{ itemSlug: string }>;
}

export default async function ItemTypePage({ params }: PageProps) {
  const { itemSlug } = await params;
  const allItems = await getAllLibraryItems();

  // নির্দিষ্ট itemSlug অনুযায়ী আইটেম ফিল্টার করা
  const filteredItems = allItems.filter((i) => i.itemTypeSlug === itemSlug);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-tarunima capitalize">
        তালিকা: {filteredItems[0]?.itemType || itemSlug}
      </h1>

      {filteredItems.length > 0 ? (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm font-tarunima">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-gray-700">
                <th className="p-4 font-semibold">টাইটেল</th>
                <th className="p-4 font-semibold">গ্রন্থ</th>
                <th className="p-4 font-semibold">লেখক</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {/* ১. টাইটেল (সরাসরি item.href ও item.title) */}
                  <td className="p-4">
                    <Link
                      href={item.href}
                      className="text-lg font-semibold text-teal-800 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </td>

                  {/* ২. গ্রন্থ (সরাসরি item.book ও item.bookTitle) */}
                  <td className="p-4 text-gray-600">
                    {item.book ? (
                      <Link
                        href={item.book}
                        className="text-teal-800 hover:underline"
                      >
                        {item.bookTitle}
                      </Link>
                    ) : (
                      <span>{item.bookTitle || '—'}</span>
                    )}
                  </td>

                  {/* ৩. লেখক (সরাসরি item.author) */}
                  <td className="p-4 text-gray-600">
                    {item.author || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border font-tarunima">
          এই আইটেমের অধীনে কোনো তথ্য পাওয়া যায়নি।
        </div>
      )}
    </div>
  );
}