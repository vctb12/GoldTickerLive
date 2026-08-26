#!/usr/bin/env node
'use strict';

const datacore = require('./datacore-history-v2');

if (require.main === module) {
  try {
    datacore.runCli();
  } catch (error) {
    console.error(`[build-datacore-history] ${error.message || error}`);
    process.exitCode = 1;
  }
}

module.exports = datacore;
