/**
 * One-time script to register the Calculator App as a product in the Universal Master DB.
 * Run from universal-backend directory:
 *   node scripts/registerCalculatorProduct.js
 *
 * Copy the printed product_id into:
 *   Calculator_app/calculator_backend/.env  → CALCULATOR_PRODUCT_ID=...
 *   Calculator_app/calculator_frontend/.env → VITE_CALCULATOR_PRODUCT_ID=...
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/universal_admin';

// Inline schema (avoid circular imports)
const productRegistrySchema = new mongoose.Schema({
  product_id:          { type: String, default: uuidv4, unique: true },
  name:                { type: String, required: true, unique: true },
  architecture_type:   { type: String, enum: ['SINGLE_DB', 'MULTI_TENANT'], required: true },
  db_driver:           { type: String, enum: ['MONGODB', 'MYSQL'], required: true },
  db_uri:              { type: String, required: true },
  app_private_key:     { type: String, required: true },
  app_public_key:      { type: String, required: true },
  verification_method: { type: String, enum: ['code', 'link', 'none'], default: 'none' },
  frontend_url:        { type: String, default: null },
  ui_schema:           [{ field_name: String, label: String, type: String, required: Boolean }]
}, { timestamps: true });

const ProductRegistry = mongoose.model('ProductRegistry', productRegistrySchema);

const generateRSAKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
};

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to Universal Master DB\n');

    // Check if already registered
    const existing = await ProductRegistry.findOne({ name: 'Universal Calculator' });
    if (existing) {
      console.log('ℹ️  Calculator product already registered.');
      console.log('─────────────────────────────────────────────');
      console.log(`CALCULATOR_PRODUCT_ID=${existing.product_id}`);
      console.log('─────────────────────────────────────────────');
      process.exit(0);
    }

    const { publicKey, privateKey } = generateRSAKeyPair();

    const product = await ProductRegistry.create({
      name:               'Universal Calculator',
      architecture_type:  'SINGLE_DB',
      db_driver:          'MONGODB',
      db_uri:             'mongodb://localhost:27017/calculator_db',
      app_private_key:    privateKey,
      app_public_key:     publicKey,
      verification_method:'none',
      frontend_url:       'http://localhost:5173'
    });

    console.log('🎉 Calculator App registered successfully!\n');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('Copy these into your .env files:\n');
    console.log(`CALCULATOR_PRODUCT_ID=${product.product_id}`);
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('\nPublic Key (already saved in DB, for reference):');
    console.log(publicKey);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
