# Performance Optimization Guide

**Achieving Lighthouse 95+ Scores Across All Metrics**

## Overview

This document outlines performance optimization strategies, techniques, and best practices for the
Gold-Prices platform.

## Performance Budgets

### Target Metrics

- **First Contentful Paint (FCP):** < 1.2s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Total Blocking Time (TBT):** < 200ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Speed Index:** < 3.0s
- **Time to Interactive (TTI):** < 3.5s

### Resource Budgets

- Total page weight: < 500KB (gzipped)
- JavaScript bundle: < 150KB (gzipped)
- CSS: < 50KB (gzipped)
- Images: < 300KB total
- Fonts: < 50KB

## Critical Rendering Path Optimization

### 1. Critical CSS Inlining

**Strategy:** Inline above-the-fold CSS in `<head>`

```html
<head>
  <style>
    /* Critical CSS - inlined */
    :root {
      /* Design tokens */
    }
    body {
      /* Base styles */
    }
    .hero {
      /* Above-fold hero */
    }
  </style>

  <!-- Defer non-critical CSS -->
  <link
    rel="preload"
    href="styles/global.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'"
  />
  <noscript><link rel="stylesheet" href="styles/global.css" /></noscript>
</head>
```

### 2. Resource Hints

```html
<!-- DNS Prefetch -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//api.goldpricez.com" />

<!-- Preconnect -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload Critical Assets -->
<link
  rel="preload"
  as="font"
  href="/fonts/cairo-v1.woff2"
  type="font/woff2"
  crossorigin="anonymous"
/>
<link rel="preload" as="script" href="src/pages/home.js" type="module" />

<!-- Prefetch Next Pages -->
<link rel="prefetch" href="/tracker.html" as="document" />
```

## JavaScript Optimization

### 1. Code Splitting

```javascript
// Dynamic imports for non-critical features
const loadChart = () => import('./components/chart.js');
const loadCalculator = () => import('./lib/price-calculator.js');

// Load on demand
button.addEventListener('click', async () => {
  const { renderChart } = await loadChart();
  renderChart(data);
});
```

### 2. Tree Shaking

**Ensure ES modules for optimal tree shaking:**

```javascript
// ✅ Good - Named exports
export { formatPrice, formatDate, formatKarat };

// ❌ Bad - Default export of object
export default { formatPrice, formatDate, formatKarat };
```

### 3. Deferred Execution

```html
<!-- Defer non-critical scripts -->
<script src="analytics.js" defer></script>

<!-- Async for independent scripts -->
<script src="ads.js" async></script>

<!-- Module scripts are deferred by default -->
<script type="module" src="app.js"></script>
```

### 4. Web Workers

```javascript
// Offload heavy calculations
const worker = new Worker('/workers/price-calc-worker.js');

worker.postMessage({ prices, currencies, karats });

worker.onmessage = (e) => {
  const { results } = e.data;
  updateUI(results);
};
```

## Image Optimization

### 1. Modern Formats

```html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Gold bars" loading="lazy" width="800" height="450" />
</picture>
```

### 2. Responsive Images

```html
<img
  srcset="gold-400w.jpg 400w, gold-800w.jpg 800w, gold-1200w.jpg 1200w"
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  src="gold-800w.jpg"
  alt="Gold price chart"
  loading="lazy"
  decoding="async"
/>
```

### 3. Lazy Loading

```html
<!-- Native lazy loading -->
<img src="below-fold.jpg" loading="lazy" alt="Description" />

<!-- Intersection Observer for custom lazy loading -->
<script>
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
</script>
```

## Font Loading Optimization

### 1. Font-Display Strategy

```css
@font-face {
  font-family: 'Cairo';
  src: url('/fonts/cairo-v1.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
  font-weight: 400;
  font-style: normal;
}
```

### 2. Subset Fonts

```html
<!-- Load only Latin + Arabic subsets -->
<link
  href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap&subset=latin,arabic"
  rel="stylesheet"
/>
```

### 3. Variable Fonts

```css
@font-face {
  font-family: 'Cairo Variable';
  src: url('/fonts/cairo-var.woff2') format('woff2-variations');
  font-weight: 100 900; /* Single file for all weights */
  font-display: swap;
}
```

## Caching Strategy

### 1. Service Worker Caching

```javascript
// sw.js
const CACHE_NAME = 'gold-prices-v1';
const STATIC_ASSETS = ['/', '/styles/global.css', '/src/pages/home.js', '/manifest.json'];

// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(networkFirst(event.request));
  } else {
    // Cache-first for static assets
    event.respondWith(cacheFirst(event.request));
  }
});
```

### 2. HTTP Caching Headers

