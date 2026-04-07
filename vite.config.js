import { defineConfig } from 'vite';
import { resolve } from 'path';

const root = resolve(__dirname);

// All 26 HTML entry points for multi-page build
export default defineConfig({
  root,
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Root pages
        index:       resolve(root, 'index.html'),
        tracker:     resolve(root, 'tracker.html'),
        calculator:  resolve(root, 'calculator.html'),
        shops:       resolve(root, 'shops.html'),
        learn:       resolve(root, 'learn.html'),
        insights:    resolve(root, 'insights.html'),
        methodology: resolve(root, 'methodology.html'),
        invest:      resolve(root, 'invest.html'),

        // Buying guide
        'guides-buying-guide': resolve(root, 'guides/buying-guide.html'),

        // Country pages
        'countries-uae':          resolve(root, 'countries/uae.html'),
        'countries-saudi-arabia': resolve(root, 'countries/saudi-arabia.html'),
        'countries-kuwait':       resolve(root, 'countries/kuwait.html'),
        'countries-qatar':        resolve(root, 'countries/qatar.html'),
        'countries-bahrain':      resolve(root, 'countries/bahrain.html'),
        'countries-oman':         resolve(root, 'countries/oman.html'),
        'countries-egypt':        resolve(root, 'countries/egypt.html'),
        'countries-jordan':       resolve(root, 'countries/jordan.html'),
        'countries-morocco':      resolve(root, 'countries/morocco.html'),
        'countries-india':        resolve(root, 'countries/india.html'),

        // City pages
        'cities-dubai':     resolve(root, 'countries/uae/cities/dubai.html'),
        'cities-abu-dhabi': resolve(root, 'countries/uae/cities/abu-dhabi.html'),
        'cities-riyadh':    resolve(root, 'countries/saudi-arabia/cities/riyadh.html'),
        'cities-cairo':     resolve(root, 'countries/egypt/cities/cairo.html'),
        'cities-doha':      resolve(root, 'countries/qatar/cities/doha.html'),

        // Market guide pages
        'markets-dubai-gold-souk':       resolve(root, 'countries/uae/markets/dubai-gold-souk.html'),
        'markets-khan-el-khalili-cairo': resolve(root, 'countries/egypt/markets/khan-el-khalili-cairo.html'),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
