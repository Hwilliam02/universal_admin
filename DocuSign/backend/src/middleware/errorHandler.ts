import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/index.js";

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction): void => {
  // Accept statusCode from AppError instances or any error that carries one
  const status =
    err instanceof AppError
      ? err.statusCode
      : (err as any).statusCode
        ? (err as any).statusCode
        : 500;

  const body: { message: string; details?: any; stack?: string } = { message: err.message };

  // Attach validation/details if present on the error
  if ((err as any).details) {
    body.details = (err as any).details;
  }

  if (process.env.NODE_ENV !== "production") {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};
