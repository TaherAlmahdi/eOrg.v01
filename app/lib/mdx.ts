import { compileMDX } from "next-mdx-remote/rsc";

function normalizeHtml(source: string): string {
  return (
    source
      // HTML → React
      .replace(/\bclass=/gi, "className=")
      .replace(/\bfor=/gi, "htmlFor=")

      // Optional legacy attributes
      .replace(/\btabindex=/gi, "tabIndex=")
      .replace(/\breadonly=/gi, "readOnly=")
      .replace(/\bmaxlength=/gi, "maxLength=")
      .replace(/\bcellpadding=/gi, "cellPadding=")
      .replace(/\bcellspacing=/gi, "cellSpacing=")
      .replace(/\bcolspan=/gi, "colSpan=")
      .replace(/\browspan=/gi, "rowSpan=")
  );
}

/**
 * Frontmatter এর কোনো ফিল্ড (যেমন: series, genre, tags) single string, single item object,
 * কিংবা items array যা-ই থাকুক না কেন—তাকে একটি Normalized Array (items) এ রূপান্তর করে।
 */
function normalizeFrontmatterItems<T>(fieldValue: unknown): T[] {
  if (!fieldValue) return [];

  // ১. যদি ইতোমধ্যে Array হয় (items)
  if (Array.isArray(fieldValue)) {
    return fieldValue as T[];
  }

  // ২. যদি Single Item (string বা object) হয়
  return [fieldValue as T];
}

export async function compileLibraryMDX<T = Record<string, unknown>>(
  source: string,
  components = {}
) {
  const normalized = normalizeHtml(source);

  const result = await compileMDX<T>({
    source: normalized,
    options: {
      parseFrontmatter: true,
    },
    components,
  });

  // Frontmatter-কে প্রসেস করে item, items এবং normalized helpers যুক্ত করা
  const rawFrontmatter = (result.frontmatter || {}) as Record<string, unknown>;
  const processedFrontmatter = { ...rawFrontmatter };

  // Frontmatter-এর প্রতিটি কি (Key) চেক করে item ও items ফিল্ড তৈরি
  Object.keys(rawFrontmatter).forEach((key) => {
    const val = rawFrontmatter[key];

    // যদি কোনো কি-র নাম ইতিমধ্যে 'items' বা 'item' দিয়ে শেষ না হয়, তবে তাদের স্বাভাবিক করা
    const itemsArray = normalizeFrontmatterItems(val);

    // items ফিল্ড যুক্ত করা (যেমন: series -> series_items)
    processedFrontmatter[`${key}_items`] = itemsArray;

    // ১ম আইটেমটি পাওয়া (যেমন: series -> series_item)
    processedFrontmatter[`${key}_item`] = itemsArray.length > 0 ? itemsArray[0] : null;
  });

  return {
    ...result,
    frontmatter: processedFrontmatter as T,
    // সরাসরি এক্সেসের জন্য রেজাল্ট লেভেলেও হেল্পার ফাংশন
    getNormalizedItems: <K = unknown>(key: keyof T): K[] => {
      return normalizeFrontmatterItems<K>(rawFrontmatter[key as string]);
    },
    getNormalizedItem: <K = unknown>(key: keyof T): K | null => {
      const items = normalizeFrontmatterItems<K>(rawFrontmatter[key as string]);
      return items.length > 0 ? items[0] : null;
    },
  };
}