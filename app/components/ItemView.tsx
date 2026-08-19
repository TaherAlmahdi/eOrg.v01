import React from "react";
import Link from "next/link";
import { getAllLibraryItems } from "@/app/lib/books";
import { ITEM_REGISTRY, getItemSlug } from "@/app/lib/content/core/registry/items";

// ১. লাইব্রেরি আইটেমের টাইপ ডেফিনিশন
interface LibraryItem {
  title?: string | { name: string };
  href?: string;
  bookTitle?: string | { name: string };
  book?: string;
  bookHref?: string;
  bookSlug?: string;
  author?: string | { name: string };
  authorSlug?: string;
  author_slug?: string;
  item?: string | string[] | { title?: string; name?: string };
  items?: string | string[];
  itemType?: string | string[];
  itemTypeSlug?: string;
}

interface ItemViewProps {
  slug: string;
  authorSlug?: string;
}

/**
 * ফ্রন্টম্যাটারের বিভিন্ন ফিল্ড (String/Object) থেকে নিরাপদভাবে নাম বের করার হেল্পার
 */
const extractFieldText = (
  field: string | { name?: string; title?: string } | undefined,
  fallback: string = "—"
): string => {
  if (!field) return fallback;
  if (typeof field === "string") return field.trim() || fallback;
  if (typeof field === "object" && field !== null) {
    return field.name || field.title || fallback;
  }
  return fallback;
};

/**
 * এন্ট্রির সকল সম্ভাব্য item ফিল্ড থেকে slug তালিকা বের করা
 */
const extractItemSlugsFromEntry = (entry: LibraryItem): string[] => {
  const rawValues: any[] = [];

  const candidates = [
    entry.item,
    entry.items,
    entry.itemType,
    entry.itemTypeSlug,
  ];

  candidates.forEach((cand) => {
    if (Array.isArray(cand)) {
      rawValues.push(...cand);
    } else if (cand) {
      rawValues.push(cand);
    }
  });

  return rawValues.map((val) => {
    if (typeof val === "string") return getItemSlug(val);
    if (typeof val === "object" && val !== null) {
      return getItemSlug(val.name || val.title || val.item || "");
    }
    return "";
  }).filter(Boolean);
};

export default async function ItemView({ slug, authorSlug }: ItemViewProps) {
  // ১. সকল লাইব্রেরি ডাটা লোড
  const allLibraryItems: LibraryItem[] = await getAllLibraryItems();

  // ২. ইউআরএল স্লাগ ডিকোড ও মেটাডাটা
  const rawSlug = decodeURIComponent(slug).trim();
  const targetSlug = getItemSlug(rawSlug);
  const displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug;

  // ৩. ফিল্টারিং লজিক
  const filteredItems = allLibraryItems.filter((entry) => {
    // লেখক ফিল্টার (যদি authorSlug থাকে)
    if (authorSlug) {
      const fileAuthorSlug = getItemSlug(
        entry.authorSlug || entry.author_slug || extractFieldText(entry.author, "")
      );
      if (fileAuthorSlug !== authorSlug.toLowerCase()) return false;
    }

    // আইটেম টাইপ ফিল্টার (এক বা একাধিক আইটেম থাকলে)
    const itemSlugs = extractItemSlugsFromEntry(entry);
    return itemSlugs.includes(targetSlug);
  });

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 font-tarunima space-y-6">
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
          {authorSlug ? `${authorSlug}-এর রচনা` : "সকল সাহিত্যকর্ম"} — তালিকা:{" "}
          <span className="text-[#008080]">{displayTitle}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          সর্বমোট {filteredItems.length.toLocaleString("bn-BD")} টি লেখা পাওয়া গেছে
        </p>
      </header>

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white/80 rounded-xl border border-dashed border-gray-300">
          এই আইটেমের অধীনে কোনো সাহিত্যকর্ম পাওয়া যায়নি।
        </div>
      ) : (
        <div className="border border-teal-100 rounded-xl overflow-hidden bg-white/90 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-teal-50/60 border-b border-teal-100 text-teal-900">
                  <th className="p-4 font-semibold text-sm">শিরোনাম</th>
                  <th className="p-4 font-semibold text-sm">মূল গ্রন্থ</th>
                  <th className="p-4 font-semibold text-sm">লেখক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item, idx) => {
                  const titleText = extractFieldText(item.title, "শিরোনামহীন");
                  const titleHref = item.href || "#";

                  const bookText = extractFieldText(
                    item.bookTitle || item.book,
                    "—"
                  );
                  const bookHref =
                    item.bookHref ||
                    (item.bookSlug ? `/book/${item.bookSlug}` : "#");

                  const authorText = extractFieldText(item.author, "—");

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-teal-50/30 transition-colors duration-150"
                    >
                      {/* শিরোনাম */}
                      <td className="p-4">
                        <Link
                          href={titleHref}
                          className="text-base font-semibold text-[#008080] hover:text-[#cc7a00] hover:underline transition-colors"
                        >
                          {titleText}
                        </Link>
                      </td>

                      {/* মূল গ্রন্থ */}
                      <td className="p-4 text-sm text-gray-600">
                        {bookHref !== "#" ? (
                          <Link
                            href={bookHref}
                            className="text-teal-700 hover:text-[#cc7a00] hover:underline transition-colors"
                          >
                            {bookText}
                          </Link>
                        ) : (
                          <span>{bookText}</span>
                        )}
                      </td>

                      {/* লেখক */}
                      <td className="p-4 text-sm text-gray-600">
                        {authorText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}