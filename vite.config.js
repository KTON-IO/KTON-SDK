const path = require("path");
const { defineConfig } = require("vite");
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "KTONSDK",
      fileName: (format) => {
        switch (format) {
          case "es":
            return "kton-sdk.esm.js";
          case "umd":
            return "kton-sdk.min.js";
          default:
            return "kton-sdk.js";
        }
      },
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["@ton/core", "@ton/crypto", "@ton/ton"],
      output: {
        globals: {
          "@ton/core": "TonCore",
          "@ton/crypto": "TonCrypto", 
          "@ton/ton": "Ton",
        },
      },
    },
    sourcemap: true,
    minify: "terser",
  },
  plugins: [
    nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true,
      },
    }),
    dts({ 
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
});
