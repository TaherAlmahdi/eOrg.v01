// scripts/sync-stories.ts
//
// Sends the story files (eOrg.v01/content/stories/*.md) to Supabase: stories, people, story_people.
//   npm run sync-stories:dry   show what would change, write nothing
//   npm run sync-stories       write the changes
//
// Rules
// - A story is identified by its file name (stories.source_path). Editing a file updates its row;
//   a title edit changes the slug too (unless the front matter sets `slug`). View counts follow the
//   story id, so they are not affected.
// - Slug: front matter `slug`, else the title as a Bengali slug.
// - Nothing is deleted: a story whose file is gone is set to published = false. Only the
//   story_people rows of a changed story are rewritten.
// - Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from .env.local locally, from
//   secrets in GitHub Actions). STORIES_ROOT is the folder with the .md files.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { customAuthorSlugs } from './stories-slug-map';
import { normalizeBn } from '../app/lib/bn-text';

try {
  process.loadEnvFile('.env.local');
} catch {
  // no .env.local (CI): the variables come from the environment
}

const DRY_RUN = process.argv.includes('--dry-run');
const ASSUME_YES = process.argv.includes('--yes');
const STORIES_ROOT = path.resolve(process.env.STORIES_ROOT || 'content/stories');
const UNPUBLISH_LIMIT = 20;

type Role = 'author' | 'translator' | 'editor';
const ROLES: Role[] = ['author', 'translator', 'editor'];

interface StoryFile {
  sourcePath: string; // "017-story.md"
  fileSlug: string; // "017-story"
  hash: string;
  title: string;
  slug: string;
  row: Record<string, unknown>;
  people: { role: Role; name: string; slug?: string }[];
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function normalizeBengali(text: string): string {
  return normalizeBn(text)
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়');
}

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

/** Same name, same spelling: composed Bengali letters (য + ় = য়) and single spaces. */
const cleanName = (name: string): string => normalizeBengali(name).replace(/s+/g, ' ').trim();

function toList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => String(v).trim()).filter(Boolean);
}

/** Names of people (author, translator, editor) in their one standard spelling. */
const toNames = (value: unknown): string[] => toList(value).map(cleanName);

/**
 * The body is sent exactly as written (only outer whitespace is trimmed): HTML tags and classes,
 * <!--nextpage--> / <!--nextpage Title--> page breaks and [note]...[/note] shortcodes are left for the
 * site to handle. Only a body with none of these (plain text) is wrapped into paragraphs.
 */
