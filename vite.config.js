import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'path';

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
  const htmlFiles = [];

  function walk(relativeDir = '') {
    for (const entry of readdirSync(resolve(root, relativeDir), { withFileTypes: true })) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.some((d) => relativePath === d || relativePath.startsWith(d + '/'))) {
          walk(relativePath);
        }
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(relativePath);
      }
    }
  }

  walk();

  const entries = {};
  for (const file of htmlFiles.sort()) {
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
