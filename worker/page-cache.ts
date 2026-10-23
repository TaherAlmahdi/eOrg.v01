// worker/page-cache.ts
//
// Caches rendered pages of the book library in Cloudflare's per-colo cache (Cache API).
// The cache key contains the version of the R2 manifests and the build stamp, so:
//  - after `sync-assets` rewrites the manifests, the next request misses and renders fresh (new books show up
//    within MANIFEST_VERSION_TTL_MS), and
//  - without a sync the same page is served from the cache for days, with no R2 reads and no rendering.
// Off unless the PAGE_CACHE variable is "on" (wrangler.jsonc `vars`). Any error falls back to the normal response.

import { BUILD_STAMP } from './build-stamp';

export interface PageCacheEnv {
  ASSETS_BUCKET: R2Bucket;
  PAGE_CACHE?: string;
}

interface Handler<Env> {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> | Response;
}

const MANIFEST_KEYS = ['_manifest/books-index.json', '_manifest/items-index.json', '_manifest/slugs.json'];
const MANIFEST_VERSION_TTL_MS = 15_000;
const BROWSER_CACHE_CONTROL = 'public, max-age=0, must-revalidate';
const CACHE_SECONDS = 7 * 24 * 60 * 60;
// Pages that only change when the books change. Not "/" (home shows view-based popular books) and not /api.
const CACHEABLE_PREFIXES = ['/book/', '/books', '/item/', '/items', '/genre/', '/genres', '/series', '/author/', '/authors'];

// Cloudflare Workers expose a default cache next to the named ones
const defaultCache = (): Cache => (caches as unknown as { default: Cache }).default;

let versionCache: { value: string; at: number } | null = null;

/** ETags of the manifests, joined; changes whenever sync-assets rewrites one of them. */
async function manifestVersion(bucket: R2Bucket): Promise<string | null> {
  if (versionCache && Date.now() - versionCache.at < MANIFEST_VERSION_TTL_MS) return versionCache.value;
  const heads = await Promise.all(MANIFEST_KEYS.map((key) => bucket.head(key)));
  if (heads.some((head) => !head)) return null; // a manifest is missing: do not cache
  const value = heads.map((head) => head!.etag).join('.');
  versionCache = { value, at: Date.now() };
  return value;
}

const SITEMAP_PATH = '/sitemap.xml'; // listing every chapter reads the whole R2 key list, so it is worth caching

function isCacheableRequest(request: Request, url: URL): boolean {
  if (request.method !== 'GET') return false;
  if (request.headers.has('range') || request.headers.has('authorization')) return false;
  // Next.js client navigations and prefetches (RSC payloads) are not documents
  if (request.headers.has('rsc') || request.headers.has('next-router-prefetch') || request.headers.has('next-action')) return false;
  if (url.searchParams.has('_rsc')) return false;
  if (url.pathname === SITEMAP_PATH) return true;
  if (!(request.headers.get('accept') || '').includes('text/html')) return false;
  return CACHEABLE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix));
}

export function withPageCache<Env extends PageCacheEnv>(inner: Handler<Env>): Handler<Env> {
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      if (env.PAGE_CACHE !== 'on' || !isCacheableRequest(request, url)) return inner.fetch(request, env, ctx);

      let cacheKey: Request;
      try {
        const version = await manifestVersion(env.ASSETS_BUCKET);
        if (!version) return inner.fetch(request, env, ctx);
        const keyUrl = new URL(url.toString());
        keyUrl.searchParams.set('__pc', `${BUILD_STAMP}.${version}`);
        cacheKey = new Request(keyUrl.toString());
        const hit = await defaultCache().match(cacheKey);
        if (hit) {
          const response = new Response(hit.body, hit);
          // The long max-age is for this cache only; browsers must ask again, or a new book would not show up
          response.headers.set('Cache-Control', BROWSER_CACHE_CONTROL);
          response.headers.set('x-page-cache', 'HIT');
          return response;
        }
      } catch (err) {
        console.error('page cache lookup failed:', err);
        return inner.fetch(request, env, ctx);
      }

      const response = await inner.fetch(request, env, ctx);
      const contentType = response.headers.get('content-type') || '';
      const isCacheableType = contentType.includes(url.pathname === SITEMAP_PATH ? 'xml' : 'text/html');
      if (response.status !== 200 || !isCacheableType || response.headers.has('set-cookie')) return response;

      const stored = new Response(response.clone().body, response);
      stored.headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      stored.headers.set('x-page-cache', 'STORED');
      ctx.waitUntil(defaultCache().put(cacheKey, stored).catch((err: unknown) => console.error('page cache store failed:', err)));

      const out = new Response(response.body, response);
      out.headers.set('x-page-cache', 'MISS');
      return out;
    },
  };
}
