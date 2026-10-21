// app/api/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookEntries } from '@/lib/catalog';
import { recordBookView } from '@/lib/popular/views';

export const dynamic = 'force-dynamic';

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless/i;

// Counts one view for an existing book. The client sends at most one request per book per day.
export async function POST(request: NextRequest) {
  if (BOT_PATTERN.test(request.headers.get('user-agent') || '')) {
    return new NextResponse(null, { status: 204 });
  }

  let slug = '';
  try {
    const body = (await request.json()) as { slug?: unknown };
    slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!slug || slug.length > 120) return new NextResponse(null, { status: 400 });

  // Only real books are counted, so random slugs cannot fill the table
  const books = await getBookEntries();
  const match = books.find((b) => b.bookFolder.trim().toLowerCase() === slug);
  if (!match) return new NextResponse(null, { status: 404 });

  try {
    await recordBookView(match.bookFolder.trim());
  } catch (err) {
    console.error('recording book view failed:', err);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
