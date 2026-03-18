import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import hawkeyePlugin from '../packages/hawk-eye/src/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), hawkeyePlugin({ enableSave: true })],
  resolve: {
    alias: [
      {
        find: 'hawk-eye/vite',
        replacement: resolve(__dirname, '../packages/hawk-eye/src/vite.ts'),
      },
      {
        find: 'hawk-eye',
        replacement: resolve(__dirname, '../packages/hawk-eye/src/index.ts'),
      },
      {
        find: '@',
        replacement: resolve(__dirname, './src'),
      },
    ],
  },
  server: {
    port: 3000,
    open: true,
  },
});
