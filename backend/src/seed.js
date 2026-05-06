'use strict';

const store = require('./store/inMemoryStore');

const SEED_PRODUCTS = [
  // Apparel
  {
    name: 'Classic White Oxford Shirt',
    description: 'A timeless button-down Oxford shirt in crisp white.',
    price: 49.99,
    currency: 'USD',
    category: 'apparel',
    type: 'shirt',
    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400'],
    stock: 80,
    tags: ['formal', 'classic', 'office'],
    attributes: { size: 'M', color: 'white', material: 'cotton', fit: 'regular' },
  },
  {
    name: 'Slim Fit Dark Wash Jeans',
    description: 'Modern slim fit jeans in dark indigo wash.',
    price: 79.99,
    currency: 'USD',
    category: 'apparel',
    type: 'jeans',
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
    stock: 45,
    tags: ['casual', 'everyday'],
    attributes: { size: '32x32', color: 'indigo', material: 'denim', fit: 'slim' },
  },
  {
    name: 'Merino Wool Crew Neck Sweater',
    description: 'Lightweight merino wool sweater, perfect for layering.',
    price: 89.99,
    currency: 'USD',
    category: 'apparel',
    type: 'sweater',
    images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400'],
    stock: 30,
    tags: ['winter', 'premium'],
    attributes: { size: 'L', color: 'navy', material: 'merino wool', fit: 'regular' },
  },

  // Furniture
  {
    name: 'Solid Oak Writing Desk',
    description: 'Hand-crafted solid oak writing desk with two drawers.',
    price: 649.00,
    currency: 'USD',
    category: 'furniture',
    type: 'desk',
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'],
    stock: 8,
    tags: ['home-office', 'handcrafted', 'oak'],
    attributes: { material: 'oak', color: 'natural', width_cm: 120, depth_cm: 60, height_cm: 76, drawers: 2 },
  },
  {
    name: '3-Seater Linen Sofa',
    description: 'Contemporary linen sofa with solid walnut legs.',
    price: 1299.00,
    currency: 'USD',
    category: 'furniture',
    type: 'sofa',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'],
    stock: 5,
    tags: ['living-room', 'modern', 'premium'],
    attributes: { material: 'linen', color: 'oatmeal', seats: 3, leg_material: 'walnut', width_cm: 220 },
  },
  {
    name: 'Adjustable Bamboo Bookshelf',
    description: 'Eco-friendly 5-tier bamboo bookshelf with adjustable shelves.',
    price: 189.00,
    currency: 'USD',
    category: 'furniture',
    type: 'bookshelf',
    images: ['https://images.unsplash.com/photo-1600429863137-0b1a1cb5a3c0?w=400'],
    stock: 20,
    tags: ['eco', 'storage', 'adjustable'],
    attributes: { material: 'bamboo', color: 'natural', tiers: 5, width_cm: 80, height_cm: 180 },
  },

  // Electronics
  {
    name: 'ProBook 14 Laptop',
    description: '14-inch laptop with Intel i7, 16GB RAM, 512GB SSD.',
    price: 1149.00,
    currency: 'USD',
    category: 'electronics',
    type: 'laptop',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
    stock: 12,
    tags: ['sale', 'productivity', 'portable'],
    attributes: { brand: 'ProBook', processor: 'Intel i7', ram_gb: 16, storage_gb: 512, screen_inches: 14, color: 'silver' },
  },
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Over-ear headphones with 30hr battery and active noise cancellation.',
    price: 299.00,
    currency: 'USD',
    category: 'electronics',
    type: 'headphones',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
    stock: 35,
    tags: ['audio', 'wireless', 'sale'],
    attributes: { brand: 'SoundPro', color: 'midnight black', battery_hours: 30, noise_cancelling: true, connectivity: 'Bluetooth 5.2' },
  },
  {
    name: '27-inch 4K Monitor',
    description: 'IPS 4K UHD display with 99% sRGB coverage and USB-C.',
    price: 549.00,
    currency: 'USD',
    category: 'electronics',
    type: 'monitor',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'],
    stock: 18,
    tags: ['home-office', '4K', 'productivity'],
    attributes: { brand: 'ViewMax', screen_inches: 27, resolution: '3840x2160', panel: 'IPS', refresh_rate_hz: 60, color: 'black' },
  },
];

function seed() {
  const existing = store.search({ limit: 1 });
  if (existing.total > 0) return; // already seeded — idempotent

  SEED_PRODUCTS.forEach(p => store.create(p));

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'seed',
    count: SEED_PRODUCTS.length,
    message: `Seeded ${SEED_PRODUCTS.length} products`,
  }));
}

module.exports = { seed };
