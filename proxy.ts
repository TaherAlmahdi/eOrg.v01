// proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';



const ALLOWED_SUBDOMAINS = new Set([
  'library',
  'vidyasagar',
  'bankim',
  'rabindra',
  'nazrul',
  'sarat',
  'jibananda',
  'sukanta',
]);

export default function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  const hostWithoutPort = hostname.split(':')[0];
  const parts = hostWithoutPort.split('.');

  let subdomain: string | null = null;

  if (hostWithoutPort.includes('localhost')) {
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.vercel.app') || hostWithoutPort.endsWith('.pages.dev')) {
    if (parts.length > 3 && !hostWithoutPort.includes('-projects')) {
      subdomain = parts[0];
    } else if (parts.length > 2 && hostWithoutPort.endsWith('.pages.dev')) {
      subdomain = parts[0];
    }
  } else {
    if (parts.length > 2 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  const pathname = url.pathname;

  // স্ট্যাটিক ফাইল বাইপাস
  if (
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons/')
  ) {
    return NextResponse.next();
  }

  // ৩. মূল ডোমেনে (মেইন ডোমেন) যদি /items কল করা হয় এবং আপনি সেখানে দেখাইতে না চান
  if (!subdomain) {
    if (pathname.startsWith('/items')) {
      url.pathname = '/404'; // মেইন ডোমেনে /items কল করলে 404 দেখাবে
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (!ALLOWED_SUBDOMAINS.has(subdomain)) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://www.eduliture.org/`, 307);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-subdomain', subdomain);
  url.searchParams.set('subdomain', subdomain);

  // 🔴 গ্লোবাল বাইপাস থেকে /items বাদ দেওয়া হয়েছে
  const globalBypassRoutes = [
    '/about', 
    '/biography', 
    '/genres', 
    '/books', 
    '/book'
  ];

  if (globalBypassRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 🟢 ৪. সাবডোমেন অনুযায়ী /items রিরাইট লজিক
  if (subdomain === 'library') {
    if (pathname.startsWith('/authors')) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (!pathname.startsWith('/subdomains/library')) {
      url.pathname = `/subdomains/library${pathname === '/' ? '' : pathname}`;
    }
  } else {
    // লেখক সাবডোমেন (যেমন: vidyasagar.eduliture.org/items)
    if (pathname.startsWith('/authors')) {
      url.pathname = '/404';
    } else if (!pathname.startsWith('/subdomains/author')) {
      url.pathname = `/subdomains/author/${subdomain}${pathname === '/' ? '' : pathname}`;
    }
  }

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|icons|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|sw\\.js|.*\\.(?:ico|png|webp|svg|jpg|jpeg|gif)$).*)',
  ],
};