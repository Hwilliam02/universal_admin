import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../types/index.js";

/**
 * Express middleware that checks the results of express-validator chains.
 * Place after validator arrays in route definitions.
 */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new AppError("Validation failed", 400);
    (err as any).details = errors.array();
    throw err;
  }
  next();
}
