import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/vite.ts', 'src/cli.ts', 'src/vue.ts', 'src/svelte.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  splitting: false,
  outDir: 'dist',
  external: ['vue', 'svelte', 'react', 'react-dom'],
});
