// Dev-only: serves covers from the books folder (COVER_ROOT) so unsynced covers show locally.
// In production builds the branch below is removed and the route always answers 404.
import { NextResponse } from 'next/server';

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === 'development' && process.env.COVER_ROOT) {
    const { path } = await params;
    const { readLocalCover } = await import('@/lib/catalog/local-provider');
    const data = await readLocalCover(path.map(decodeURIComponent).join('/'));
    if (data) {
      const ext = path[path.length - 1].split('.').pop()?.toLowerCase() || '';
      return new NextResponse(new Uint8Array(data), {
        headers: { 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' },
      });
    }
  }
  return new NextResponse('Not found', { status: 404 });
}
