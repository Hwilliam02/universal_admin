import { createHash } from "crypto";
import { promises as fs } from "fs";

export const generateFileHash = async (filePath: string): Promise<string> => {
  const buf = await fs.readFile(filePath);
  const hash = createHash("sha256");
  hash.update(buf);
  return hash.digest("hex");
};
