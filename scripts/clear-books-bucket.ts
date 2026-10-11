// scripts/clear-books-bucket.ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

const BOOKS_BUCKET = 'books';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function clearBucket() {
  let continuationToken: string | undefined = undefined;
  let totalDeleted = 0;

  do {
    const listResult: ListObjectsV2CommandOutput = await s3.send(
  new ListObjectsV2Command({
    Bucket: BOOKS_BUCKET,
    ContinuationToken: continuationToken,
  })

    );

    const objects = listResult.Contents || [];
    if (objects.length === 0) break;

    // DeleteObjectsCommand একবারে সর্বোচ্চ ১০০০টা key নেয়
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BOOKS_BUCKET,
        Delete: {
          Objects: objects.map((obj) => ({ Key: obj.Key! })),
        },
      })
    );

    totalDeleted += objects.length;
    console.log(`🗑️ মুছে ফেলা হয়েছে: ${totalDeleted}`);

    continuationToken = listResult.NextContinuationToken;
  } while (continuationToken);

  console.log(`\n✅ সম্পূর্ণ — মোট ${totalDeleted}টা ফাইল মুছে ফেলা হয়েছে।`);
}

clearBucket().catch((err) => {
  console.error('❌ ডিলিট ব্যর্থ:', err);
  process.exit(1);
});