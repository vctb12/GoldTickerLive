const fs = require('fs');
const path = require('path');

// Simple ETL: copy baseline JSON into server data with provenance
const src = path.resolve(__dirname, '../../src/data/historical-baseline.json');
const destDir = path.resolve(__dirname, '../../server/data');
const dest = path.join(destDir, 'historical-baseline.json');

function main() {
  if (!fs.existsSync(src)) {
    console.error('Source baseline not found:', src);
    process.exitCode = 2;
    return;
  }

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const data = JSON.parse(fs.readFileSync(src, 'utf8'));
  const out = {
    generatedAt: new Date().toISOString(),
    source: 'src/data/historical-baseline.json',
    records: data,
  };

  fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', dest);
}

if (require.main === module) main();

module.exports = { main };
