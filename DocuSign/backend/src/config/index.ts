import dotenv from "dotenv";

dotenv.config();

export const getConfig = () => ({
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/internal-esign",
  JWT_SECRET: process.env.JWT_SECRET || "replace_with_strong_jwt_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 12,
  UPLOADS_PATH: process.env.UPLOADS_PATH || "./uploads",
  SIGNING_TOKEN_EXPIRY_HOURS: process.env.SIGNING_TOKEN_EXPIRY_HOURS
    ? Number(process.env.SIGNING_TOKEN_EXPIRY_HOURS)
    : 48,
  UNIVERSAL_BACKEND_URL: process.env.UNIVERSAL_BACKEND_URL || "http://localhost:4000",
  PRODUCT_ID: process.env.PRODUCT_ID || "",
  NODE_ENV: process.env.NODE_ENV || "development"
});

export type Config = ReturnType<typeof getConfig>;

export { getConfig as default };
