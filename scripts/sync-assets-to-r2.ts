// scripts/sync-assets-to-r2.ts
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from 'dotenv';
config({ path: '.env.local' });
import matter from 'gray-matter';
import mime from 'mime-types';
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectsCommand,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const COVER_ROOT = path.join(process.cwd(), 'public', 'cover');
const BUCKET = 'eduliture-assets';
const BOOKS_MANIFEST_KEY = '_manifest/books-index.json';
const ITEMS_MANIFEST_KEY = '_manifest/items-index.json';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ==========================================
// Item-slug helpers
// ==========================================
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF-]+/g, '')
    .replace(/--+/g, '-');
}

const ITEM_SLUG_MAP: Record<string, string> = {
  'গল্প': 'story',
  'ছোটগল্প': 'story',
  'কবিতা': 'poem',
  'প্রবন্ধ': 'essay',
  'উপন্যাস': 'novel',
  'নাটক': 'drama',
  'অনুবাদ': 'translation',
};

function getItemSlug(itemType: string): string {
  const clean = itemType.trim();
  if (ITEM_SLUG_MAP[clean]) return ITEM_SLUG_MAP[clean];
  return slugify(clean);
}

function parseItemName(itemVal: any): string {
  if (!itemVal) return '';
  if (typeof itemVal === 'string') return itemVal.trim();
  if (typeof itemVal === 'object') {
    return (itemVal.name || itemVal.title || itemVal.label || '').trim();
  }
  return String(itemVal).trim();
}

function extractItemTypesFromData(data: Record<string, any>): string[] {
  const rawItem = data.item || data.items;
  if (!rawItem) return [];
  if (Array.isArray(rawItem)) {
    return rawItem.map(parseItemName).filter(Boolean);
  }
  const parsed = parseItemName(rawItem);
  return parsed ? [parsed] : [];
}

// ==========================================
// File-scanning helpers
// ==========================================
async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function md5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

async function listRemoteObjects(): Promise<Map<string, string>> {
  const remoteMap = new Map<string, string>();
  let continuationToken: string | undefined = undefined;

  do {
    const listResult: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: continuationToken })
    );
    for (const obj of listResult.Contents || []) {
      if (!obj.Key) continue;
      const etag = (obj.ETag || '').replace(/"/g, '');
      remoteMap.set(obj.Key, etag);
    }
    continuationToken = listResult.NextContinuationToken;
  } while (continuationToken);

  return remoteMap;
}

interface BookManifestEntry {
  authorFolder: string;
  bookFolder: string;
  bookPrefix: string;
  data: Record<string, any>;
}

interface ItemManifestEntry {
  itemType: string;
  itemTypeSlug: string;
  title: string;
  slug?: string;
  titleSlug: string;
  bookTitle: string;
  bookSlug: string;
  author: string;
  authorSlug: string;
  href: string;
  r2Key: string;
  frontmatter: Record<string, any>;
}

async function uploadIfChanged(
  localPath: string,
  r2Key: string,
  remoteObjects: Map<string, string>
): Promise<{ status: 'uploaded' | 'skipped'; body: Buffer }> {
  const body = await fs.readFile(localPath);
  const localHash = md5(body);
  const remoteHash = remoteObjects.get(r2Key);

  if (remoteHash === localHash) return { status: 'skipped', body };

  const contentType = mime.lookup(localPath) || 'application/octet-stream';
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: r2Key, Body: body, ContentType: contentType })
  );
  console.log(`⬆️  Uploaded: ${r2Key}`);
  return { status: 'uploaded', body };
}

