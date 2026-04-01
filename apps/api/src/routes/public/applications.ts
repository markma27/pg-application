import { Router } from "express";
import { fullApplicationSubmissionSchema, isRepresentativeAuthoritySatisfied } from "@pg/shared";
import { submitApplication } from "@pg/submission";

export const publicApplicationsRouter = Router();

publicApplicationsRouter.post("/", async (req, res, next) => {
  try {
    const payload = fullApplicationSubmissionSchema.parse(req.body);
    if (!isRepresentativeAuthoritySatisfied(payload)) {
      res.status(400).json({
        message:
          "When your role is Adviser / representative, you must confirm that you have authority to submit on behalf of the client.",
      });
      return;
    }
    const result = await submitApplication(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
