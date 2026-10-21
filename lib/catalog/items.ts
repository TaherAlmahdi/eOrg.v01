// lib/catalog/items.ts
import { getItemMeta } from '@/app/lib/content/core/registry/items';
import { getItemEntries } from './entries';

export interface ItemTypeSummary {
  slug: string;
  label: string;
  count: number; // number of distinct .md files carrying this item type
}

export interface ItemTypeOptions {
  subdomain?: string;
  authorSlug?: string;
}

/**
 * Item types (প্রকরণ) with the number of pieces in each.
 * Source: the `item` frontmatter of every .md file in the book folders
 * (via the R2 items manifest). The slug/label come from the item registry,
 * so aliases of the same type collapse into one entry.
 */
export async function getItemTypeSummaries(
  options: ItemTypeOptions = {}
): Promise<ItemTypeSummary[]> {
  const { subdomain, authorSlug } = options;
  const entries = await getItemEntries(subdomain);
  const author = authorSlug && authorSlug !== 'library' ? authorSlug.toLowerCase() : '';

  const files = new Map<string, Set<string>>(); // slug -> distinct r2Keys
  const labels = new Map<string, string>();

  for (const entry of entries) {
    if (author && String(entry.authorSlug || '').toLowerCase() !== author) continue;

    const name = String(entry.itemType || '').trim();
    if (!name) continue;

    const meta = getItemMeta(name);
    if (!meta.slug) continue;

    if (!files.has(meta.slug)) {
      files.set(meta.slug, new Set());
      labels.set(meta.slug, meta.name || name);
    }
    files.get(meta.slug)!.add(entry.r2Key);
  }

  return Array.from(files, ([slug, keys]) => ({
    slug,
    label: labels.get(slug) || slug,
    count: keys.size,
  }));
}
