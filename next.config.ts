import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  // Allow pdf-parse to work on server side
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
