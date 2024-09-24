import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp3|ogg)$/i,
      use: [
        {
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
            publicPath: "/_next/static/audio/",
            outputPath: "static/audio/",
          },
        },
      ],
    });
    config.module.rules.push({
      test: /\.wasm/,
      type: "asset/resource",
    });
    // config.externals.push({
    //   "node:crypto": "crypto",
    // });
    return config;
  },
};

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;
