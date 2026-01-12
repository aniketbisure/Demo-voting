import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};


export default nextConfig;
