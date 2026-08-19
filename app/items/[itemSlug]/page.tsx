// app/items/[itemSlug]/page.tsx

import Link from 'next/link';
import { getAllLibraryItems } from '@/app/lib/books';

interface PageProps {
  params: Promise<{ itemSlug: string }>;
}

// সেফ স্ট্রিং বের করার ফাংশন
function safeExtractString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.slug || val.name || val.title || val.itemTypeSlug || '';
  }
  return String(val);
}

// সেফ টেক্সট/লেবেল বের করার ফাংশন
function safeExtractLabel(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.name || val.title || val.bookTitle || val.label || val.slug || '';
  }
  return String(val);
}

// সেফ লিংক বের করার ফাংশন
function safeExtractLink(val: any, fallbackPrefix: string): string {
  if (!val) return '';
  if (typeof val === 'object' && val.slug) {
    return `${fallbackPrefix}/${val.slug}`;
  }
  const str = safeExtractString(val).trim();
  if (!str) return '';
  return `${fallbackPrefix}/${encodeURIComponent(str)}`;
}

export default async function ItemTypePage({ params }: PageProps) {
  const { itemSlug } = await params;
  const allItems = await getAllLibraryItems();

  // টাইপস্ক্রিপ্ট এরর এড়াতে `any` এ কাস্ট করে অবজেক্ট ফিল্টার করা
  const filteredItems = allItems.filter((entry) => {
    const rawEntry = entry as any;
    const typeObj = rawEntry.itemTypeSlug || rawEntry.itemType || rawEntry.item || rawEntry.slug;
    
    const extractedSlug = safeExtractString(typeObj).toLowerCase();
    const extractedName = safeExtractLabel(typeObj).toLowerCase();
    const targetSlug = itemSlug.toLowerCase();

    return extractedSlug === targetSlug || extractedName === targetSlug;
  });

  const firstEntry = filteredItems[0] as any;
  const firstItemType = firstEntry?.itemType || firstEntry?.item || firstEntry?.itemTypeSlug;
  const pageTitle = safeExtractLabel(firstItemType) || itemSlug;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-tarunima capitalize">
        তালিকা: {pageTitle}
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
              {filteredItems.map((entry, idx) => {
                const item = entry as any;

                // ১. টাইটেল
                const titleText = safeExtractLabel(item.title) || 'শিরোনামহীন';
                const titleHref = item.href || '#';

                // ২. গ্রন্থ
                const bookText = safeExtractLabel(item.bookTitle || item.book);
                const bookHref = item.bookHref || safeExtractLink(item.bookTitle || item.book, '/books');

                // ৩. লেখক
                const authorText = safeExtractLabel(item.author);

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    {/* টাইটেল */}
                    <td className="p-4">
                      <Link
                        href={titleHref}
                        className="text-lg font-semibold text-teal-800 hover:underline"
                      >
                        {titleText}
                      </Link>
                    </td>

                    {/* গ্রন্থ */}
                    <td className="p-4 text-gray-600">
                      {bookText && bookHref ? (
                        <Link
                          href={bookHref}
                          className="text-teal-800 hover:underline"
                        >
                          {bookText}
                        </Link>
                      ) : (
                        <span>{bookText || '—'}</span>
                      )}
                    </td>

                    {/* লেখক */}
                    <td className="p-4 text-gray-600">
                      {authorText || '—'}
                    </td>
                  </tr>
                );
              })}
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