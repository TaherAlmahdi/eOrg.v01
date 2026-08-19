import { compileMDX } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";

/**
 * যেকোনো ভ্যালু (Object, Array, Primitive) থেকে নিরাপদভাবে নাম বা টেক্সট এক্সট্র্যাক্ট করে।
 */
function parseFrontmatterValue(val: unknown): unknown {
  if (val === undefined || val === null) return val;
  if (typeof val === "object" && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    return obj.name || obj.title || obj.label || obj.name_bn || val;
  }
  return val;
}

/**
 * Frontmatter এর যেকোনো ফিল্ডকে সংগতিপূর্ণ Array-তে রূপান্তর করে।
 */
function normalizeFrontmatterItems<T>(fieldValue: unknown): T[] {
  if (fieldValue === undefined || fieldValue === null) return [];
  
  if (Array.isArray(fieldValue)) {
    return fieldValue.map((item) => parseFrontmatterValue(item) as T);
  }
  
  return [parseFrontmatterValue(fieldValue) as T];
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

  const originalKeys = Object.keys(rawFrontmatter);

  originalKeys.forEach((key) => {
    // ইতিমধ্যেই _item, _items বা সরাসরি item/items হলে পুনরাবৃত্তি এড়াতে স্কিপ করা হচ্ছে
    if (key.endsWith("_items") || key.endsWith("_item")) return;

    const val = rawFrontmatter[key];
    const itemsArray = normalizeFrontmatterItems(val);

    processedFrontmatter[`${key}_items`] = itemsArray;
    processedFrontmatter[`${key}_item`] = itemsArray.length > 0 ? itemsArray[0] : null;
  });

  // আইটেম টাইপের লিস্ট (যেমন: 'story', 'poem') সহজে পাওয়ার ব্যবস্থা
  const rawItemValue = rawFrontmatter.item || rawFrontmatter.items;
  const itemTypes = normalizeFrontmatterItems<string>(rawItemValue);

  return {
    ...result,
    frontmatter: processedFrontmatter as T & Record<string, unknown>,
    
    /**
     * আইটেম টাইপগুলোর অ্যারে রিটার্ন করে (যেমন: ['story', 'poem'])
     */
    getItemTypes: (): string[] => itemTypes,

    /**
     * প্রথম আইটেম টাইপ রিটার্ন করে (যেমন: 'story')
     */
    getPrimaryItemType: (): string | null => (itemTypes.length > 0 ? itemTypes[0] : null),

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