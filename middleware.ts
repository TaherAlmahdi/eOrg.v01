// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // সাবডোমেন এক্সট্র্যাক্ট করা (যেমন: bankim.localhost:3000 থেকে 'bankim')
  const currentHost = hostname
    .replace('.localhost:3000', '')
    .replace('.eduliture.org', '');

  // যদি কোনো সাবডোমেন না থাকে (যেমন শুধু localhost:3000 বা eduliture.org)
  const isMainDomain =
    currentHost === 'localhost:3000' ||
    currentHost === 'eduliture' ||
    currentHost === '';

  if (isMainDomain) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);

  // ১. হেডার ও ক্যোয়ারি প্যারাম সেট করা (Server Component-এ সাবডোমেন চেনার জন্য)
  requestHeaders.set('x-subdomain', currentHost);
  url.searchParams.set('subdomain', currentHost);

  // ২. শুধুমাত্র সাবডোমেনের হোমপেজ (/) রিকোয়েস্ট নির্দিষ্ট ফোল্ডারে রিরাইট হবে
  if (url.pathname === '/') {
    if (currentHost === 'library') {
      url.pathname = '/subdomains/library';
    } else {
      url.pathname = `/subdomains/author/${currentHost}`;
    }
  }

  // ৩. হোমপেজ ছাড়া অন্য সব রাউটে (যেমন: /genre/novel) মূল ইউআরএল পাথ ঠিক রেখেই রিরাইট করবে
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

// কোন কোন পাথগুলো মিডলওয়্যার স্ক্যান করবে না (ফাইল, ইমেজ ইত্যাদি বাদ দেওয়া)
export const config = {
  matcher: [
    /*
     * নিচের ফাইল/পাথগুলোকে মিডলওয়্যার এক্সিকিউশন থেকে সম্পূর্ণ বাদ দেবে:
     * - api, _next/static, _next/image
     * - assets, images, favicon (ফোল্ডার হিসেবে)
     * - সকল প্রকার Static File Extensions (.ico, .png, .webp, .svg, .jpg, ইত্যাদি)
     */
    '/((?!api|_next/static|_next/image|assets|images|favicon|sw.js|.*\\.(?:ico|png|webp|svg|jpg|jpeg|gif)$).*)',
  ],
};