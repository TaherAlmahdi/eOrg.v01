import { compileMDX } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";

/**
 * Frontmatter এর যেকোনো ফিল্ডকে সংগতিপূর্ণ Array-তে রূপান্তর করে।
 */
function normalizeFrontmatterItems<T>(fieldValue: unknown): T[] {
  if (fieldValue === undefined || fieldValue === null) return [];
  if (Array.isArray(fieldValue)) return fieldValue as T[];
  return [fieldValue as T];
}

export async function compileLibraryMDX<
  T extends Record<string, unknown> = Record<string, unknown>
>(
  source: string,
  components: MDXComponents = {}
) {
  // MDX কম্পাইল করা
  const result = await compileMDX<T>({
    source,
    options: {
      parseFrontmatter: true,
    },
    components,
  });

  const rawFrontmatter = (result.frontmatter || {}) as Record<string, unknown>;
  const processedFrontmatter: Record<string, unknown> = { ...rawFrontmatter };

  // শুধুমাত্র অরিজিনাল কি (Keys) গুলোর ওপর লুপ চালানো হচ্ছে
  const originalKeys = Object.keys(rawFrontmatter);

  originalKeys.forEach((key) => {
    // যদি ইতিমধ্যেই _item বা _items কি থাকে তবে এড়িয়ে চলা হচ্ছে
    if (key.endsWith("_items") || key.endsWith("_item")) return;

    const val = rawFrontmatter[key];
    const itemsArray = normalizeFrontmatterItems(val);

    processedFrontmatter[`${key}_items`] = itemsArray;
    processedFrontmatter[`${key}_item`] = itemsArray.length > 0 ? itemsArray[0] : null;
  });

  return {
    ...result,
    frontmatter: processedFrontmatter as T & Record<string, unknown>,
    /**
     * র ফ্রন্টম্যাটারের নির্দিষ্ট কি থেকে সুরক্ষিতভাবে Array পাওয়ার হেল্পার
     */
    getNormalizedItems: <K = unknown>(key: keyof T | string): K[] => {
      return normalizeFrontmatterItems<K>(rawFrontmatter[key as string]);
    },
    /**
     * র ফ্রন্টম্যাটারের নির্দিষ্ট কি থেকে ১ম আইটেম পাওয়ার হেল্পার
     */
    getNormalizedItem: <K = unknown>(key: keyof T | string): K | null => {
      const items = normalizeFrontmatterItems<K>(rawFrontmatter[key as string]);
      return items.length > 0 ? items[0] : null;
    },
  };
}