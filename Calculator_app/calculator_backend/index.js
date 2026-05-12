import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import dbConnect from './config/db.js';
import { initPublicKey } from './config/publicKey.js';
import authRoutes from './routes/authRoutes.js';
import calculatorRoutes from './routes/calculatorRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT ;
const allowedOrigins = (
  process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow tools like curl/Postman that do not send an Origin header.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Stripe Webhook needs raw body BEFORE express.json() ───────────────────────
// (Already handled per-route in subscriptionRoutes with express.raw)

// ── General middleware ─────────────────────────────────────────────────────────
app.use(morgan('dev'));

// Apply express.json() to all routes EXCEPT the Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/subscribe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});


// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'calculator-backend' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/calculator',  calculatorRoutes);
app.use('/api/subscribe',   subscriptionRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
const start = async () => {
  await dbConnect();
  await initPublicKey(); // warm cache — fetches public key from Universal Master
  app.listen(PORT, () => {
    console.log(`🚀 Calculator Backend running on http://localhost:${PORT}`);
  });
};

start();
