import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { json, urlencoded } from "express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { getConfig } from "./config/index.js";
import { ensureUploadDirs } from "./services/fileService.js";

dotenv.config();

const config = getConfig();

export const createApp = async (): Promise<Application> => {
  const app: Application = express();

  app.use(
    helmet({
      // Disable policies that conflict with cross-origin API access.
      // The frontend runs on a different port, so every request is cross-origin.
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );
  // HTTP request logging
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return cb(null, true);
        // Allow localhost and any private/LAN IP on the expected ports
        const allowed =
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.[\d.]+|10\.[\d.]+|172\.(1[6-9]|2[0-9]|3[01])\.[\d.]+)(:\d+)?$/.test(origin);
        cb(null, allowed);
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Authorization"]
    })
  );

  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ extended: false }));

  app.use(rateLimiter());

  // Connect DB
  // Ensure upload directories exist before accepting uploads
  await ensureUploadDirs();

  await mongoose.connect(config.MONGO_URI, {
    // options left to defaults in Mongoose 7
  });

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
