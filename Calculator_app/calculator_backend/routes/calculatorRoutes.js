import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import requireSubscription from '../middleware/requireSubscription.js';
import { compute, getHistory, getSubscriptionInfo } from '../controllers/calculatorController.js';

const router = express.Router();

// All routes require a valid RS256 token
router.use(verifyToken);

// GET subscription info — no subscription gate (just info)
router.get('/subscription-info', getSubscriptionInfo);

// GET history — no gate (free users can still see their last 2)
router.get('/history', getHistory);

// POST compute — gated by subscription
router.post('/compute', requireSubscription, compute);

export default router;
