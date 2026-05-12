import { Request, Response } from "express";
import fs from "fs";
import { safeResolveUploadPath } from "../utils/path.js";
import { AppError } from "../types/index.js";

export const serveFile = (req: Request, res: Response): void => {
  const { type, filename } = req.params as { type: "original" | "signed" | "signature"; filename: string };
  const mappedType = type === "signature" ? "signature" : type;

  const fullPath = safeResolveUploadPath(type === "signature" ? "signature" : (type as "original" | "signed"), filename);

  if (!fs.existsSync(fullPath)) throw new AppError("File not found", 404);

  res.sendFile(fullPath);
};
