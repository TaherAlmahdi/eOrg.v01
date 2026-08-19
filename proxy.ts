// proxy.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🟢 ১. অনুমোদিত সাবডোমেনগুলোর তালিকা (লাইব্রেরি + লেখক স্লাগ)
const ALLOWED_SUBDOMAINS = new Set([
  'library',
  'vidyasagar',
  'bankim',
  'rabindra',
  'nazrul',
  'sarat',
  'jibananda',
  'sukanta',
  // আপনার নতুন নতুন লেখকদের সাবডোমেন স্লাগগুলো এখানে যুক্ত করবেন
]);

// 🔴 default export হিসেবে proxy ফাংশনটি এক্সপোর্ট করা হয়েছে
export default function proxy(request: NextRequest) {
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

  // 🔴 স্পেশাল স্ট্যাটিক ফাইল ও PWA ফাইল বাইপাস (sitemap, manifest, sw, icons ইত্যাদি)
  const pathname = url.pathname;
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

  // ৩. যদি সাবডোমেন না থাকে
  if (!subdomain) {
    return NextResponse.next();
  }

  // 🔴 ৩.১ ওয়াইল্ডকার্ড প্রতিরোধ: অননুমোদিত / ভুল সাবডোমেন হলে মেইন ডোমেনে রিডাইরেক্ট
  if (!ALLOWED_SUBDOMAINS.has(subdomain)) {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    
    // Localhost এবং Production ডোমেন আলাদাভাবে নির্ধারণ
    if (hostWithoutPort.includes('localhost')) {
      const port = url.port ? `:${url.port}` : '';
      return NextResponse.redirect(`${protocol}://localhost${port}/`, 307);
    } else if (hostWithoutPort.endsWith('.vercel.app')) {
      // Vercel Preview/Deployment URL-এর মূল ডোমেন
      const mainVercelHost = parts.slice(-3).join('.');
      return NextResponse.redirect(`${protocol}://${mainVercelHost}/`, 307);
    } else {
      // প্রোডাকশন মূল ডোমেন (eduliture.org)
      return NextResponse.redirect(`https://www.eduliture.org/`, 307);
    }
  }

  // ৪. সাবডোমেন থাকলে হেডার ও কোয়েরি প্যারাম সেট করা
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-subdomain', subdomain);
  url.searchParams.set('subdomain', subdomain);

  // 🔴 গ্লোবাল বাইপাস: যেসব রাউট সব সাবডোমেনের জন্য সরাসরি মূল app/ রুট ব্যবহার করবে
  const globalBypassRoutes = [
    '/about', 
    '/biography', 
    '/genres', 
    '/books', 
    '/book', 
    '/items', // 🟢 /items এবং /items/... রাউট বাইপাসে যুক্ত করা হলো
  ];

  if (globalBypassRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ৫. ডাইনামিক পাথম্যাপিং (শুধুমাত্র বাইপাস রাউট ব্যতীত অন্য সব পেজের জন্য)
  if (subdomain === 'library') {
    // 🔴 /authors শুধুমাত্র library সাবডোমেনে থাকলে মূল app/authors/page.tsx থেকেই দেখাবে
    if (pathname.startsWith('/authors')) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    if (!pathname.startsWith('/subdomains/library')) {
      url.pathname = `/subdomains/library${pathname === '/' ? '' : pathname}`;
    }
  } else {
    // লেখকদের সাবডোমেনে কেউ /authors-এ ঢুকলে 404 পেজে পাঠাবে
    if (pathname.startsWith('/authors')) {
      url.pathname = '/404';
    } else if (!pathname.startsWith('/subdomains/author')) {
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
    '/((?!api|_next/static|_next/image|assets|images|icons|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|sw\\.js|.*\\.(?:ico|png|webp|svg|jpg|jpeg|gif)$).*)',
  ],
};