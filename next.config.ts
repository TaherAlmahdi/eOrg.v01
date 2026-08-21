import { EventEmitter } from 'events';
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// ইভেন্ট লিসেনার লিমিট বাড়িয়ে MaxListenersExceededWarning দূর করা হলো
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
  images: {
    remotePatterns: [
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
};

export default withPWA(nextConfig);