/**
 * Shop Manager
 * CRUD operations for shops with confidence scoring and validation
 */

const fs = require('fs');
const path = require('path');
const { logAction } = require('../audit-log');

const SHOPS_FILE = path.join(__dirname, '../../data/shops-data.json');

// Ensure data directory exists
const dataDir = path.dirname(SHOPS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize shops file if not exists
function initShopsFile() {
  if (!fs.existsSync(SHOPS_FILE)) {
    fs.writeFileSync(SHOPS_FILE, JSON.stringify([], null, 2));
  }
}

// Read all shops
function getAllShops() {
  initShopsFile();
  try {
    const data = fs.readFileSync(SHOPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading shops:', err);
    return [];
  }
}

// Save all shops
function saveAllShops(shops) {
  initShopsFile();
  fs.writeFileSync(SHOPS_FILE, JSON.stringify(shops, null, 2));
}

// Calculate confidence score based on shop data completeness
function calculateConfidenceScore(shop) {
  let score = 0;
  let maxScore = 0;

  // Name (required) - 20 points
  maxScore += 20;
  if (shop.name && shop.name.trim().length > 0) score += 20;

  // City - 15 points
  maxScore += 15;
  if (shop.city && shop.city.trim().length > 0) score += 15;

  // Country - 15 points
  maxScore += 15;
  if (shop.country && shop.country.trim().length > 0) score += 15;

  // Contact info - 25 points
  maxScore += 25;
  if (shop.phone) score += 10;
  if (shop.email) score += 8;
  if (shop.website) score += 7;

  // Address/Location - 15 points
  maxScore += 15;
  if (shop.address) score += 8;
  if (shop.latitude && shop.longitude) score += 7;

  // Operating hours - 10 points
  maxScore += 10;
  if (shop.hours) score += 10;

  // Verification bonus - 20 points
  if (shop.verified) score += 20;

  return Math.round((score / (maxScore + 20)) * 100);
}

// Determine contact quality
function determineContactQuality(shop) {
  const contactPoints = [shop.phone ? 1 : 0, shop.email ? 1 : 0, shop.website ? 1 : 0].reduce(
    (a, b) => a + b,
    0
  );

  if (contactPoints >= 3) return 'high';
  if (contactPoints >= 2) return 'medium';
  return 'low';
}

// Get shop by ID
function getShopById(id) {
  const shops = getAllShops();
  return shops.find((s) => s.id === id);
}

// Create new shop
function createShop(shopData, actor) {
  const shops = getAllShops();

  // Validate required fields
  if (!shopData.name || !shopData.name.trim()) {
    return { success: false, message: 'Shop name is required' };
  }

  const newShop = {
    id: 'shop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    name: shopData.name.trim(),
    city: shopData.city?.trim() || '',
    country: shopData.country?.trim() || '',
    type: shopData.type || 'direct',
    phone: shopData.phone?.trim() || '',
    email: shopData.email?.trim() || '',
    website: shopData.website?.trim() || '',
    address: shopData.address?.trim() || '',
    latitude: shopData.latitude || null,
    longitude: shopData.longitude || null,
    hours: shopData.hours || '',
    verified: shopData.verified || false,
    notes: shopData.notes || '',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };

  // Calculate derived fields
  newShop.confidence = calculateConfidenceScore(newShop);
  newShop.contactQuality = determineContactQuality(newShop);

  shops.push(newShop);
  saveAllShops(shops);

  logAction(actor, 'create', 'shop', newShop.id, newShop);

  return { success: true, shop: newShop };
}

// Update shop
function updateShop(id, updates, actor) {
  const shops = getAllShops();
  const index = shops.findIndex((s) => s.id === id);

  if (index === -1) {
    return { success: false, message: 'Shop not found' };
  }

  const oldShop = { ...shops[index] };

  // Update allowed fields
  const allowedFields = [
    'name',
    'city',
    'country',
    'type',
    'phone',
    'email',
    'website',
    'address',
    'latitude',
    'longitude',
    'hours',
    'verified',
    'notes',
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      if (typeof updates[field] === 'string') {
        shops[index][field] = updates[field].trim();
      } else {
        shops[index][field] = updates[field];
      }
    }
  });

  // Recalculate derived fields
  shops[index].confidence = calculateConfidenceScore(shops[index]);
  shops[index].contactQuality = determineContactQuality(shops[index]);
  shops[index].updatedAt = new Date().toISOString();
  shops[index].updatedBy = actor;

  saveAllShops(shops);

  const changes = {};
  allowedFields.forEach((field) => {
    if (oldShop[field] !== shops[index][field]) {
      changes[field] = { from: oldShop[field], to: shops[index][field] };
    }
  });

  logAction(actor, 'update', 'shop', id, changes);

  return { success: true, shop: shops[index] };
}