function toHtml(body: string): string {
  const text = body.trim();
  if (/<\/?[a-z][\s\S]*?>|<!--|\[note/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function readStoryFiles(): StoryFile[] {
  if (!fs.existsSync(STORIES_ROOT)) fail(`STORIES_ROOT not found: ${STORIES_ROOT}`);
  const names = fs.readdirSync(STORIES_ROOT).filter((f) => f.toLowerCase().endsWith('.md')).sort();
  if (names.length === 0) fail(`No .md files in ${STORIES_ROOT}`);

  return names.map((sourcePath) => {
    const raw = normalizeBn(fs.readFileSync(path.join(STORIES_ROOT, sourcePath), 'utf8'));
    const { data: fm, content } = matter(raw);
    const fileSlug = sourcePath.replace(/\.md$/i, '');
    const title = String(fm.title || '').trim();
    if (!title) fail(`${sourcePath}: the front matter has no title`);

    const slug = toSlug(String(fm.slug || '')) || toSlug(title);
    if (!slug) fail(`${sourcePath}: could not make a slug from "${title}"`);

    const people: StoryFile['people'] = [];
    for (const role of ROLES) {
      const names = toNames(fm[role]);
      const slugs = toList(fm[`${role}_slug`] ?? fm[`${role}Slug`]);
      names.forEach((name, i) => people.push({ role, name, slug: slugs[i] ? toSlug(slugs[i]) : undefined }));
    }

    const date = fm.date ? new Date(String(fm.date)) : null;
    const hash = crypto.createHash('sha1').update(`v2
${raw}`).digest('hex');
    const row: Record<string, unknown> = {
      title,
      subtitle: fm.subtitle ? String(fm.subtitle) : null,
      slug,
      content: toHtml(content),
      author: toNames(fm.author),
      translator: toNames(fm.translator),
      editor: toNames(fm.editor),
      book: fm.book || fm.bookName ? String(fm.book || fm.bookName) : null,
      courtesy: fm.courtesy ? String(fm.courtesy) : null,
      notice: fm.notice ? String(fm.notice) : null,
      og_image: fm.og_image || fm.ogImage ? String(fm.og_image || fm.ogImage) : null,
      description: fm.description || fm.meta_description ? String(fm.description || fm.meta_description) : null,
      tag: toList(fm.tag ?? fm.tags),
      genre: toList(fm.genre),
      story_id: fm.id !== undefined ? String(fm.id) : null,
      source_path: sourcePath,
      content_hash: hash,
      published: true,
    };
    if (date && !Number.isNaN(date.getTime())) row.created_at = date.toISOString();

    return { sourcePath, fileSlug, hash, title, slug, row, people };
  });
}

async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) fail(error.message);
    all.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const files = readStoryFiles();
  console.log(`📚 ${files.length} story file(s) in ${STORIES_ROOT}${DRY_RUN ? ' (dry run)' : ''}`);

  // slugs must be unique among the files
  const bySlug = new Map<string, StoryFile>();
  for (const f of files) {
    const other = bySlug.get(f.slug);
    if (other) {
      fail(`Slug "${f.slug}" is used by both ${other.sourcePath} and ${f.sourcePath}. Set a different \`slug\` in one of them.`);
    }
    bySlug.set(f.slug, f);
  }

  const existing = await fetchAll<{
    id: string;
    source_path: string | null;
    slug: string;
    content_hash: string | null;
    published: boolean;
    title: string;
    author: string[] | null;
    legacy_slug: string | null;
    manual_slug: boolean | null;
  }>((from, to) =>
    supabase
      .from('stories')
      .select('id, source_path, slug, content_hash, published, title, author, legacy_slug, manual_slug')
      .range(from, to)
  );
  const existingByPath = new Map(existing.filter((e) => e.source_path).map((e) => [e.source_path as string, e]));
  // Stories that were already in Supabase before the sync existed (no source_path) are taken over by the
  // file that is the same story (same slug, or same title and author): that row is updated and gets the
  // file as its source_path. Its old slug is kept in legacy_slug so old links still work.
  const personKey = (names: string[] | null | undefined) => (names || []).map((n) => normalizeBengali(n).trim()).join('|');
  const storyKey = (title: string, authors: string[] | null | undefined) => `${normalizeBengali(title).trim()}#${personKey(authors)}`;
  // A file that was renamed (018-story.md -> adab.md) is the same story: its row still points to the old,
  // now missing file, so it is taken over the same way.
  const fileNames = new Set(files.map((f) => f.sourcePath));
  const unclaimed = existing.filter((e) => !e.source_path || !fileNames.has(e.source_path));
  const adoptedBy = new Map<string, (typeof existing)[number]>(); // source_path -> old row
  const claimed = new Set<string>();
  for (const f of files) {
    if (existingByPath.has(f.sourcePath)) continue;
    const bySlug = unclaimed.find((e) => !claimed.has(e.id) && e.slug === f.slug);
    const byTitle = unclaimed.find(
      (e) => !claimed.has(e.id) && storyKey(e.title, e.author) === storyKey(f.title, f.row.author as string[])
    );
    const match = bySlug ?? byTitle;
    if (match) {
      claimed.add(match.id);
      adoptedBy.set(f.sourcePath, match);
    }
  }
  const currentRow = (f: StoryFile) => existingByPath.get(f.sourcePath) ?? adoptedBy.get(f.sourcePath);

  // a slug/title edited in the dashboard (manual_slug) is kept as it is
  for (const f of files) {
    const row = currentRow(f);
    if (row?.manual_slug) {
      f.slug = row.slug;
      f.title = row.title;
      f.row.slug = row.slug;
      f.row.title = row.title;
      bySlug.set(row.slug, f);
    }
  }

  // a slug may not belong to a story that keeps it
  for (const f of files) {
    const holder = existing.find((e) => e.slug === f.slug && e.source_path !== f.sourcePath);
    if (!holder || holder === adoptedBy.get(f.sourcePath)) continue;
    const holderFile = holder.source_path ? files.find((x) => x.sourcePath === holder.source_path) : undefined;
    if (!holderFile || holderFile.slug === holder.slug) {
      fail(`Slug "${f.slug}" of ${f.sourcePath} is already used by another story in Supabase (${holder.source_path ?? holder.id}).`);
    }
  }

  const toInsert = files.filter((f) => !currentRow(f));
  const toUpdate = files.filter((f) => {
    const e = currentRow(f);
    // a story hidden by hand in the dashboard stays hidden until its file changes
    return e && (e.content_hash !== f.hash || e.source_path !== f.sourcePath);
  });
  const toUnpublish = existing.filter((e) => e.source_path && e.published && !fileNames.has(e.source_path) && !claimed.has(e.id));

  const slugChanges = toUpdate.filter((f) => currentRow(f)?.slug !== f.slug);
  console.log(
    `   new: ${toInsert.length}, changed: ${toUpdate.length} (slug changes: ${slugChanges.length}), ` +
      `unchanged: ${files.length - toInsert.length - toUpdate.length}, to hide: ${toUnpublish.length}`
  );
  for (const f of toInsert) console.log(`   + ${f.sourcePath} -> ${f.slug}`);
  for (const f of toUpdate) {
    const row = currentRow(f);
    const old = row?.slug;
    const adopted =
      row && row.source_path !== f.sourcePath
        ? ` (existing story${row.source_path ? `, renamed from ${row.source_path}` : ''}, now tied to this file)`
        : '';
    console.log(`   ~ ${f.sourcePath} -> ${f.slug}${old && old !== f.slug ? ` (was ${old})` : ''}${adopted}`);
  }
  for (const e of toUnpublish) console.log(`   - ${e.source_path} (file gone, will be hidden)`);

  if (toUnpublish.length > UNPUBLISH_LIMIT && !ASSUME_YES && !DRY_RUN) {
    fail(`${toUnpublish.length} stories would be hidden. If that is expected, run again with --yes.`);
  }

  // people: one slug per name, one name per slug
  const wanted = new Map<string, string | undefined>(); // name -> explicit slug
  for (const f of files) {
    for (const p of f.people) {
      if (p.slug && wanted.get(p.name) && wanted.get(p.name) !== p.slug) {
        fail(`"${p.name}" has two different slugs in the files (${wanted.get(p.name)} / ${p.slug}).`);
      }
      if (!wanted.has(p.name) || p.slug) wanted.set(p.name, p.slug);
    }
  }
  const people = await fetchAll<{ id: string; name: string; slug: string }>((from, to) =>
    supabase.from('people').select('id, name, slug').range(from, to)
  );
  // the same person saved twice with different spellings of the name: keep one, move the other's stories to it
  const personByName = new Map<string, (typeof people)[number]>();
  const duplicates: { keep: (typeof people)[number]; dup: (typeof people)[number] }[] = [];
  for (const p of people) {
    const key = cleanName(p.name);
    const kept = personByName.get(key);
    if (!kept) personByName.set(key, p);
    else if (p.name === key && kept.name !== key) {
      personByName.set(key, p);
      duplicates.push({ keep: p, dup: kept });
    } else duplicates.push({ keep: kept, dup: p });
  }
  const dupIds = new Set(duplicates.map((d) => d.dup.id));
  const slugOwner = new Map(people.filter((p) => !dupIds.has(p.id)).map((p) => [p.slug, cleanName(p.name)]));
  const legacySlugs = new Map(Object.entries(customAuthorSlugs).map(([name, slug]) => [cleanName(name), slug]));
  const newPeople: { name: string; slug: string }[] = [];
  const slugUpdates: { id: string; slug: string }[] = [];
  for (const [name, explicit] of wanted) {
    const current = personByName.get(name);
    // new people keep the English slug of the old hand-written map (lib/slug-map.ts) so author links do not change
    const slug = explicit || current?.slug || toSlug(legacySlugs.get(name) || '') || toSlug(name);
    if (!slug) fail(`Could not make a slug for "${name}".`);
    const owner = slugOwner.get(slug);
    if (owner && owner !== name) {
      fail(`People "${name}" and "${owner}" would share the slug "${slug}". Set \`author_slug\` for one of them.`);
    }
    slugOwner.set(slug, name);
    if (!current) newPeople.push({ name, slug });
    else if (current.slug !== slug) slugUpdates.push({ id: current.id, slug });
  }
  console.log(`   people: new ${newPeople.length}, slug changes ${slugUpdates.length}, duplicate spellings to merge ${duplicates.length}`);

  if (DRY_RUN) {
    console.log('\n📝 Dry run finished, nothing was written.');
    return;
  }

  // ---- write
  for (const { keep, dup } of duplicates) {
    const { data: moved, error: movedError } = await supabase.from('story_people').select('story_id, role').eq('person_id', dup.id);
    if (movedError) fail(`merge people: ${movedError.message}`);
    for (const row of moved || []) {
      const { data: same } = await supabase
        .from('story_people')
        .select('story_id')
        .eq('person_id', keep.id)
        .eq('story_id', row.story_id)
        .eq('role', row.role);
      const query = supabase.from('story_people');
      const result = same && same.length > 0
        ? await query.delete().eq('person_id', dup.id).eq('story_id', row.story_id).eq('role', row.role)
        : await query.update({ person_id: keep.id }).eq('person_id', dup.id).eq('story_id', row.story_id).eq('role', row.role);
      if (result.error) fail(`merge people: ${result.error.message}`);
    }
    const del = await supabase.from('people').delete().eq('id', dup.id);
    if (del.error) fail(`merge people: ${del.error.message}`);
    if (keep.name !== cleanName(keep.name)) {
      const ren = await supabase.from('people').update({ name: cleanName(keep.name) }).eq('id', keep.id);
      if (ren.error) fail(`merge people: ${ren.error.message}`);
    }
    console.log(`   merged duplicate person "${dup.name}" into "${cleanName(keep.name)}"`);
  }
  for (let i = 0; i < newPeople.length; i += 200) {
    const { error } = await supabase.from('people').insert(newPeople.slice(i, i + 200));
    if (error) fail(`people insert: ${error.message}`);
  }
  for (const u of slugUpdates) {
    const { error } = await supabase.from('people').update({ slug: u.slug }).eq('id', u.id);
    if (error) fail(`people update: ${error.message}`);
  }
  const allPeople = await fetchAll<{ id: string; name: string }>((from, to) =>
    supabase.from('people').select('id, name').range(from, to)
  );
  const personId = new Map(allPeople.map((p) => [p.name, p.id]));

  const storyIds = new Map<string, string>(); // source_path -> id
  for (const f of files) {
    const row = currentRow(f);
    if (row) storyIds.set(f.sourcePath, row.id);
  }

  for (const f of toInsert) {
    const row = { ...f.row, legacy_slug: f.fileSlug !== f.slug ? f.fileSlug : null };
    const { data, error } = await supabase.from('stories').insert(row).select('id').single();
    if (error) fail(`${f.sourcePath}: insert failed: ${error.message}`);
    storyIds.set(f.sourcePath, data.id);
  }
  for (const f of toUpdate) {
    const old = adoptedBy.get(f.sourcePath);
    // the old live link was the file name (/story/017-story); keep it so it redirects and its views are found
    const oldLink = old && !old.legacy_slug ? (f.fileSlug !== f.slug ? f.fileSlug : old.slug !== f.slug ? old.slug : null) : null;
    const keepOldLink = oldLink ? { legacy_slug: oldLink } : {};
    const { error } = await supabase
      .from('stories')
      .update({ ...f.row, ...keepOldLink })
      .eq('id', storyIds.get(f.sourcePath) as string);
    if (error) fail(`${f.sourcePath}: update failed: ${error.message}`);
  }
  for (const e of toUnpublish) {
    const { error } = await supabase.from('stories').update({ published: false }).eq('source_path', e.source_path as string);
    if (error) fail(`${e.source_path}: hide failed: ${error.message}`);
  }

  // story_people of the new and changed stories
  for (const f of [...toInsert, ...toUpdate]) {
    const id = storyIds.get(f.sourcePath) as string;
    const del = await supabase.from('story_people').delete().eq('story_id', id);
    if (del.error) fail(`${f.sourcePath}: story_people delete: ${del.error.message}`);
    const seen = new Set<string>();
    const rows = f.people.flatMap((p, position) => {
      const pid = personId.get(p.name);
      const k = `${pid}:${p.role}`;
      if (!pid || seen.has(k)) return [];
      seen.add(k);
      return [{ story_id: id, person_id: pid, role: p.role, position }];
    });
    if (rows.length) {
      const ins = await supabase.from('story_people').insert(rows);
      if (ins.error) fail(`${f.sourcePath}: story_people insert: ${ins.error.message}`);
    }
  }

  console.log('\n🎉 Stories synced.');
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
