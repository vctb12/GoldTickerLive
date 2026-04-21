import { defineConfig } from 'vite';
import { resolve } from 'path';
import { globSync } from 'node:fs';

const root = resolve(__dirname);

// ── Excluded directories: never processed by Vite ──────────────────────────
// Leaf pages (country/city/karat/shops) load page-hydrator.js as raw ES
// modules and are served verbatim — they are copied by the deploy workflow.
const EXCLUDE_DIRS = [
  'dist',
  'node_modules',
  '.git',
  // country-specific leaf-page trees (now unified under countries/)
  'countries',
  // admin pages use top-level await and Supabase auth — served as-is
  'admin',
  // embed widget served verbatim
  'embed',
];

/**
 * Discover all HTML entry-point files that Vite should bundle.
 * Excludes leaf-page trees that are copied as-is by the deploy workflow.
 */
function discoverHtmlEntries() {
  const htmlFiles = globSync('**/*.html', {
    cwd: root,
    exclude: (path) => EXCLUDE_DIRS.some((d) => path === d || path.startsWith(d + '/')),
  });

  const entries = {};
  for (const file of htmlFiles) {
    // Use a dash-joined key derived from the relative path
    const key = file.replace(/\//g, '-').replace(/\.html$/, '');
    entries[key] = resolve(root, file);
  }
  return entries;
}

export default defineConfig({
  root,
  // Custom domain (goldtickerlive.com) serves from root '/'.
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_debugger: true,
        pure_funcs: ['console.warn', 'console.log'],
      },
      format: {
        comments: false,
      },
    },
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/lightweight-charts')) {
            return 'vendor';
          }
          if (
            id.includes('/src/lib/cache.js') ||
            id.includes('/src/lib/api.js') ||
            id.includes('/src/lib/price-calculator.js') ||
            id.includes('/src/lib/formatter.js')
          ) {
            return 'utils';
          }
        },
        assetFileNames: () => 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
      input: discoverHtmlEntries(),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
