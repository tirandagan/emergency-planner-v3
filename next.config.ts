import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Better for Docker/serverless deployments
  reactCompiler: false, // Temporarily disabled due to build issues
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mtvpyrqixtwwndwdvfxp.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /node_modules\/paapi5-nodejs-sdk/,
      parser: {
        amd: false,
      },
    });
    return config;
  },
};

export default nextConfig;
