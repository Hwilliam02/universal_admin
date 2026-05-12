import path from "path";
import fs from "fs/promises";
import { getConfig } from "../config/index.js";

const config = getConfig();

export const ensureUploadDirs = async (): Promise<void> => {
  await fs.mkdir(path.resolve(config.UPLOADS_PATH, "original"), { recursive: true });
  await fs.mkdir(path.resolve(config.UPLOADS_PATH, "signed"), { recursive: true });
  await fs.mkdir(path.resolve(config.UPLOADS_PATH, "signatures"), { recursive: true });
};
