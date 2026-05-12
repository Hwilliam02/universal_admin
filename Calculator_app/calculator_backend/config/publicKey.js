/**
 * Fetches and caches the Calculator product's app_public_key from the Universal Master.
 * Called once on server startup. Used by verifyToken middleware to verify RS256 JWTs.
 */
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const MASTER_URL   = process.env.MASTER_BACKEND_URL || 'http://localhost:4000/server1/api/v1';
const PRODUCT_ID   = process.env.CALCULATOR_PRODUCT_ID;

let cachedPublicKey = null;

export const getPublicKey = async () => {
  if (cachedPublicKey) return cachedPublicKey;

  if (!PRODUCT_ID || PRODUCT_ID === 'PASTE_PRODUCT_ID_HERE') {
    throw new Error('CALCULATOR_PRODUCT_ID is not set in .env. Run the registration script first.');
  }

  try {
    const { data } = await axios.get(
      `${MASTER_URL}/products/by-product-id/${PRODUCT_ID}`
    );
    // Master returns: { product_id, name, app_public_key }
    if (!data.app_public_key) {
      throw new Error('app_public_key missing from Master response');
    }
    cachedPublicKey = data.app_public_key;
    console.log('✅ Public key fetched and cached from Universal Master');
    return cachedPublicKey;
  } catch (err) {
    throw new Error(`Failed to fetch public key from Master: ${err.message}`);
  }
};

/** Call this once at startup to warm up the cache */
export const initPublicKey = async () => {
  try {
    await getPublicKey();
  } catch (err) {
    console.error('⚠️  Could not pre-fetch public key:', err.message);
    console.error('   Token verification will retry on first request.');
  }
};
