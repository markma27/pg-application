import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import { publicApplicationsRouter } from "./routes/public/applications.js";

function parseCorsOrigin(): string | string[] | boolean {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return false;
  }
  if (raw === "*") {
    return true;
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: parseCorsOrigin(),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      maxAge: 86400,
    }),
  );
  app.use(express.json({ limit: "512kb" }));

  const submitLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again shortly." },
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "PortfolioGuardian API",
      status: "running",
      health: "/health",
      applications: "/applications",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/applications", submitLimiter, publicApplicationsRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed.",
      });
    }

    console.error(error instanceof Error ? error.message : "Unexpected server error");
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  });

  return app;
}
