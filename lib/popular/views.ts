// lib/popular/views.ts
// View counter on Cloudflare D1 (binding "DB"). Everything degrades to a no-op when the
// binding is missing, so the site works before D1 is created.
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
}
interface D1Like {
  prepare(query: string): D1Statement;
}

async function getDb(): Promise<D1Like | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { DB?: D1Like }).DB ?? null;
  } catch {
    return null; // local dev without the Cloudflare context
  }
}

/** Atomic +1 for a book. Returns false when D1 is not available. */
export async function recordBookView(slug: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .prepare(
      `INSERT INTO book_views (slug, views, updated_at) VALUES (?1, 1, ?2)
       ON CONFLICT(slug) DO UPDATE SET views = views + 1, updated_at = ?2`
    )
    .bind(slug, Math.floor(Date.now() / 1000))
    .run();
  return true;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // home page reads D1 at most once per isolate per 10 minutes
let cache: { at: number; limit: number; slugs: string[] } | null = null;

/** Slugs of the most viewed books, most viewed first. Empty when D1 is missing or has no data. */
export async function getPopularSlugs(limit = 16): Promise<string[]> {
  if (cache && cache.limit >= limit && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.slugs.slice(0, limit);
  }

  const db = await getDb();
  if (!db) return [];

  try {
    const { results } = await db
      .prepare('SELECT slug FROM book_views WHERE views > 0 ORDER BY views DESC, updated_at DESC LIMIT ?1')
      .bind(limit)
      .all<{ slug: string }>();
    const slugs = results.map((row) => row.slug);
    cache = { at: Date.now(), limit, slugs };
    return slugs;
  } catch (err) {
    console.error('popular books query failed:', err);
    return [];
  }
}
