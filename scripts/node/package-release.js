const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', '..', 'dist');
const OUT_DIR = path.join(__dirname, '..', '..', 'release');

function summarize() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ not found; run build first');
    process.exit(1);
  }
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else files.push({ path: path.relative(DIST, p), size: stat.size });
    }
  }
  walk(DIST);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'release-manifest.json'),
    JSON.stringify({ files, generatedAt: new Date().toISOString() }, null, 2)
  );
  console.log('Wrote release/release-manifest.json');
}

summarize();
