import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure static files are properly served
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=43200", // 12 hours
          },
        ],
      },
    ];
  },
};

export default nextConfig;
