#!/usr/bin/env node
'use strict';

const datacore = require('./datacore-sync-v2');

if (require.main === module) {
  datacore
    .run()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(`[sync-price-snapshot] ${error.message || error}`);
      process.exitCode = 1;
    });
}

module.exports = datacore;
