// app/lib/content/core/registry/slug-store.ts
//
// Name <-> slug lookups for authors, genres, series, tags, books and item types.
// Starts from the hand-written registry (slug-data.ts); the site layers the R2 slug manifest
// (_manifest/slugs.json, built by sync-assets) on top via setSlugManifest().
// No fs / alias imports: the sync script and the site both load this file.

import { SLUG_DATA, type SlugCategory } from "./slug-data";
import { normalizeBanglaText, toUrlSlug } from "./slug";
import { transliterateToSlug } from "./transliterate";
import autoSlugData from "./slug-auto.json";

export type { SlugCategory };
/** Display name -> slug, per category (the shape of slug-data.ts and of _manifest/slugs.json). */
export type SlugTable = Record<SlugCategory, Record<string, string>>;

const CATEGORIES: SlugCategory[] = ["authors", "genres", "series", "tags", "books", "items"];

/** Categories whose unlisted names get a transliterated slug (the others keep their Bengali name as slug). */
const TRANSLITERATED: ReadonlySet<SlugCategory> = new Set<SlugCategory>(["genres", "series", "items"]);

/** Slugs made by transliteration and saved by sync-assets (slug-auto.json); slug-data.ts wins over them. */
const AUTO_SLUGS = autoSlugData as Partial<SlugTable>;

/** slug-data.ts plus slug-auto.json: every name that has a slug already. */
export function registryTable(): SlugTable {
  const table = {} as SlugTable;
  for (const cat of CATEGORIES) table[cat] = { ...(AUTO_SLUGS[cat] || {}), ...SLUG_DATA[cat] };
  return table;
}

/** Slug for a name without a hand-written one: transliterated for genres, series and items, else its Bengali name. */
export function fallbackSlug(category: SlugCategory, name: string): string {
  return (TRANSLITERATED.has(category) ? transliterateToSlug(name) : "") || toUrlSlug(name);
}

interface Lookup {
  slugByName: Map<string, string>; // normalised name -> slug
  nameBySlug: Map<string, string>; // slug -> display name
  slugByNameSlug: Map<string, string>; // slugified name -> slug
}

const nameKey = (name: string): string => normalizeBanglaText(name).trim().toLowerCase();
const slugKey = (slug: string): string => normalizeBanglaText(slug).trim().toLowerCase();

function buildLookup(entries: Record<string, string>): Lookup {
  const lookup: Lookup = { slugByName: new Map(), nameBySlug: new Map(), slugByNameSlug: new Map() };
  for (const [name, rawSlug] of Object.entries(entries)) {
    const slug = toUrlSlug(rawSlug) || toUrlSlug(name);
    if (!name.trim() || !slug) continue;
    const key = nameKey(name);
    if (!lookup.slugByName.has(key)) lookup.slugByName.set(key, slug);
    if (!lookup.nameBySlug.has(slug)) lookup.nameBySlug.set(slug, name.trim());
    const rawNameSlug = toUrlSlug(name);
    if (rawNameSlug && !lookup.slugByNameSlug.has(rawNameSlug)) lookup.slugByNameSlug.set(rawNameSlug, slug);
  }
  return lookup;
}

const buildAll = (table: Partial<SlugTable>): Record<SlugCategory, Lookup> => {
  const out = {} as Record<SlugCategory, Lookup>;
  for (const cat of CATEGORIES) out[cat] = buildLookup(table[cat] || {});
  return out;
};

let lookups = buildAll(registryTable());

/**
 * Replaces the lookups with registry + manifest. The manifest wins on conflicts,
 * so a slug edited in slug-data.ts shows up after the next sync-assets, without a redeploy.
 */
export function setSlugManifest(manifest: Partial<SlugTable> | null | undefined): void {
  if (!manifest) return;
  const merged: Partial<SlugTable> = {};
  const registry = registryTable();
  for (const cat of CATEGORIES) merged[cat] = { ...registry[cat], ...(manifest[cat] || {}) };
  lookups = buildAll(merged);
}

/** Slug written for this name (registry or manifest); undefined if the name is not listed. */
export function findSlug(category: SlugCategory, name: string): string | undefined {
  if (!name) return undefined;
  return lookups[category].slugByName.get(nameKey(name));
}

/** Display name for a slug; undefined if no name has this slug. */
export function findName(category: SlugCategory, slug: string): string | undefined {
  if (!slug) return undefined;
  const l = lookups[category];
  return l.nameBySlug.get(slugKey(slug)) ?? undefined;
}

/** Slug of a name that is written as a slug-ified name (e.g. a Bengali slug); undefined if unknown. */
export function findSlugByNameSlug(category: SlugCategory, nameSlug: string): string | undefined {
  return lookups[category].slugByNameSlug.get(slugKey(nameSlug));
}

/** True when `slug` is a slug in this category. */
export function hasSlug(category: SlugCategory, slug: string): boolean {
  return lookups[category].nameBySlug.has(slugKey(slug));
}

/** The slug of a name: the written one, or the slugified Bengali name when none is written. */
export function slugOf(category: SlugCategory, name: string): string {
  return findSlug(category, name) ?? fallbackSlug(category, name);
}

/**
 * Builds the slug manifest: every registry entry plus every name found in the books.
 * Names that are not in the registry get their own slugified name as slug.
 * `warnings` lists names that share a slug with a different name.
 */
export function buildSlugManifest(
  found: Partial<Record<SlugCategory, Iterable<string>>>,
  extra: Partial<SlugTable> = {}
): {
  manifest: SlugTable;
  warnings: string[];
} {
  const manifest = {} as SlugTable;
  const warnings: string[] = [];
  for (const cat of CATEGORIES) {
    const table: Record<string, string> = {};
    const seenNames = new Map<string, string>(); // name key -> display name
    const owners = new Map<string, string>(); // slug -> display name
    const add = (name: string, slug: string) => {
      const display = name.trim();
      const key = nameKey(display);
      if (!display || seenNames.has(key)) return;
      seenNames.set(key, display);
      const prior = owners.get(slug);
      if (prior && nameKey(prior) !== key) warnings.push(`${cat}: "${display}" and "${prior}" share the slug "${slug}"`);
      else owners.set(slug, display);
      table[display] = slug;
    };
    const listed = registryTable()[cat];
    for (const [name, rawSlug] of Object.entries(listed)) add(name, toUrlSlug(rawSlug) || toUrlSlug(name));
    // `extra`: slugs decided in this run (sync-assets saves them to slug-auto.json)
    for (const [name, rawSlug] of Object.entries(extra[cat] || {})) add(name, toUrlSlug(rawSlug));
    for (const name of found[cat] || []) add(name, fallbackSlug(cat, name));
    manifest[cat] = table;
  }
  return { manifest, warnings };
}
