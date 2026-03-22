import { loadRootEnv } from "./load-root-env.js";

loadRootEnv();

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("no-reply@portfolioguardian.com.au"),
  APPLICATION_NOTIFICATION_EMAIL: z
    .string()
    .default("applications@portfolioguardian.com.au"),
  ADMIN_APP_URL: z.string().default("http://localhost:3000/admin"),
});

export const env = envSchema.parse(process.env);
