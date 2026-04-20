module.exports = {
  defaults: {
    timeout: 30000,
    standard: 'WCAG2AA',
  },
  urls: [
    'http://localhost:8080/',
    'http://localhost:8080/tracker.html',
    'http://localhost:8080/shops.html',
  ],
  runners: ['htmlcs'],
};
