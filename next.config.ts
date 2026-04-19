import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eduliture.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  /* এখানে আপনার অন্য কোনো কনফিগ অপশন থাকলে যুক্ত করতে পারেন */
};

export default nextConfig;