import rateLimit from "express-rate-limit";

/** Global limiter — high ceiling for normal API usage */
export const rateLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });

/** Strict limiter for auth endpoints only */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});
