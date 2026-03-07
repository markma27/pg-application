import { Router } from "express";

export const adminApplicationsRouter = Router();

adminApplicationsRouter.get("/", (_req, res) => {
  res.json({
    items: [],
    message: "Admin application list will be backed by Supabase in the next step.",
  });
});

adminApplicationsRouter.get("/:id", (req, res) => {
  res.json({
    id: req.params.id,
    message: "Admin application detail will be backed by Supabase in the next step.",
  });
});
