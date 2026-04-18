const fs = require('fs')
const path = require('path')

test('shops-data.json has required fields', () => {
  const src = path.resolve(__dirname, '../data/shops-data.json')
  expect(fs.existsSync(src)).toBe(true)
  const shops = JSON.parse(fs.readFileSync(src, 'utf8'))
  expect(Array.isArray(shops)).toBe(true)
  const problems = shops.filter(s => !s.name || (!s.country && !s.location))
  expect(problems.length).toBe(0)
})
