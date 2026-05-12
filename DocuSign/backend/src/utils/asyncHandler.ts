import { Request, Response, NextFunction } from "express";

/**
 * Wraps an Express route handler (sync or async) so that any thrown
 * error — including rejected promises — is forwarded to Express's
 * error‑handling middleware via next(err) instead of crashing the process.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => any) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
