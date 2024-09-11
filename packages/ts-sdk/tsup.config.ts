import dotenv from "dotenv";
import { defineConfig } from "tsup";

dotenv.config({ path: ".env.local" });
export default defineConfig({
  entry: ["src/index.ts", "src/transport/index.ts"],

  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  dts: true, // generate dts files
  minify: true,
  env: {
    PIESOCKET_API_KEY: process.env.PIESOCKET_API_KEY || "",
  },
  noExternal: [
    "@jeton/zk-deck/wasm/shuffle-encrypt-deck.wasm",
    "@jeton/zk-deck/wasm/decrypt-card-share.wasm",
  ],
  loader: {
    ".wasm": "binary",
  },
});