async function main() {
  console.log('🔍 Loading the current R2 status...');
  const remoteObjects = await listRemoteObjects();
  console.log(`R2 currently has ${remoteObjects.size} keys.`);

  console.log('🔍 Scanning local content/ and public/cover/ directories...');
  const contentFiles = await walk(CONTENT_ROOT);
  const coverFiles = await walk(COVER_ROOT);
  console.log(`Found ${contentFiles.length} files in content/, ${coverFiles.length} files in public/cover/.`);

  // 🛡️ Safety guard: stop if a source folder unexpectedly scans as empty
  // (protects against accidentally deleting an entire prefix due to a wrong path
  // or a transient filesystem issue)
  if (contentFiles.length === 0) {
    console.error('❌ No files found in content/ — the path may be wrong. Stopping, nothing will be deleted.');
    process.exit(1);
  }
  if (coverFiles.length === 0) {
    console.error('❌ No files found in public/cover/ — the path may be wrong. Stopping, nothing will be deleted.');
    process.exit(1);
  }

  const localKeys = new Set<string>();
  const booksManifest: BookManifestEntry[] = [];
  // bookPrefix → core book info (needed when building the items manifest)
  const bookMetaByPrefix = new Map<
    string,
    { bookTitle: string; bookSlug: string; author: string; authorSlug: string }
  >();

  let uploaded = 0;
  let skipped = 0;

  // ==========================================
  // Step 1: Upload content/ + build the books manifest
  // ==========================================
  // Process all index.md files first (so bookMetaByPrefix is populated before item files)
  const indexMdFiles = contentFiles.filter((f) => path.basename(f) === 'index.md');
  const otherFiles = contentFiles.filter((f) => path.basename(f) !== 'index.md');

  for (const localPath of indexMdFiles) {
    const relativePath = path.relative(CONTENT_ROOT, localPath).replace(/\\/g, '/');
    const r2Key = relativePath;
    localKeys.add(r2Key);

    const { status, body } = await uploadIfChanged(localPath, r2Key, remoteObjects);
    status === 'uploaded' ? uploaded++ : skipped++;

    const parts = relativePath.split('/');
    if (parts[0] === 'books' && parts.length === 4) {
      const authorFolder = parts[1];
      const bookFolder = parts[2];
      const bookPrefix = `books/${authorFolder}/${bookFolder}/`;
      const { data } = matter(body.toString('utf8'));

      booksManifest.push({ authorFolder, bookFolder, bookPrefix, data });
      bookMetaByPrefix.set(bookPrefix, {
        bookTitle: data.title || bookFolder,
        bookSlug: data.slug ? String(data.slug).trim() : bookFolder,
        author: data.author || 'Unknown author',
        authorSlug: data.authorSlug ? String(data.authorSlug).trim() : authorFolder,
      });
    }
  }

  // ==========================================
  // Step 2: Upload the remaining files + build the items manifest
  // ==========================================
  const itemsManifest: ItemManifestEntry[] = [];

  for (const localPath of otherFiles) {
    const relativePath = path.relative(CONTENT_ROOT, localPath).replace(/\\/g, '/');
    const r2Key = relativePath;
    localKeys.add(r2Key);

    const { status, body } = await uploadIfChanged(localPath, r2Key, remoteObjects);
    status === 'uploaded' ? uploaded++ : skipped++;

    // Only check for items in .md files under the books/ prefix
    if (!relativePath.startsWith('books/') || !relativePath.endsWith('.md')) continue;

    const parts = relativePath.split('/');
    if (parts.length < 3) continue;
    const bookPrefix = `books/${parts[1]}/${parts[2]}/`;
    const bookMeta = bookMetaByPrefix.get(bookPrefix);
    if (!bookMeta) continue; // this book's index.md wasn't found

    const { data: fileData } = matter(body.toString('utf8'));
    const itemTypes = extractItemTypesFromData(fileData);
    if (itemTypes.length === 0) continue;

    const fileName = path.basename(localPath, '.md');
    const itemTitle = fileData.item_title || fileData.title || fileName;
    const rawFrontmatterSlug = fileData.slug ? String(fileData.slug).trim() : undefined;
    const titleSlug = rawFrontmatterSlug || slugify(itemTitle) || fileName;

    for (const type of itemTypes) {
      const itemTypeSlug = getItemSlug(type);
      const href = `/items/${itemTypeSlug}/${encodeURIComponent(titleSlug)}`;

      itemsManifest.push({
        itemType: type,
        itemTypeSlug,
        title: itemTitle,
        slug: rawFrontmatterSlug,
        titleSlug,
        bookTitle: bookMeta.bookTitle,
        bookSlug: bookMeta.bookSlug,
        author: bookMeta.author,
        authorSlug: bookMeta.authorSlug,
        href,
        r2Key,
        frontmatter: fileData,
      });
    }
  }

  itemsManifest.sort((a, b) => a.title.localeCompare(b.title, 'bn'));

  // ==========================================
  // Step 3: Upload public/cover/
  // ==========================================
  for (const localPath of coverFiles) {
    const relativePath = path.relative(COVER_ROOT, localPath).replace(/\\/g, '/');
    const r2Key = `cover/${relativePath}`;
    localKeys.add(r2Key);

    const { status } = await uploadIfChanged(localPath, r2Key, remoteObjects);
    status === 'uploaded' ? uploaded++ : skipped++;
  }

  console.log(`\n✅ Uploaded: ${uploaded}, unchanged (skipped): ${skipped}.`);

  // ==========================================
  // Step 4: Delete orphaned keys
  // ==========================================
  const keysToDelete: string[] = [];
  for (const remoteKey of remoteObjects.keys()) {
    if (remoteKey === BOOKS_MANIFEST_KEY || remoteKey === ITEMS_MANIFEST_KEY) continue;
    if (!localKeys.has(remoteKey)) {
      keysToDelete.push(remoteKey);
    }
  }

  if (keysToDelete.length > 0) {
    console.log(`\n🗑️ Deleting ${keysToDelete.length} orphaned key(s)...`);
    for (let i = 0; i < keysToDelete.length; i += 1000) {
      const batch = keysToDelete.slice(i, i + 1000);
      await s3.send(
        new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch.map((k) => ({ Key: k })) } })
      );
      console.log(`   Deleted: ${Math.min(i + 1000, keysToDelete.length)}/${keysToDelete.length}`);
    }
  } else {
    console.log('\n🗑️ No orphaned keys found to delete.');
  }

  // ==========================================
  // Step 5: Upload both manifests
  // ==========================================
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: BOOKS_MANIFEST_KEY,
      Body: Buffer.from(JSON.stringify(booksManifest, null, 2)),
      ContentType: 'application/json',
    })
  );
  console.log(`\n✅ Books manifest updated — ${booksManifest.length} books total.`);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: ITEMS_MANIFEST_KEY,
      Body: Buffer.from(JSON.stringify(itemsManifest, null, 2)),
      ContentType: 'application/json',
    })
  );
  console.log(`✅ Items manifest updated — ${itemsManifest.length} items total.`);

  console.log('\n🎉 Sync complete.');
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});