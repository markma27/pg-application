import { config as loadDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/** Walk up until we find the monorepo root (package name `pg-application`). */
function resolveMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 14; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
          name?: string;
        };
        if (pkg.name === "pg-application") {
          return dir;
        }
      } catch {
        /* keep walking */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Last resort: cwd is already the repo root
  const here = path.join(process.cwd(), "package.json");
  if (existsSync(here)) {
    try {
      const pkg = JSON.parse(readFileSync(here, "utf8")) as { name?: string };
      if (pkg.name === "pg-application") {
        return process.cwd();
      }
    } catch {
      /* empty */
    }
  }
  return path.join(process.cwd(), "..", "..");
}

const monorepoRoot = resolveMonorepoRoot();

// `loadEnvConfig` from @next/env can miss root `.env.local` in monorepos; load explicitly so
// `process.env` is populated before the `env` block (required for client-side NEXT_PUBLIC_*).
if (existsSync(path.join(monorepoRoot, ".env"))) {
  loadDotenv({ path: path.join(monorepoRoot, ".env") });
}
if (existsSync(path.join(monorepoRoot, ".env.local"))) {
  loadDotenv({ path: path.join(monorepoRoot, ".env.local"), override: true });
}

/**
 * Inline public env for the browser bundle (monorepo root `.env.local` is outside `apps/web`).
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@pg/shared"],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
  },
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
