import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig = {
  turbo: {}, // Turbopack ফ্ল্যাগ এরর বাইপাস করার জন্য
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eduliture.com',
        port: '',
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
} as NextConfig;

export default withPWA(nextConfig);