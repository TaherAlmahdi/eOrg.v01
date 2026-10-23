import { EventEmitter } from 'events';
import path from 'path';
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// ইভেন্ট লিসেনার লিমিট বাড়িয়ে MaxListenersExceededWarning দূর করা হলো
EventEmitter.defaultMaxListeners = 25;

// লোকাল dev সার্ভারে Cloudflare bindings (R2 ইত্যাদি) অ্যাক্সেস করার জন্য।
// eOrg.v01-এ dev সম্পূর্ণ লোকাল (নিচে CONTENT_ROOT), তাই সেখানে R2/D1 binding-এ সংযোগ করা হয় না।
if (process.env.NODE_ENV !== "development") {
  initOpenNextCloudflareForDev();
}

// eOrg.v01 is the local writing room: in `next dev` the books come from ./content, the covers from
// ./public/cover and the slugs from app/lib/content/core/registry/slug-data.ts (R2 is not touched).
// A value already set in .env.local wins.
if (process.env.NODE_ENV === "development") {
  process.env.CONTENT_ROOT ||= path.resolve("content");
  process.env.COVER_ROOT ||= path.resolve("public", "cover");
  process.env.NEXT_PUBLIC_COVER_BASE ||= "/local-media";
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // ৫০ MB পর্যন্ত ফাইল প্রিক্যাশ সাপোর্ট
  },
});

const nextConfig: NextConfig = {
  // 🔹 থার্ড-পার্টি আইকন ও PWA প্যাকেজের মডিউল রেজোলিউশন ঠিক রাখতে
  transpilePackages: ['lucide-react', '@ducanh2912/next-pwa'],

  images: {
  unoptimized: true, // Cloudflare Workers-এ Vercel-এর built-in image optimizer নেই

  remotePatterns: [
    // 🔹 eduliture-assets bucket-এর cover/ প্রিফিক্স (media.eduliture.org কাস্টম ডোমেইনের মাধ্যমে)
    {
      protocol: "https",
      hostname: "media.eduliture.org",
      port: "",
      pathname: "/cover/**",
    },
    // 🔹 R2 পাবলিক dev এন্ডপয়েন্ট (ব্যাকআপ/টেস্টিং-এর জন্য)
    {
      protocol: "https",
      hostname: "pub-cef6873f84f54698814b950ea14df38f.r2.dev",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "eduliture.org",
      port: "",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "raw.githubusercontent.com",
      port: "",
      pathname: "/**",
    },
  ],
},

  // 🔹 Webpack Caching Issue ও Runtime 'call' undefined Error সমাধান
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // Dev মোডে Webpack এর মডিউল ক্যাশিং ডিজেবল রাখবে
    }
    return config;
  },
};

export default withPWA(nextConfig);