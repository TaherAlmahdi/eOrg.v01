import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // ১. সাবডোমেন এক্সট্র্যাক্ট করা
  const currentHost = hostname
    .replace('.localhost:3000', '')
    .replace('.eduliture.org', '');

  // ২. মূল ডোমেন চেক
  const isMainDomain =
    currentHost === 'localhost:3000' ||
    currentHost === 'eduliture' ||
    currentHost === '';

  if (isMainDomain) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);

  // হেডার ও ক্যোয়ারি প্যারাম সেট করা
  requestHeaders.set('x-subdomain', currentHost);
  url.searchParams.set('subdomain', currentHost);

  // ৩. ডাইনামিক পাথম্যাপিং (লাইব্রেরি নাকি অথর সাবডোমেন)
  const pathname = url.pathname;

  if (currentHost === 'library') {
    // library.eduliture.org/genre/novel -> /subdomains/library/genre/novel
    url.pathname = `/subdomains/library${pathname === '/' ? '' : pathname}`;
  } else {
    // bankim.eduliture.org/genre/novel -> /subdomains/author/bankim/genre/novel
    url.pathname = `/subdomains/author/${currentHost}${pathname === '/' ? '' : pathname}`;
  }

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|favicon|sw.js|.*\\.(?:ico|png|webp|svg|jpg|jpeg|gif)$).*)',
  ],
};