import { defineConfig } from "tsup";

const shared = {
  entry: { index: "src/index.ts" },
  target: "es2022",
  sourcemap: true,
} as const;

export default defineConfig([
  // For bundlers and Node, @ton/core stays the app's own copy.
  { ...shared, format: "esm", outDir: "dist/esm", external: ["@ton/core"] },
  { ...shared, format: "cjs", outDir: "dist/cjs", external: ["@ton/core"] },
  {
    // For a <script> tag: one file with @ton/core and a Buffer included.
    ...shared,
    entry: { "kton-sdk": "src/index.ts" },
    format: "iife",
    outDir: "dist",
    globalName: "KTONSDK",
    platform: "browser",
    minify: true,
    sourcemap: false,
    noExternal: [/.*/],
    inject: ["./scripts/buffer-shim.ts"],
  },
]);