```apache
# .htaccess
<IfModule mod_expires.c>
  ExpiresActive On

  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"

  # CSS and JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"

  # Fonts
  ExpiresByType font/woff2 "access plus 1 year"

  # HTML (short cache)
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

## API Request Optimization

### 1. Request Batching

```javascript
// Batch multiple price requests
async function batchFetch(endpoints) {
  return Promise.all(endpoints.map((url) => fetch(url)));
}

const [goldData, fxData] = await batchFetch([
  'https://api.goldpricez.com/price',
  'https://open.er-api.com/v6/latest/USD',
]);
```

### 2. Request Deduplication

```javascript
// Prevent duplicate simultaneous requests
const inflightRequests = new Map();

async function fetchWithDedup(url) {
  if (inflightRequests.has(url)) {
    return inflightRequests.get(url);
  }

  const promise = fetch(url).then((r) => r.json());
  inflightRequests.set(url, promise);

  promise.finally(() => inflightRequests.delete(url));

  return promise;
}
```

### 3. Data Prefetching

```javascript
// Prefetch likely next pages
const prefetchPages = () => {
  const prefetchLinks = ['/tracker.html', '/calculator.html', '/countries/uae.html'];

  prefetchLinks.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Prefetch after page load
window.addEventListener('load', () => {
  requestIdleCallback(prefetchPages);
});
```

## Bundle Size Optimization

### 1. Analyze Bundle Size

```bash
npm run build
npx vite-bundle-visualizer
```

### 2. Remove Unused Code

```javascript
// Before: Import everything
import _ from 'lodash';

// After: Import only what you need
import debounce from 'lodash/debounce';
```

### 3. Use Compression

```apache
# Enable Brotli compression
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css application/javascript
</IfModule>

# Fallback to Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

## Rendering Optimization

### 1. Avoid Layout Thrashing

```javascript
// ❌ Bad - Forces multiple reflows
elements.forEach((el) => {
  el.style.width = el.offsetWidth + 10 + 'px'; // Read then write
});

// ✅ Good - Batch reads, then batch writes
const widths = elements.map((el) => el.offsetWidth);
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px';
});
```

### 2. Use CSS Transforms

```css
/* ❌ Bad - Triggers layout */
.element {
  left: 100px;
  top: 50px;
}

/* ✅ Good - Uses GPU, no layout */
.element {
  transform: translate(100px, 50px);
  will-change: transform;
}
```

### 3. Virtualize Long Lists

```javascript
// Only render visible items
class VirtualList {
  constructor(items, itemHeight, containerHeight) {
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(containerHeight / itemHeight);
  }

  getVisibleItems(scrollTop) {
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    return this.items.slice(startIndex, startIndex + this.visibleCount);
  }
}
```

## Third-Party Script Optimization

### 1. Lazy Load Analytics

```javascript
// Load analytics after user interaction
let analyticsLoaded = false;

function loadAnalytics() {
  if (analyticsLoaded) return;

  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXX';
  script.async = true;
  document.head.appendChild(script);

  analyticsLoaded = true;
}

// Load on first interaction
['click', 'scroll', 'keydown'].forEach((event) => {
  window.addEventListener(event, loadAnalytics, { once: true });
});
```

### 2. Use Facade Pattern

```html
<!-- Replace heavy embed with lightweight facade -->
<div class="video-facade" data-video-id="abc123">
  <img src="thumbnail.jpg" alt="Video thumbnail" />
  <button>Play Video</button>
</div>

<script>
  document.querySelectorAll('.video-facade').forEach((facade) => {
    facade.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://youtube.com/embed/${facade.dataset.videoId}`;
      facade.replaceWith(iframe);
    });
  });
</script>
```

## Performance Monitoring

### 1. Core Web Vitals Tracking

```javascript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, id }) {
  gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    event_label: id,
    non_interaction: true,
  });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

### 2. Performance Observer

```javascript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });
```

## Performance Testing

### Automated Testing

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://goldtickerlive.com

# WebPageTest
npx webpagetest test https://goldtickerlive.com
```

### Performance Budget Check

```javascript
// performance-budget.json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 150 },
        { "resourceType": "stylesheet", "budget": 50 },
        { "resourceType": "image", "budget": 300 },
        { "resourceType": "total", "budget": 500 }
      ]
    }
  ]
}
```

## Checklist

- [ ] Inline critical CSS
- [ ] Defer non-critical JavaScript
- [ ] Optimize images (WebP/AVIF, responsive, lazy loading)
- [ ] Implement service worker caching
- [ ] Use resource hints (preload, prefetch, preconnect)
- [ ] Enable compression (Brotli/Gzip)
- [ ] Minimize render-blocking resources
- [ ] Implement code splitting
- [ ] Remove unused code
- [ ] Optimize fonts (subset, font-display: swap)
- [ ] Minimize third-party scripts
- [ ] Set up performance monitoring
- [ ] Achieve Lighthouse score 95+ on all metrics

---

Last updated: Phase 3 - Performance Optimization
