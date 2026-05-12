import { generateFileHash } from "../utils/hash.js";

export const verifyFileHash = async (filePath: string, expectedHash: string): Promise<boolean> => {
  const h = await generateFileHash(filePath);
  return h === expectedHash;
};
