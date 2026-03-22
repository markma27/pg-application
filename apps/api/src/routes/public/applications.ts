import { Router } from "express";
import { fullApplicationSubmissionSchema } from "../../../../../packages/shared/src/index.js";
import { submitApplication } from "../../services/submission.service.js";

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
