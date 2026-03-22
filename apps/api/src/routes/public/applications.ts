import { Router } from "express";
import { fullApplicationSubmissionSchema } from "@pg/shared";
import { submitApplication } from "@pg/submission";

export const publicApplicationsRouter = Router();

publicApplicationsRouter.post("/", async (req, res, next) => {
  try {
    const payload = fullApplicationSubmissionSchema.parse(req.body);
    const result = await submitApplication(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
