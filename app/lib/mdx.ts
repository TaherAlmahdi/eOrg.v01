import { compileMDX } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";

/**
 * যেকোনো ভ্যালু (Object, Array, Primitive) থেকে নিরাপদভাবে নাম বা স্লাগ এক্সট্র্যাক্ট করে।
 */
function parseFrontmatterValue(val: unknown): string {
  if (val === undefined || val === null) return "";
  
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    return String(obj.slug || obj.name || obj.title || obj.label || "").trim();
  }
  
  return String(val).trim();
}

/**
 * Frontmatter এর যেকোনো ফিল্ডকে সংগতিপূর্ণ Array-তে রূপান্তর করে।
 */
function normalizeFrontmatterItems<T>(fieldValue: unknown): T[] {
  if (fieldValue === undefined || fieldValue === null) return [];
  
  if (Array.isArray(fieldValue)) {
    return fieldValue.map((item) => parseFrontmatterValue(item) as T);
  }
  
  const parsed = parseFrontmatterValue(fieldValue);
  return parsed ? [parsed as T] : [];
}

export async function compileLibraryMDX<
  T extends Record<string, unknown> = Record<string, unknown>
>(
  source: string,
  components: MDXComponents = {}
) {
  const result = await compileMDX<T>({
    source,
    options: {
      parseFrontmatter: true,
    },
    components,
  });

  const rawFrontmatter = (result.frontmatter || {}) as Record<string, unknown>;
  const processedFrontmatter: Record<string, unknown> = { ...rawFrontmatter };

  // 🟢 ১. আইটেম টাইপ নরমালইজ করা (অবজেক্ট বা স্ট্রিং যাই থাকুক, সেফ স্ট্রিং অ্যারে তৈরি হবে)
  const rawItemValue = rawFrontmatter.item ?? rawFrontmatter.items;
  const itemTypes = normalizeFrontmatterItems<string>(rawItemValue).filter(Boolean);

  // 🟢 ২. মূল ফ্রন্টম্যাটারে নিশ্চিত করা যেন item এবং items সরাসরি প্রবেশযোগ্য থাকে
  processedFrontmatter.item = rawFrontmatter.item ?? (itemTypes.length > 0 ? itemTypes[0] : null);
  processedFrontmatter.items = itemTypes.length > 0 ? itemTypes : (rawFrontmatter.items ?? []);
  processedFrontmatter.itemTypes = itemTypes;

  // ডাইনামিক সাপোর্টিং কী তৈরি
  const originalKeys = Object.keys(rawFrontmatter);
  originalKeys.forEach((key) => {
    if (key.endsWith("_items") || key.endsWith("_item")) return;

    const val = rawFrontmatter[key];
    const itemsArray = normalizeFrontmatterItems(val);

    processedFrontmatter[`${key}_items`] = itemsArray;
    processedFrontmatter[`${key}_item`] = itemsArray.length > 0 ? itemsArray[0] : null;
  });

  return {
    ...result,
    frontmatter: processedFrontmatter as T & {
      item?: unknown;
      items?: unknown;
      itemTypes: string[];
    },
    
    getItemTypes: (): string[] => itemTypes,
    getPrimaryItemType: (): string | null => (itemTypes.length > 0 ? itemTypes[0] : null),
    getNormalizedItems: <K = unknown>(key: keyof T | string): K[] => {
      return normalizeFrontmatterItems<K>(rawFrontmatter[key as string]);
    },
    getNormalizedItem: <K = unknown>(key: keyof T | string): K | null => {
      const items = normalizeFrontmatterItems<K>(rawFrontmatter[key as string]);
      return items.length > 0 ? items[0] : null;
    },
  };
}