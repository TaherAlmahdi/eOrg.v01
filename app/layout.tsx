import type { Metadata } from "next";
import localFont from 'next/font/local';
import Script from 'next/script'; // ১. Script ইমপোর্ট করা হয়েছে
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

// কাস্টম ফন্টগুলো কনফিগার করা
const mallika = localFont({
  src: '../public/fonts/Mallika.woff2',
  variable: '--font-mallika',
  display: 'swap',
});

const sabrina = localFont({
  src: '../public/fonts/Sabrina.woff2',
  variable: '--font-sabrina',
  display: 'swap',
});

const tarunima = localFont({
  src: '../public/fonts/Tarunima.woff2',
  variable: '--font-tarunima',
  display: 'swap',
});

// এসইও এবং মেটাডাটা
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bankim-rachanabali.vercel.app'),
  title: {
    default: 'বঙ্কিম রচনাবলী',
    template: '%s | বঙ্কিম রচনাবলী'
  },
  description: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের সকল সাহিত্যকর্মের ডিজিটাল সংগ্রহশালা',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      // সব ফন্ট ভেরিয়েবল ক্লাস হিসেবে যুক্ত করা হয়েছে
      className={`${mallika.variable} ${sabrina.variable} ${tarunima.variable} h-full antialiased`}
    >
      <head>
        {/* গুগল অ্যাডসেন্স কোড */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5551708286100565"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      {/* body-তে font-tarunima ডিফল্ট করা হয়েছে */}
      <body className="min-h-full flex flex-col bg-[#fdfdf7] text-gray-900 font-tarunima">
        <Header />
        
        <main className="flex-grow">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  ); // ২. অতিরিক্ত ক্যারেক্টার মুছে ফেলা হয়েছে
}