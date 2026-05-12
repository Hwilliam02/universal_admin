import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getPublicKey } from '../config/publicKey.js';

const MASTER_URL = process.env.MASTER_BACKEND_URL || 'http://localhost:4000/server1/api/v1';
const PRODUCT_ID = process.env.CALCULATOR_PRODUCT_ID;

const masterClient = axios.create({
  baseURL: MASTER_URL,
  headers: { 'Content-Type': 'application/json' },
});

const verifyAppAccessToken = async (token) => {
  const publicKey = await getPublicKey();
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
};

const ensureProductConfigured = () => {
  if (!PRODUCT_ID || PRODUCT_ID === 'PASTE_PRODUCT_ID_HERE') {
    const error = new Error('CALCULATOR_PRODUCT_ID is not set in .env');
    error.statusCode = 500;
    throw error;
  }
};

const validateProductId = (productId) => {
  if (!productId) {
    const error = new Error('product_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (productId !== PRODUCT_ID) {
    const error = new Error('Invalid product_id');
    error.statusCode = 403;
    throw error;
  }

  return productId;
};

const login = async (req, res) => {
  try {
    ensureProductConfigured();

    const { email, password, product_id } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const productId = validateProductId(product_id);

    const { data } = await masterClient.post('/universal-auth/login', {
      email,
      password,
      product_id: productId,
    });

    if (data.status === 'verification_required') {
      return res.status(200).json(data);
    }

    let appAccessToken = data.appAccessToken;
    let productName = data.product_name;

    if (!appAccessToken && data.refreshToken) {
      const refreshResponse = await masterClient.post('/universal-auth/refresh', {
        refresh_token: data.refreshToken,
        product_id: productId,
      });

      appAccessToken = refreshResponse.data.accessToken;
      productName = refreshResponse.data.product_name || productName;
    }

    if (!appAccessToken) {
      return res.status(502).json({ error: 'Master backend did not return an app access token' });
    }

    await verifyAppAccessToken(appAccessToken);

    return res.json({
      ...data,
      appAccessToken,
      product_name: productName,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message || 'Failed to login via calculator backend';
    return res.status(status).json({ error: message });
  }
};

const signup = async (req, res) => {
  try {
    ensureProductConfigured();

    const { username, email, password, product_id } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    const productId = validateProductId(product_id);

    const signupResponse = await masterClient.post('/universal-auth/signup', {
      username,
      email,
      password,
      product_id: productId,
    });

    const signupData = signupResponse.data;

    if (signupData.status === 'verification_required') {
      return res.status(201).json(signupData);
    }

    const loginResponse = await masterClient.post('/universal-auth/login', {
      email,
      password,
      product_id: productId,
    });

    if (loginResponse.data.status === 'verification_required') {
      return res.status(200).json(loginResponse.data);
    }

    let appAccessToken = loginResponse.data.appAccessToken;
    let productName = loginResponse.data.product_name;

    if (!appAccessToken && loginResponse.data.refreshToken) {
      const refreshResponse = await masterClient.post('/universal-auth/refresh', {
        refresh_token: loginResponse.data.refreshToken,
        product_id: productId,
      });

      appAccessToken = refreshResponse.data.accessToken;
      productName = refreshResponse.data.product_name || productName;
    }

    if (!appAccessToken) {
      return res.status(502).json({ error: 'Master backend did not return an app access token' });
    }

    await verifyAppAccessToken(appAccessToken);

    return res.status(201).json({
      ...loginResponse.data,
      appAccessToken,
      product_name: productName,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message || 'Failed to signup via calculator backend';
    return res.status(status).json({ error: message });
  }
};

const verifyCode = async (req, res) => {
  try {
    ensureProductConfigured();

    const { email, verification_code } = req.body;
    if (!email || !verification_code) {
      return res.status(400).json({ error: 'email and verification_code are required' });
    }

    const { data } = await masterClient.post('/universal-auth/verify-user', {
      email,
      verification_code,
    });

    return res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message || 'Verification failed';
    return res.status(status).json({ error: message });
  }
};

export { login, signup, verifyCode };