// Delete shop
function deleteShop(id, actor) {
  const shops = getAllShops();
  const index = shops.findIndex((s) => s.id === id);

  if (index === -1) {
    return { success: false, message: 'Shop not found' };
  }

  const deletedShop = shops.splice(index, 1)[0];
  saveAllShops(shops);

  logAction(actor, 'delete', 'shop', id, deletedShop);

  return { success: true, message: 'Shop deleted' };
}

// Get shops with filters
function getFilteredShops(options = {}) {
  let shops = getAllShops();

  if (options.search) {
    const searchLower = options.search.toLowerCase();
    shops = shops.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.city?.toLowerCase().includes(searchLower) ||
        s.country?.toLowerCase().includes(searchLower)
    );
  }

  if (options.status) {
    if (options.status === 'verified') {
      shops = shops.filter((s) => s.verified);
    } else if (options.status === 'unverified') {
      shops = shops.filter((s) => !s.verified);
    } else if (options.status === 'pending') {
      shops = shops.filter((s) => !s.verified);
    }
  }

  if (options.type) {
    shops = shops.filter((s) => s.type === options.type);
  }

  if (options.city) {
    shops = shops.filter((s) => s.city === options.city);
  }

  if (options.country) {
    shops = shops.filter((s) => s.country === options.country);
  }

  if (options.minConfidence) {
    shops = shops.filter((s) => s.confidence >= options.minConfidence);
  }

  // Sort
  if (options.sortBy) {
    const field = options.sortBy;
    const desc = options.sortDesc === true;
    shops.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }

  // Pagination
  const page = options.page || 1;
  const limit = options.limit || 50;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    shops: shops.slice(start, end),
    total: shops.length,
    page,
    limit,
    totalPages: Math.ceil(shops.length / limit),
  };
}

// Batch import shops
function batchImportShops(shopList, actor) {
  const shops = getAllShops();
  const imported = [];
  const errors = [];

  shopList.forEach((shopData, index) => {
    try {
      if (!shopData.name || !shopData.name.trim()) {
        errors.push({ index, error: 'Missing name' });
        return;
      }

      const newShop = {
        id: 'shop_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 7),
        name: shopData.name.trim(),
        city: shopData.city?.trim() || '',
        country: shopData.country?.trim() || '',
        type: shopData.type || 'direct',
        phone: shopData.phone?.trim() || '',
        email: shopData.email?.trim() || '',
        website: shopData.website?.trim() || '',
        address: shopData.address?.trim() || '',
        latitude: shopData.latitude || null,
        longitude: shopData.longitude || null,
        hours: shopData.hours || '',
        verified: shopData.verified || false,
        createdAt: new Date().toISOString(),
        createdBy: actor,
      };

      newShop.confidence = calculateConfidenceScore(newShop);
      newShop.contactQuality = determineContactQuality(newShop);

      shops.push(newShop);
      imported.push(newShop);
    } catch (err) {
      errors.push({ index, error: err.message });
    }
  });

  saveAllShops(shops);
  logAction(actor, 'create', 'shop', 'batch_import', {
    count: imported.length,
    errors: errors.length,
  });

  return {
    success: true,
    imported: imported.length,
    errors: errors.length,
    details: { imported, errors },
  };
}

module.exports = {
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getFilteredShops,
  batchImportShops,
  calculateConfidenceScore,
  determineContactQuality,
};
