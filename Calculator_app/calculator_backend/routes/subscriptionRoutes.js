import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import { getStatus, createCheckoutSession, handleWebhook } from '../controllers/subscriptionController.js';

const router = express.Router();

// Stripe webhook — must receive raw body, no auth
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.get('/status', verifyToken, getStatus);
router.post('/create-checkout-session', verifyToken, createCheckoutSession);

export default router;
