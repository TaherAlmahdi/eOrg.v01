// app/layout.tsx
import { headers } from 'next/headers';
import Header from './components/Header'; // আপনার হেডারের সঠিক পাথ দিন
import Footer from './components/Footer'; // আপনার ফুটারের সঠিক পাথ দিন

import type { Metadata } from "next";
import localFont from 'next/font/local';
import Script from 'next/script';
import "./globals.css";

// ফন্ট কনফিগারেশন: preload অপশনটি সতর্কতার সাথে ব্যবহার করা হয়েছে
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
  preload: false, // সব ফন্ট একসাথে প্রিলোড করলে 'not used within a few seconds' ওয়ার্নিং আসে
});

const tarunima = localFont({
  src: '../public/fonts/Tarunima.woff2',
  variable: '--font-tarunima',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://eduliture.vercel.app'),
  title: {
    default: 'এডুলিচার',
    template: '%s ❀ এডুলিচার'
  },
  description: 'বিশুদ্ধজ্ঞানের শিক্ষাবিষয়ক প্রতিষ্ঠান',
};

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
    currentDomainKey = parts[0]; // library বা bankim চলে আসবে
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
        {/* গুগল অ্যাডসেন্স: data-nscript এরর এড়াতে strategy পরিবর্তন করা হয়েছে। 
           Next.js-এ AdSense-এর জন্য 'lazyOnload' সবচেয়ে নিরাপদ। 
        */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5551708286100565"
          crossOrigin="anonymous"
          strategy="lazyOnload" 
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fdfdf7] text-gray-900 font-tarunima">
        {/* 🌟 ডাইনামিক ডোমেন কি প্রপ্স হিসেবে পাস করা হলো */}
        <Header domainKey={currentDomainKey} />
        
        <main className="grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}