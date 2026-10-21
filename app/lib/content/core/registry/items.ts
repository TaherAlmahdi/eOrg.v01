// app/lib/content/core/registry/items.ts
//
// Item types (প্রকরণ). The names and slugs live in slug-data.ts (`items`) and in the slug manifest;
// this file only looks them up.

import type { FrontmatterValue } from '@/app/lib/frontmatter';
import { SLUG_DATA } from "./slug-data";
import { findName, findSlug, findSlugByNameSlug, hasSlug } from "./slug-store";
import { toUrlSlug } from "./slug";

export interface ItemMeta {
  name: string;         // বাংলা নাম (যেমন: "গল্প")
  slug: string;         // ইউআরএল স্লাগ (যেমন: "story")
  description?: string;
}

/** Item types of the hand-written registry, by slug. The site itself uses getItemMeta() (registry + manifest). */
export const ITEM_REGISTRY: Record<string, ItemMeta> = Object.fromEntries(
  Object.entries(SLUG_DATA.items).map(([name, rawSlug]) => {
    const slug = toUrlSlug(rawSlug) || toUrlSlug(name);
    return [slug, { name, slug }];
  })
);

// অতিরিক্ত সিনোনিম / স্লাগ ম্যাপিং
const SLUG_ALIASES: Record<string, string> = {
  poetry: "poem",
  letter: "letter",
  patra: "letter",
  bhashya: "commentary",
  nivedan: "dedication",
  article: "articles",
};

/**
 * বাংলা নাম, স্লাগ বা অবজেক্ট থেকে নিরাপদভাবে স্লাগ খুঁজে বের করার হেল্পার
 */
export function getItemSlug(itemNameOrObj: FrontmatterValue): string {
  if (!itemNameOrObj) return "";

  const rawInput = typeof itemNameOrObj === "object"
    ? (itemNameOrObj.slug || itemNameOrObj.name || itemNameOrObj.title || "")
    : String(itemNameOrObj);

  const cleanInput = rawInput.trim();
  if (!cleanInput) return "";

  // 1. written name -> slug ("গল্প" -> "story")
  const byName = findSlug("items", cleanInput);
  if (byName) return byName;

  // 2. already a slug ("story")
  if (hasSlug("items", cleanInput)) return toUrlSlug(cleanInput);

  // 3. slugified Bengali name, then synonyms
  const byNameSlug = findSlugByNameSlug("items", toUrlSlug(cleanInput));
  if (byNameSlug) return byNameSlug;
  const alias = SLUG_ALIASES[cleanInput.toLowerCase()];
  if (alias) return alias;

  return toUrlSlug(cleanInput);
}

/**
 * যেকোনো ইনপুট থেকে পূর্ণাঙ্গ ItemMeta অবজেক্ট বের করার হেল্পার
 */
export function getItemMeta(itemNameOrObj: FrontmatterValue): ItemMeta {
  const slug = getItemSlug(itemNameOrObj);
  const name = findName("items", slug);
  if (name) return { name, slug };

  const fallbackName = typeof itemNameOrObj === "string" ? itemNameOrObj.trim() : slug;
  return { name: fallbackName, slug };
}
