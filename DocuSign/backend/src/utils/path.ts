import path from "path";
import { getConfig } from "../config/index.js";
import { AppError } from "../types/index.js";

const config = getConfig();

export const safeResolveUploadPath = (type: "original" | "signed" | "signature", filename: string): string => {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new AppError("Invalid filename", 400);
  }

  const base = path.resolve(process.cwd(), config.UPLOADS_PATH);
  let sub = "";
  if (type === "original") sub = "original";
  if (type === "signed") sub = "signed";
  if (type === "signature") sub = "signatures";

  const full = path.join(base, sub, filename);

  if (!full.startsWith(base)) {
    throw new AppError("Invalid file path", 400);
  }

  return full;
};
