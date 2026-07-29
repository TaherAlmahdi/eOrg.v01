import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // ১. ডোমেন থেকে পোর্ট সরিয়ে ফেলা
  const hostWithoutPort = hostname.split(':')[0];
  const parts = hostWithoutPort.split('.');

  let subdomain: string | null = null;

  // ২. সাবডোমেন শনাক্তকরণ লজিক
  if (hostWithoutPort.includes('localhost')) {
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.vercel.app')) {
    if (parts.length > 3 && !hostWithoutPort.includes('-projects')) {
      subdomain = parts[0];
    }
  } else {
    if (parts.length > 2 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  // ৩. যদি সাবডোমেন না থাকে
  if (!subdomain) {
    return NextResponse.next();
  }

  // ৪. সাবডোমেন থাকলে হেডার ও কোয়েরি প্যারাম সেট করা
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-subdomain', subdomain);
  url.searchParams.set('subdomain', subdomain);

  const pathname = url.pathname;

  // 🔴 গ্লোবাল বাইপাস: যেসব রাউট সব সাবডোমেনের জন্য সরাসরি মূল app/ রুট ব্যবহার করবে
  // (এখানে /authors যুক্ত করা হয়েছে)
  const globalBypassRoutes = ['/about', '/biography', '/genres', '/books', '/authors'];

  if (globalBypassRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ৫. ডাইনামিক পাথম্যাপিং
  if (subdomain === 'library') {
    if (!pathname.startsWith('/subdomains/library')) {
      url.pathname = `/subdomains/library${pathname === '/' ? '' : pathname}`;
    }
  } else {
    if (!pathname.startsWith('/subdomains/author')) {
      url.pathname = `/subdomains/author/${subdomain}${pathname === '/' ? '' : pathname}`;
    }
  }

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|images|favicon|robots\\.txt|sitemap\\.xml|sw\\.js|.*\\.(?:ico|png|webp|svg|jpg|jpeg|gif)$).*)',
  ],
};