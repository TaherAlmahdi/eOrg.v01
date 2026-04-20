import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eduliture.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: 'https://eduliture.com/graphql',
      },
    ];
  },
};

export default nextConfig;