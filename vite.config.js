import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
      external: [],
      output: {
        globals: {},
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
