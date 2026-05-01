const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const nodeModulesDir = path.join(repoRoot, 'node_modules');

function readPackageJSON() {
  const packageJSONPath = path.join(repoRoot, 'package.json');
  return JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
}

function hasNodeModules() {
  try {
    return fs.statSync(nodeModulesDir).isDirectory();
  } catch {
    return false;
  }
}

function main() {
  if (hasNodeModules()) {
    return;
  }

  const packageJSON = readPackageJSON();
  const dependencies = Object.keys(packageJSON.dependencies ?? {});
  const missingHint = dependencies.length
    ? `Run \`npm install\` before \`npm test\` (missing node_modules; needs: ${dependencies.join(', ')}).`
    : 'Run `npm install` before `npm test` (missing node_modules).';

  console.error(missingHint);
  process.exitCode = 1;
}

main();
