import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { generalLimiter } from "./middlewares/rateLimit.middleware";

import authRoutes from "./routes/auth.routes";
import bidderRoutes from "./routes/bidder.routes";
import templateRoutes from "./routes/template.routes";
import { adminProfileRouter, bidderProfileRouter } from "./routes/profile.routes";
import { adminGenerationRouter, bidderGenerationRouter } from "./routes/generation.routes";
import { adminWorkLogRouter, bidderWorkLogRouter } from "./routes/workLog.routes";
import filesRoutes from "./routes/files.routes";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use(generalLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

  app.use("/api/auth", authRoutes);

  // Admin
  app.use("/api/admin/bidders", bidderRoutes);
  app.use("/api/admin/profiles", adminProfileRouter);
  app.use("/api/admin/templates", templateRoutes);
  app.use("/api/admin/generations", adminGenerationRouter);
  app.use("/api/admin/work-logs", adminWorkLogRouter);

  // Bidder
  app.use("/api/bidder/profiles", bidderProfileRouter);
  app.use("/api/bidder/generations", bidderGenerationRouter);
  app.use("/api/bidder/work-logs", bidderWorkLogRouter);

  // Authenticated file proxy
  app.use("/files", filesRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
