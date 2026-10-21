// scripts/sync-assets-to-r2.ts
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from 'dotenv';
config({ path: '.env.local' });
import mime from 'mime-types';
import readline from 'readline/promises';
import { buildCatalogFromFiles, type CatalogFile } from '../lib/catalog/build';
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectsCommand,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

// Content may live in a separate repo: point these at its folders with env vars.
const CONTENT_ROOT = process.env.CONTENT_ROOT
  ? path.resolve(process.env.CONTENT_ROOT)
  : path.join(process.cwd(), 'content');
const COVER_ROOT = process.env.COVER_ROOT
  ? path.resolve(process.env.COVER_ROOT)
  : path.join(process.cwd(), 'public', 'cover');
const BUCKET = 'eduliture-assets';

// --dry-run : report only, upload/move/write nothing
// --yes     : skip the confirmation when many files are about to move to the trash
// Files removed locally are never deleted from R2: they are moved to _trash/<timestamp>/<original key>
// (the site never reads _trash/; restore or delete it manually from the Cloudflare dashboard).
const DRY_RUN = process.argv.includes('--dry-run');
const ASSUME_YES = process.argv.includes('--yes');
const TRASH_PREFIX = '_trash/';
// stories/ go to Supabase (eStory, `npm run sync-stories`), not to the bucket
const NOT_FOR_BUCKET_PREFIXES = ['stories/'];
const TRASH_CONFIRM_THRESHOLD = 20;
const BOOKS_MANIFEST_KEY = '_manifest/books-index.json';
const ITEMS_MANIFEST_KEY = '_manifest/items-index.json';
const SLUGS_MANIFEST_KEY = '_manifest/slugs.json';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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

async function uploadIfChanged(
  localPath: string,
  r2Key: string,
  remoteObjects: Map<string, string>
): Promise<{ status: 'uploaded' | 'skipped'; body: Buffer }> {
  const body = await fs.readFile(localPath);
  const localHash = md5(body);
  const remoteHash = remoteObjects.get(r2Key);

  if (remoteHash === localHash) return { status: 'skipped', body };

  if (DRY_RUN) {
    console.log(`📝 Would upload: ${r2Key}`);
    return { status: 'uploaded', body };
  }

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
  const contentFiles = (await walk(CONTENT_ROOT)).filter((file) => {
    const key = path.relative(CONTENT_ROOT, file).replace(/\\/g, '/');
    return !NOT_FOR_BUCKET_PREFIXES.some((prefix) => key.startsWith(prefix));
  });
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
  const catalogFiles: CatalogFile[] = [];

  let uploaded = 0;
  let skipped = 0;

  // ==========================================
  // Step 1: Upload content/ (and remember the book .md files for the manifests)
  // ==========================================
  for (const localPath of contentFiles) {
    const r2Key = path.relative(CONTENT_ROOT, localPath).replace(/\\/g, '/');
    localKeys.add(r2Key);

    const { status, body } = await uploadIfChanged(localPath, r2Key, remoteObjects);
    if (status === 'uploaded') uploaded++;
    else skipped++;

    if (r2Key.startsWith('books/') && r2Key.endsWith('.md')) {
      catalogFiles.push({ key: r2Key, body: body.toString('utf8') });
    }
  }

  // ==========================================
  // Step 2: Upload public/cover/
  // ==========================================
  for (const localPath of coverFiles) {
    const relativePath = path.relative(COVER_ROOT, localPath).replace(/\\/g, '/');
    const r2Key = `cover/${relativePath}`;
    localKeys.add(r2Key);

    const { status } = await uploadIfChanged(localPath, r2Key, remoteObjects);
    if (status === 'uploaded') uploaded++;
    else skipped++;
  }

  // Same builder the local dev server uses, so local and live agree
  const { booksManifest, itemsManifest, slugsManifest, slugWarnings } = buildCatalogFromFiles(catalogFiles);
  const slugCount = Object.values(slugsManifest).reduce((n, table) => n + Object.keys(table).length, 0);
  for (const warning of slugWarnings) console.warn(`⚠️  Slug clash — ${warning}`);

  console.log(`\n✅ Uploaded: ${uploaded}, unchanged (skipped): ${skipped}.`);

  // ==========================================
  // Step 3: Move keys removed locally to _trash/ (never delete)
  // ==========================================
  const keysToTrash: string[] = [];
  for (const remoteKey of remoteObjects.keys()) {
    if (remoteKey === BOOKS_MANIFEST_KEY || remoteKey === ITEMS_MANIFEST_KEY || remoteKey === SLUGS_MANIFEST_KEY) continue;
    if (remoteKey.startsWith(TRASH_PREFIX)) continue;
    if (NOT_FOR_BUCKET_PREFIXES.some((prefix) => remoteKey.startsWith(prefix))) continue; // left as it is
    if (!localKeys.has(remoteKey)) keysToTrash.push(remoteKey);
  }

  if (keysToTrash.length === 0) {
    console.log('\n🗑️ Nothing removed locally — no files to move to the trash.');
  } else {
    console.log(`\n🗑️ ${keysToTrash.length} file(s) exist in R2 but not locally:`);
    keysToTrash.slice(0, 50).forEach((k) => console.log(`   - ${k}`));
    if (keysToTrash.length > 50) console.log(`   ... and ${keysToTrash.length - 50} more`);

    if (DRY_RUN) {
      console.log('   Dry run: they would be moved to the trash, nothing changed.');
    } else {
      let proceed = true;
      if (keysToTrash.length > TRASH_CONFIRM_THRESHOLD && !ASSUME_YES) {
        if (!process.stdin.isTTY) {
          console.log('   Too many files and no terminal to confirm — skipped. Re-run in a terminal, or pass --yes.');
          proceed = false;
        } else {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await rl.question(
            `Move these ${keysToTrash.length} file(s) to ${TRASH_PREFIX}? Type "move" to confirm: `
          );
          rl.close();
          proceed = answer.trim() === 'move';
          if (!proceed) console.log('   Cancelled, nothing moved.');
        }
      }

      if (proceed) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const moved: string[] = [];
        for (const key of keysToTrash) {
          const trashKey = `${TRASH_PREFIX}${stamp}/${key}`;
          const copySource = `${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
          try {
            await s3.send(new CopyObjectCommand({ Bucket: BUCKET, Key: trashKey, CopySource: copySource }));
            moved.push(key);
          } catch (err) {
            // Copy failed: keep the original in place
            console.error(`   ⚠️ Could not copy to trash, left in place: ${key}`, err);
          }
        }
        // Remove the originals only after their copies exist in the trash
        for (let i = 0; i < moved.length; i += 1000) {
          const batch = moved.slice(i, i + 1000);
          await s3.send(
            new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch.map((k) => ({ Key: k })) } })
          );
        }
        console.log(`   Moved ${moved.length}/${keysToTrash.length} file(s) to ${TRASH_PREFIX}${stamp}/`);
      }
    }
  }

  // ==========================================
  // Step 4: Upload both manifests
  // ==========================================
  if (DRY_RUN) {
    console.log(`\n📝 Would write manifests — ${booksManifest.length} books, ${itemsManifest.length} items, ${slugCount} slugs. Dry run finished, nothing changed.`);
    return;
  }

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

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: SLUGS_MANIFEST_KEY,
      Body: Buffer.from(JSON.stringify(slugsManifest, null, 2)),
      ContentType: 'application/json',
    })
  );
  console.log(`✅ Slugs manifest updated — ${slugCount} slugs total.`);

  console.log('\n🎉 Sync complete.');
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});