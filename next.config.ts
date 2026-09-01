import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  assetPrefix: "/",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          }
        ]
      }
    ];
  }
};

export default nextConfig;

module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'dashboard.free-time.me',
          },
        ],
        destination: 'https://dashboard.free-time.me/:path*',
        permanent: true,
      },
    ];
  },
};