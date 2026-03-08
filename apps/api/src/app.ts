import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { publicApplicationsRouter } from "./routes/public/applications.js";
import { adminApplicationsRouter } from "./routes/admin/applications.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/applications", publicApplicationsRouter);
  app.use("/admin/applications", adminApplicationsRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        issues: error.flatten(),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Unexpected server error",
    });
  });

  return app;
}
