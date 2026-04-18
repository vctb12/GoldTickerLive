/**
 * Express Server for Gold Prices Platform
 * Includes admin API routes and static file serving
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./server/lib/errors');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Import admin routes
const adminRoutes = require('./server/routes/admin');

// Middleware — Security headers
// CSP is intentionally disabled in development for ease of debugging.
// In production (NODE_ENV=production), a strict CSP is enforced.
//
// NOTE: 'unsafe-inline' is currently required for scriptSrc because the site
// embeds Google Analytics and Microsoft Clarity inline snippets in static HTML.
// To remove 'unsafe-inline', those snippets must be moved to external .js files
// and a nonce-based CSP injected at serve-time via middleware.
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              'https://cdn.jsdelivr.net',
              'https://www.googletagmanager.com',
              'https://www.clarity.ms',
              'https://pagead2.googlesyndication.com',
              'https://www.google-analytics.com',
            ],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: [
              "'self'",
              'https://api.gold-api.com',
              'https://data-asg.goldprice.org',
              'https://open.er-api.com',
              'https://www.google-analytics.com',
              'https://*.supabase.co',
              'https://www.clarity.ms',
              'https://nominatim.openstreetmap.org',
            ],
            frameSrc: ["'self'", 'https://pagead2.googlesyndication.com'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS — restrict origins in production.
// In production, always set CORS_ORIGINS (comma-separated) to avoid rejecting all cross-origin requests.
// Example: CORS_ORIGINS=https://goldtickerlive.com,https://goldprices.com
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : null; // null → allow all (development only)

if (IS_PROD && !ALLOWED_ORIGINS) {
  console.warn(
    '[server] WARNING: CORS_ORIGINS is not set in production. ' +
      'Cross-origin requests will be rejected.'
  );
}
app.use(
  cors(
    ALLOWED_ORIGINS
      ? {
          origin(origin, cb) {
            // Allow requests with no origin (server-to-server, curl, etc.)
            if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
            cb(new Error('Not allowed by CORS'));
          },
        }
      : IS_PROD
        ? {
            // In production without explicit origins, reject all cross-origin requests
            origin(origin, cb) {
              if (!origin) return cb(null, true); // same-origin / server-to-server
              cb(new Error('Not allowed by CORS'));
            },
          }
        : undefined // development: allow all
  )
);

app.use(morgan(IS_PROD ? 'combined' : 'dev'));

// Body parsing with size limits
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Static file serving for dist folder
app.use('/', express.static(path.join(__dirname, 'dist')));

// Serve source files for development only — scoped to the src/ subdirectory.
if (!IS_PROD) {
  app.use('/src', express.static(path.join(__dirname, 'src')));
}

// Admin API routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Redirect /admin to the Supabase-integrated admin panel
app.get('/admin', (req, res) => {
  res.redirect(301, '/admin/');
});

// Handle static file serving and SPA fallback with explicit 404 handling
app.get('*', (req, res, next) => {
  // Normalize and prevent path traversal
  const safePath = path.normalize(req.path).replace(/^\/+/, '');
  const filePath = path.join(__dirname, 'dist', safePath);

  // If the request targets a static file extension, try to serve it and
  // fall back to the 404 page when missing.
  if (path.extname(req.path)) {
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).sendFile(path.join(__dirname, 'dist', '404.html'));
  }

  // If path is a directory-like request (no extension), prefer index.html
  const indexCandidate = path.join(filePath, 'index.html');
  if (fs.existsSync(indexCandidate)) {
    return res.sendFile(indexCandidate);
  }

  // SPA fallback: if `dist/index.html` exists, serve it so client-side routes load.
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);

  // Last resort: serve 404 page.
  return res.status(404).sendFile(path.join(__dirname, 'dist', '404.html'));
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Gold Prices Platform Server');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Admin:   http://localhost:${PORT}/admin`);
  console.log(`   API:     http://localhost:${PORT}/api/admin`);
  console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
