import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // লোকালহোস্ট এবং মেইন ডোমেন হ্যান্ডেল করা (যেমন: eduliture.org বা localhost:3000)
  // আপনার আসল ডোমেন eduliture.org হলে নিচে পরিবর্তন করে নেবেন
  const currentHost = hostname
    .replace('.localhost:3000', '')
    .replace('.eduliture.org', '');

  // যদি কোনো সাবডোমেন না থাকে (যেমন শুধু localhost:3000 বা eduliture.org)
  if (currentHost === 'localhost:3000' || currentHost === 'eduliture' || currentHost === '') {
    return NextResponse.next();
  }

  // ১. লাইব্রেরি সাবডোমেন (library.eduliture.org)
  if (currentHost === 'library') {
    url.pathname = `/subdomains/library${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // ২. লেখক ভিত্তিক নির্দিষ্ট সাবডোমেন (যেমন: bankim.eduliture.org)
  // এটি স্বয়ংক্রিয়ভাবে যেকোনো লেখকের নামের সাবডোমেনকে রিরাইট করবে
  url.pathname = `/subdomains/author/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}

// কোন কোন পাথগুলো মিডলওয়্যার স্ক্যান করবে না (ফাইল, ইমেজ ইত্যাদি বাদ দেওয়া)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|images).*)',
  ],
};