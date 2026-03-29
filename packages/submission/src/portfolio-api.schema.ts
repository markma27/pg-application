import { z } from "zod";
import {
  MAX_PORTFOLIO_DOCS_PER_ENTITY,
  MAX_PORTFOLIO_FILE_BYTES,
} from "./services/portfolio-upload.service.js";

const prepareFileSchema = z.object({
  name: z.string().min(1),
  contentType: z.string(),
  size: z.number().int().min(1).max(MAX_PORTFOLIO_FILE_BYTES),
});

const prepareUploadGroupSchema = z.object({
  entityFormId: z.string().trim().min(1),
  files: z.array(prepareFileSchema).max(MAX_PORTFOLIO_DOCS_PER_ENTITY),
});

/** Body for POST .../portfolio/prepare */
export const portfolioPrepareRequestSchema = z.object({
  uploadToken: z.string().uuid(),
  uploads: z.array(prepareUploadGroupSchema),
});

const finalizeFileSchema = z.object({
  path: z.string().trim().min(1),
  originalName: z.string(),
  sizeBytes: z.number().int().min(1).max(MAX_PORTFOLIO_FILE_BYTES),
  contentType: z.string(),
});

/** Body for POST .../portfolio/finalize */
export const portfolioFinalizeRequestSchema = z.object({
  uploadToken: z.string().uuid(),
  documents: z.array(
    z.object({
      entityFormId: z.string().trim().min(1),
      files: z.array(finalizeFileSchema).max(MAX_PORTFOLIO_DOCS_PER_ENTITY),
    }),
  ),
});
