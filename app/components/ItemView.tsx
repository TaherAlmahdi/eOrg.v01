// app/components/ItemView.tsx
import React from 'react';
import Link from 'next/link';
import { getAllLibraryItems } from '@/app/lib/books';
import { ITEM_REGISTRY, getItemSlug } from '@/app/lib/content/core/registry/items';

interface ItemViewProps {
  slug: string;
  authorSlug?: string; // সাবডোমেন বা নির্দিষ্ট লেখকের জন্য
}

export default async function ItemView({ slug, authorSlug }: ItemViewProps) {
  // ১. সকল চ্যাপ্টার, সাব-ফোল্ডার ও মূল বইয়ের সব .md ফাইল আইটেম একত্রে নিয়ে আসা
  const allLibraryItems = await getAllLibraryItems();

  // ২. ইউআরএল স্লাগ ডিকোড ও রেজিস্ট্রি থেকে টার্গেট স্লাগ বের করা
  const rawSlug = decodeURIComponent(slug).trim();
  const targetSlug = getItemSlug(rawSlug);

  // ৩. শিরোনাম নির্ধারণ
  const displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug;

  // ৪. সাব-ফোল্ডার/চ্যাপ্টারের যেকোনো .md ফাইলের আইটেম মিলিয়ে ফিল্টার করা
  const filteredItems = allLibraryItems.filter((entry: any) => {
    // লেখক ফিল্টার (যদি authorSlug পাস করা থাকে)
    if (authorSlug) {
      const entryAuthorSlug = getItemSlug(entry.author);
      if (entryAuthorSlug !== authorSlug) return false;
    }

    // আইটেম টাইপ চেক করা (item, itemType, itemTypeSlug যা-ই থাকুক)
    const rawItemType = entry.item || entry.itemType || entry.itemTypeSlug;
    const itemSlug = getItemSlug(rawItemType);

    return itemSlug === targetSlug;
  });

  return (
    <main className="max-w-5xl mx-auto p-4 font-tarunima">
      <h1 className="text-2xl font-bold mb-6">
        {authorSlug ? `${authorSlug}-এর রচনা` : 'সকল সাহিত্যকর্ম'} — তালিকা: {displayTitle}
      </h1>

      {filteredItems.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">
          এই আইটেমের অধীনে কোনো তথ্য পাওয়া যায়নি।
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b text-gray-700">
                <th className="p-4 font-semibold">শিরোনাম</th>
                <th className="p-4 font-semibold">মূল গ্রন্থ</th>
                <th className="p-4 font-semibold">লেখক</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((item: any, idx: number) => {
                const titleText = typeof item.title === 'object' ? item.title.name : (item.title || 'শিরোনামহীন');
                const titleHref = item.href || '#';

                const bookText = typeof item.bookTitle === 'object' ? item.bookTitle.name : (item.bookTitle || item.book || '—');
                const bookHref = item.bookHref || (item.bookSlug ? `/books/${item.bookSlug}` : '#');

                const authorText = typeof item.author === 'object' ? item.author.name : (item.author || '—');

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {/* চ্যাপ্টার/লেখার শিরোনাম */}
                    <td className="p-4">
                      <Link
                        href={titleHref}
                        className="text-lg font-semibold text-teal-800 hover:underline"
                      >
                        {titleText}
                      </Link>
                    </td>

                    {/* মূল গ্রন্থ */}
                    <td className="p-4 text-gray-600">
                      {bookHref !== '#' ? (
                        <Link href={bookHref} className="text-teal-800 hover:underline">
                          {bookText}
                        </Link>
                      ) : (
                        <span>{bookText}</span>
                      )}
                    </td>

                    {/* লেখক */}
                    <td className="p-4 text-gray-600">
                      {authorText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}