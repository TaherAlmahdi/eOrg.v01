// scripts/optimize-images.ts
// Shrinks the heavy site images in public/ with sharp.
//   npm run optimize-images            -> optimize every entry in JOBS below
//   npm run optimize-images -- <path>  -> optimize one file (PNG/JPG -> same-name .webp, max 1600px wide)
// Originals are never overwritten unless `inPlace` is set; run it again after adding new heavy images.
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

interface Job {
  input: string;
  output: string; // same as input = rewrite in place
  maxWidth: number;
  format: 'webp' | 'png';
  animated?: boolean;
  quality?: number;
}

const PUBLIC = path.join(process.cwd(), 'public');

const JOBS: Job[] = [
  { input: 'lighted-candle.gif', output: 'lighted-candle.webp', maxWidth: 800, format: 'webp', animated: true, quality: 70 },
  { input: '404.gif', output: '404.webp', maxWidth: 509, format: 'webp', animated: true, quality: 75 },
  { input: 'bg01.png', output: 'bg01.webp', maxWidth: 1920, format: 'webp', quality: 75 },
  { input: 'btree.png', output: 'btree.webp', maxWidth: 640, format: 'webp', quality: 80 },
  // Site logos are shown small and also used by the OG image renderer (needs PNG): shrink in place
  ...['logo', 'elogo', 'bankim', 'jibanananda', 'library', 'nazrul', 'rabindra', 'sarat', 'vidyasagar'].map(
    (name): Job => ({ input: `logo/${name}.png`, output: `logo/${name}.png`, maxWidth: 512, format: 'png', quality: 90 })
  ),
];

async function run(job: Job) {
  const inputPath = path.join(PUBLIC, job.input);
  const outputPath = path.join(PUBLIC, job.output);
  const before = (await fs.stat(inputPath)).size;

  let pipeline = sharp(inputPath, { animated: job.animated === true }).resize({
    width: job.maxWidth,
    withoutEnlargement: true,
  });
  pipeline =
    job.format === 'webp'
      ? pipeline.webp({ quality: job.quality ?? 80, effort: 4 })
      : pipeline.png({ palette: true, quality: job.quality ?? 90 });

  const buffer = await pipeline.toBuffer();
  if (inputPath === outputPath && buffer.length >= before) {
    console.log(`= ${job.input}: already small (${Math.round(before / 1024)} KB), skipped`);
    return;
  }
  await fs.writeFile(outputPath, buffer);
  console.log(`✓ ${job.output}: ${Math.round(before / 1024)} KB -> ${Math.round(buffer.length / 1024)} KB`);
}

async function main() {
  const arg = process.argv[2];
  if (arg) {
    const rel = path.relative(PUBLIC, path.resolve(arg)).split(path.sep).join('/');
    await run({ input: rel, output: rel.replace(/\.\w+$/, '.webp'), maxWidth: 1600, format: 'webp' });
    return;
  }
  for (const job of JOBS) await run(job);
}

main().catch((err) => {
  console.error('❌ optimize-images failed:', err);
  process.exit(1);
});
