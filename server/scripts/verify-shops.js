const fs = require('fs')
const path = require('path')

const src = path.resolve(__dirname, '../../data/shops-data.json')
const outDir = path.resolve(__dirname, '../../build')
const outFile = path.join(outDir, 'shops-verification.json')

function verify() {
  if (!fs.existsSync(src)) {
    console.error('Shops data not found at', src)
    process.exitCode = 2
    return
  }

  const shops = JSON.parse(fs.readFileSync(src, 'utf8'))
  const issues = []

  shops.forEach((s, i) => {
    const missing = []
    if (!s.id && !s.slug) missing.push('id|slug')
    if (!s.name) missing.push('name')
    if (!s.country) missing.push('country')
    if (!s.city && !s.location) missing.push('city|location')
    if (missing.length) issues.push({ index: i, missing, shop: s })
  })

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const report = { checkedAt: new Date().toISOString(), total: shops.length, issues }
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8')
  console.log('Wrote', outFile, 'issues:', issues.length)
}

if (require.main === module) verify()

module.exports = { verify }
