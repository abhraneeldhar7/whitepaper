import type { NextConfig } from "next";

const parties = (process.env.CLERK_AUTHORIZED_PARTIES || "").split(",").map(s => s.trim()).filter(Boolean);
const devOrigins = parties.map(url => new URL(url).hostname);

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/private/:path*",
        destination: "http://127.0.0.1:8000/private/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
