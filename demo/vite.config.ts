import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import hawkeyePlugin from '../packages/hawk-eye/src/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  const useSourceAliases = command === 'serve';

  return {
    plugins: [hawkeyePlugin({ enableSave: true }), react()],
    resolve: {
      alias: [
        {
          find: 'hawk-eye/vite',
          replacement: resolve(
            __dirname,
            useSourceAliases ? '../packages/hawk-eye/src/vite.ts' : '../packages/hawk-eye/dist/vite.js'
          ),
        },
        {
          find: 'hawk-eye',
          replacement: resolve(
            __dirname,
            useSourceAliases ? '../packages/hawk-eye/src/index.ts' : '../packages/hawk-eye/dist/index.js'
          ),
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
  };
});
