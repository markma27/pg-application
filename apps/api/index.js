/**
 * Vercel serverless entry. Exports the Express app as default so Vercel
 * can invoke it per request. Do not use app.listen() here—Vercel runs
 * one invocation per request, not a long-lived server.
 */
import { createApp } from './dist/apps/api/src/app.js';
export default createApp();
