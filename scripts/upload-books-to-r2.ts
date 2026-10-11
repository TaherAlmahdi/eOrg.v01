// scripts/upload-books-to-r2.ts
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';
config({ path: '.env.local' });
import matter from 'gray-matter';
import mime from 'mime-types';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'books'); // 🔹 Your local content folder
const BOOKS_BUCKET = 'books';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadFile(localPath: string, r2Key: string) {
  const body = await fs.readFile(localPath);
  const contentType = mime.lookup(localPath) || 'text/markdown';

  await s3.send(
    new PutObjectCommand({
      Bucket: BOOKS_BUCKET,
      Key: r2Key,
      Body: body,
      ContentType: contentType,
    })
  );
  console.log(`✅ Uploaded: ${r2Key}`);
}

// 🔹 Recursively finds all .md files inside the content/ folder
async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

interface ManifestEntry {
  authorFolder: string;
  bookFolder: string;
  bookPrefix: string;
  data: Record<string, any>;
}

async function main() {
  const allMdFiles = await walk(CONTENT_ROOT);
  console.log(`Found ${allMdFiles.length} markdown files.`);

  const manifest: ManifestEntry[] = [];

  for (const localPath of allMdFiles) {
    const relativePath = path.relative(CONTENT_ROOT, localPath).replace(/\\/g, '/');
    // relativePath e.g.: "bankim/durgeshnandini/index.md" or "bankim/durgeshnandini/vol1/chapter1.md"
    const r2Key = relativePath; // 🔹 No leading slash or prefix — goes straight to the bucket root

    await uploadFile(localPath, r2Key);

    // Only build a manifest entry from each book's main index.md
    if (path.basename(localPath) === 'index.md') {
      const parts = relativePath.split('/');
      const authorFolder = parts[0];
      const bookFolder = parts[1];
      const bookPrefix = `${authorFolder}/${bookFolder}/`; // 🔹 No leading slash here either

      const raw = await fs.readFile(localPath, 'utf8');
      const { data } = matter(raw);

      manifest.push({ authorFolder, bookFolder, bookPrefix, data });
    }
  }

  // 🔹 Build manifest.json and upload it to R2
  const manifestBody = Buffer.from(JSON.stringify(manifest, null, 2));
  await s3.send(
    new PutObjectCommand({
      Bucket: BOOKS_BUCKET,
      Key: '_manifest/books-index.json',
      Body: manifestBody,
      ContentType: 'application/json',
    })
  );

  console.log(`\n✅ Manifest uploaded — ${manifest.length} books total.`);
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});