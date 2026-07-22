import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // ১. ডোমেন থেকে পোর্ট সরিয়ে ফেলা (e.g., eduliture.org:3000 -> eduliture.org)
  const hostWithoutPort = hostname.split(':')[0];
  const parts = hostWithoutPort.split('.');

  let subdomain: string | null = null;

  // ২. সাবডোমেন শনাক্তকরণ লজিক
  if (hostWithoutPort.includes('localhost')) {
    // লোকালহোস্ট হ্যান্ডলিং (e.g., bankim.localhost)
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.vercel.app')) {
    // ভার্সেল প্রিভিউ ডোমেন হ্যান্ডলিং (e.g., bankim.my-app.vercel.app)
    if (parts.length > 3) {
      subdomain = parts[0];
    }
  } else {
    // কাস্টম প্রডাকশন ডোমেন হ্যান্ডলিং (e.g., bankim.eduliture.org)
    // parts[0] যেন 'www' বা মূল ডোমেন না হয় তা নিশ্চিত করা
    if (parts.length > 2 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  // ৩. যদি সাবডোমেন না থাকে (অর্থাৎ মেইন ডোমেন/www)
  if (!subdomain) {
    return NextResponse.next();
  }

  // ৪. সাবডোমেন থাকলে হেডার ও কোয়েরি প্যারাম সেট করা
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-subdomain', subdomain);
  url.searchParams.set('subdomain', subdomain);

  const pathname = url.pathname;

  // ৫. ডাইনামিক পাথম্যাপিং (লাইব্রেরি নাকি অথর সাবডোমেন)
  if (subdomain === 'library') {
    url.pathname = `/subdomains/library${pathname === '/' ? '' : pathname}`;
  } else {
    url.pathname = `/subdomains/author/${subdomain}${pathname === '/' ? '' : pathname}`;
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