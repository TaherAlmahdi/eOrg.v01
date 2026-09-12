import { EventEmitter } from 'events';
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// ইভেন্ট লিসেনার লিমিট বাড়িয়ে MaxListenersExceededWarning দূর করা হলো
EventEmitter.defaultMaxListeners = 25;

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
    remotePatterns: [
      // 🔹 Cloudflare R2 Custom Media Subdomain
      {
        protocol: "https",
        hostname: "media.eduliture.org",
        port: "",
        pathname: "/**",
      },
      // 🔹 Cloudflare R2 Public Dev Endpoint
      {
        protocol: "https",
        hostname: "pub-cef6873f84f54698814b950ea14df38f.r2.dev",
        port: "",
        pathname: "/**",
      },
      // 🔹 পূর্বের অন্যান্য হোস্টনেম
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