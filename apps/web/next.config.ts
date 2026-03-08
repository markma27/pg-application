import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  // Resolve @pg/shared to built dist so .js imports work (web and API/Node)
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@pg/shared": path.join(__dirname, "../../packages/shared/dist"),
    };
    return config;
  },
};

export default nextConfig;
