#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'data', 'shops.js');
const OUT = path.join(__dirname, '..', '..', 'data', 'shops-data.json');

function extract() {
  const src = fs.readFileSync(SRC, 'utf8');
  const re = /export\s+const\s+SHOPS\s*=\s*(\[[\s\S]*?\]);/m;
  const m = src.match(re);
  if (!m) {
    console.error('SHOPS array not found in', SRC);
    process.exit(2);
  }
  const arrCode = m[1];
  const cleaned = arrCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  let arr;
  try {
    arr = Function('return ' + cleaned)();
  } catch (e) {
    console.error('Failed to eval SHOPS array:', e.message);
    process.exit(3);
  }
  if (!Array.isArray(arr)) {
    console.error('Extracted shops is not an array');
    process.exit(4);
  }

  const normalized = arr.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city || '',
    country: s.countryCode || s.country || '',
    market: s.market || '',
    type: s.category || 'shop',
    phone: s.phone || '',
    email: s.email || '',
    website: s.website || '',
    address: s.address || '',
    latitude: s.latitude || null,
    longitude: s.longitude || null,
    hours: s.hours || '',
    verified: !!s.verified,
    notes: s.notes || '',
    specialties: s.specialties || [],
    featured: !!s.featured,
  }));

  fs.writeFileSync(OUT, JSON.stringify(normalized, null, 2), 'utf8');
  console.log('Wrote', OUT);
}

extract();
