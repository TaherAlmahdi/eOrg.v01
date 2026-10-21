// Serves book covers from the R2 bucket (cover/ prefix) on media.eduliture.org.
// The Worker route *.eduliture.org/* also catches that host, and since the covers no longer ship
// in public/ (they live in the books repo), this route answers /cover/... straight from R2.
import { NextResponse } from 'next/server';
import { getAssetsBucket } from '@/app/lib/books/r2';

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = `cover/${path.map(decodeURIComponent).join('/')}`;
  if (key.includes('..')) return new NextResponse('Not found', { status: 404 });

  const bucket = await getAssetsBucket();
  const obj = await bucket.get(key);
  if (!obj) return new NextResponse('Not found', { status: 404 });

  const ext = key.split('.').pop()?.toLowerCase() || '';
  const body = await (obj as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
  return new NextResponse(body, {
    headers: {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
