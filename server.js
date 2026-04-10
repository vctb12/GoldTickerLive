/**
 * Express Server for Gold Prices Platform
 * Includes admin API routes and static file serving
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import admin routes
const adminRoutes = require('./server/routes/admin');

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for dist folder (GitHub Pages build output)
app.use('/Gold-Prices', express.static(path.join(__dirname, 'dist')));
app.use('/', express.static(path.join(__dirname, 'dist')));

// Also serve source files for development
app.use('/src', express.static(__dirname));

// Admin API routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Handle SPA routing for country pages and other nested routes
app.get('/{*path}', (req, res, next) => {
    const filePath = path.join(__dirname, 'dist', req.path);
    
    // If the path is a file, serve it
    if (path.extname(req.path)) {
        return res.sendFile(filePath, (err) => {
            if (err) {
                res.status(404).json({ error: 'File not found' });
            }
        });
    }
    
    // Otherwise, try to serve index.html for SPA routing
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Gold Prices Platform Server`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Admin:   http://localhost:${PORT}/admin`);
    console.log(`   API:     http://localhost:${PORT}/api/admin`);
    console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
