/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // or 'happy-dom'
    setupFiles: './vitest.setup.ts',
  },
});
