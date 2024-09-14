import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.wasm/,
      type: "asset/resource",
    });

    return config;
  },
};

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;
