// app/layout.tsx
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import Header from './components/Header';
import Footer from './components/Footer';
import { getSubdomainData } from '@/app/lib/get-site-data';
import type { Metadata } from "next";
import localFont from 'next/font/local';
import Script from 'next/script';
import AOSProvider from './components/AOSProvider';
import "./globals.css";

// ফন্ট কনফিগারেশন
const mallika = localFont({
  src: '../public/fonts/Mallika.woff2',
  variable: '--font-mallika',
  display: 'swap',
  preload: true,
});

const sabrina = localFont({
  src: '../public/fonts/Sabrina.woff2',
  variable: '--font-sabrina',
  display: 'swap',
  preload: false,
});

const tarunima = localFont({
  src: '../public/fonts/Tarunima.woff2',
  variable: '--font-tarunima',
  display: 'swap',
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || ''; 

  // ১. ডোমেন থেকে সাবডোমেন আলাদা করা
  const hostname = host.split(':')[0]; // পোর্ট সরাতে (e.g. localhost:3000 -> localhost)
  const parts = hostname.split('.');
  
  const isSubdomain =
    (hostname.includes('eduliture.org') && parts.length > 2 && parts[0] !== 'www') ||
    (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost');

  const subdomain = isSubdomain ? parts[0] : null;

  // ২. সাবডোমেন অনুযায়ী আইকনের পাথ নির্ধারণ
  let iconPath = '/favicon.ico'; // মূল ডোমেনের জন্য ডিফল্ট app/favicon.ico

  if (subdomain) {
    const targetIconName = `${subdomain}.ico`;
    const localFilePath = path.join(process.cwd(), 'public', 'favicons', targetIconName);

    if (fs.existsSync(localFilePath)) {
      iconPath = `/favicons/${targetIconName}`;
    } else {
      const defaultSubPath = path.join(process.cwd(), 'public', 'favicons', 'default.ico');
      iconPath = fs.existsSync(defaultSubPath) ? '/favicons/default.ico' : '/favicon.ico';
    }
  }

  // ৩. সাবডোমেন অনুযায়ী ডাটাবেজ/কনফিগ থেকে সাইটের ডাটা আনা
  const siteData = getSubdomainData(host);
  const siteUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://eduliture.org');

  // ৪. ডায়নামিক টাইটেল ও ইমেজের ভেরিয়েবল সেট করা (আপনার ফরম্যাট অনুযায়ী)
  const defaultTitle = siteData?.title || 'এডুলিচার';
  const mainDomainTitle = 'এডুলিচার';
  const dynamicTitle = subdomain ? `${defaultTitle} ❀ ${mainDomainTitle}` : mainDomainTitle;
  const ogImageUrl = siteData?.ogImage || '/og/site/default.jpg';

  // ৫. একটিমাত্র রিটার্ন অবজেক্ট
  return {
    title: dynamicTitle,
    description: `${defaultTitle} ❀ বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান`,
    metadataBase: new URL(siteUrl),
    icons: {
      icon: iconPath, // ব্রাউজারের <head> এ ডায়নামিক .ico ফাইল লিঙ্ক হবে
    },
    openGraph: {
      title: dynamicTitle,
      description: `${defaultTitle} ❀ বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান`,
      url: siteUrl,
      siteName: mainDomainTitle,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: defaultTitle,
        },
      ],
      locale: 'bn_BD',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicTitle,
      images: [ogImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';

  // সাবডোমেন স্ল্যাগ বের করা (যেমন: library, bankim ইত্যাদি)
  let currentDomainKey = 'main';
  const parts = hostname.split('.');
  
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    currentDomainKey = parts[0]; 
  } else if (hostname.includes('library.localhost')) {
    currentDomainKey = 'library';
  } else if (hostname.includes('bankim.localhost')) {
    currentDomainKey = 'bankim';
  }

  return (
    <html
      lang="bn"
      className={`${mallika.variable} ${sabrina.variable} ${tarunima.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* গুগল অ্যাডসেন্স */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5551708286100565"
          crossOrigin="anonymous"
          strategy="lazyOnload" 
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fdfdf7] text-gray-900 font-tarunima">
        <AOSProvider />

        {/* ডাইনামিক ডোমেন কি প্রপ্স হিসেবে পাস করা হলো */}
        <Header domainKey={currentDomainKey} />
        
        <main className="grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}