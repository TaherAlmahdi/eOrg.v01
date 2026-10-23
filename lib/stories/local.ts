// lib/stories/local.ts
// Reads the stories straight from content/stories/*.md (this repo is the local writing room, so
// there is no Supabase here). Slug, people and ordering follow scripts/sync-stories.ts, so a story
// looks here the way it will look on the live site after `npm run sync-stories`.
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { customAuthorSlugs } from '@/scripts/stories-slug-map';
import { normalizeBn } from '@/app/lib/bn-text';

export type PersonRole = 'author' | 'translator' | 'editor';

export interface StoryRow {
  uuid: string;
  slug: string;
  legacySlug: string | null;
  title: string;
  subtitle: string | null;
  content: string; // HTML ('' in lists)
  author: string[];
  translator: string[];
  editor: string[];
  book: string | null;
  courtesy: string | null;
  notice: string | null;
  ogImage: string | null;
  description: string | null;
  tag: string[];
  genre: string[];
  storyId: string | null;
  date: string;
  views: number;
  /** name -> person slug for everyone credited on this story */
  peopleSlugs: Record<string, string>;
}

const storiesRoot = () => path.resolve(process.env.STORIES_ROOT || 'content/stories');

const normalizeBengali = (text: string): string =>
  normalizeBn(text)
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়');

/** Lower-case URL slug; Bengali letters are kept ("মেঘ বৃষ্টি" -> "মেঘ-বৃষ্টি"). */
function toSlug(text: string): string {
  return normalizeBengali(String(text))
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/[^ঀ-৿a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const cleanName = (name: string): string => normalizeBengali(name).replace(/\s+/g, ' ').trim();

function toList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => String(v).trim()).filter(Boolean);
}

const toNames = (value: unknown): string[] => toList(value).map(cleanName);

/** The body as written; only a body without any HTML, page break or [note] is wrapped into paragraphs. */
function toHtml(body: string): string {
  const text = body.trim();
  if (/<\/?[a-z][\s\S]*?>|<!--|\[note/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

const legacyAuthorSlugs = new Map(Object.entries(customAuthorSlugs).map(([name, slug]) => [cleanName(name), slug]));

function parseStory(fileName: string, raw: string): StoryRow | null {
  const { data: fm, content } = matter(raw);
  const title = String(fm.title || '').trim();
  const fileSlug = fileName.replace(/\.md$/i, '');
  const slug = toSlug(String(fm.slug || '')) || toSlug(title);
  if (!title || !slug) return null;

  const roles = {
    author: toNames(fm.author),
    translator: toNames(fm.translator),
    editor: toNames(fm.editor),
  };
  const peopleSlugs: Record<string, string> = {};
  (Object.keys(roles) as PersonRole[]).forEach((role) => {
    const explicit = toList(fm[`${role}_slug`] ?? fm[`${role}Slug`]);
    roles[role].forEach((name, i) => {
      peopleSlugs[name] = (explicit[i] && toSlug(explicit[i])) || toSlug(legacyAuthorSlugs.get(name) || '') || toSlug(name);
    });
  });

  const date = fm.date ? new Date(String(fm.date)) : null;
  const og = fm.og_image || fm.ogImage;
  const description = fm.description || fm.meta_description;

  return {
    uuid: fileSlug,
    slug,
    legacySlug: fileSlug !== slug ? fileSlug : null,
    title,
    subtitle: fm.subtitle ? String(fm.subtitle) : null,
    content: toHtml(content),
    ...roles,
    book: fm.book || fm.bookName ? String(fm.book || fm.bookName) : null,
    courtesy: fm.courtesy ? String(fm.courtesy) : null,
    notice: fm.notice ? String(fm.notice) : null,
    ogImage: og ? String(og) : null,
    description: description ? String(description) : null,
    tag: toList(fm.tag ?? fm.tags),
    genre: toList(fm.genre),
    storyId: fm.id !== undefined ? String(fm.id) : null,
    date: date && !Number.isNaN(date.getTime()) ? date.toISOString() : '',
    views: 0,
    peopleSlugs,
  };
}

// Per-file cache keyed by mtime: after the first read only edited files are parsed again.
const fileCache = new Map<string, { mtimeMs: number; row: StoryRow | null }>();

/** All stories with their HTML body, newest id first (same order as the live list). */
async function readAll(): Promise<StoryRow[]> {
  const root = storiesRoot();
  let names: string[] = [];
  try {
    names = (await fs.readdir(root)).filter((f) => f.toLowerCase().endsWith('.md')).sort();
  } catch {
    return [];
  }

  const rows: StoryRow[] = [];
  for (const name of names) {
    const file = path.join(root, name);
    const { mtimeMs } = await fs.stat(file);
    let cached = fileCache.get(file);
    if (!cached || cached.mtimeMs !== mtimeMs) {
      cached = { mtimeMs, row: parseStory(name, normalizeBn(await fs.readFile(file, 'utf8'))) };
      fileCache.set(file, cached);
    }
    if (cached.row) rows.push(cached.row);
  }

  rows.sort((a, b) => {
    if (a.storyId && b.storyId) return b.storyId.localeCompare(a.storyId, undefined, { numeric: true });
    if (a.storyId) return -1;
    if (b.storyId) return 1;
    return a.slug.localeCompare(b.slug, 'bn');
  });
  return rows;
}

/** The list view leaves out the body, like the Supabase list. */
export async function listStoryRows(): Promise<StoryRow[]> {
  return (await readAll()).map((row) => ({ ...row, content: '' }));
}

/** The slug as written, percent-decoded, and with composed Bengali letters. */
function slugVariants(slug: string): string[] {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // keep the raw value
  }
  return Array.from(new Set([slug, decoded, normalizeBengali(decoded)]));
}

/** One story with its HTML body; null if the slug is unknown. */
export async function getStoryRow(slug: string): Promise<StoryRow | null> {
  const wanted = slugVariants(slug);
  return (await readAll()).find((row) => wanted.includes(row.slug)) ?? null;
}

/** Current slug of a story that is still linked by its file name. */
export async function findSlugByLegacy(legacySlug: string): Promise<string | null> {
  const wanted = slugVariants(legacySlug);
  return (await readAll()).find((row) => row.legacySlug && wanted.includes(row.legacySlug))?.slug ?? null;
}
