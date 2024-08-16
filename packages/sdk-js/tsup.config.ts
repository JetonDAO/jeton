import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/transport/index.ts"],

  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true, // generate dts files
  minify: true,
});
