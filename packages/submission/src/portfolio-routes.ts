/**
 * Entry used by Next.js API routes for portfolio uploads only — avoids tracing the full
 * `@pg/submission` barrel (submit + notification email stack) into those handlers.
 */
export {
  prepareApplicationPortfolioUploads,
  finalizeApplicationPortfolioUploads,
  PORTFOLIO_STORAGE_BUCKET,
  MAX_PORTFOLIO_DOCS_PER_ENTITY,
  MAX_PORTFOLIO_FILE_BYTES,
} from "./services/portfolio-upload.service.js";
export { portfolioPrepareRequestSchema, portfolioFinalizeRequestSchema } from "./portfolio-api.schema.js";
