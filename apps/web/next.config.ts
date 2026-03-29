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

/** Vercel Linux builds only need one sharp/libvips arch; shipping all optional @img/* targets blows past the 250MB serverless limit. */
const vercelSharpTraceExcludes =
  process.env.VERCEL === "1"
    ? ([
        "../../node_modules/@img/sharp-darwin-*/**/*",
        "../../node_modules/@img/sharp-libvips-darwin-*/**/*",
        "../../node_modules/@img/sharp-linux-arm*/**/*",
        "../../node_modules/@img/sharp-libvips-linux-arm*/**/*",
        "../../node_modules/@img/sharp-linux-ppc64/**/*",
        "../../node_modules/@img/sharp-libvips-linux-ppc64/**/*",
        "../../node_modules/@img/sharp-linux-riscv64/**/*",
        "../../node_modules/@img/sharp-libvips-linux-riscv64/**/*",
        "../../node_modules/@img/sharp-linux-s390x/**/*",
        "../../node_modules/@img/sharp-libvips-linux-s390x/**/*",
        "../../node_modules/@img/sharp-linuxmusl-*/**/*",
        "../../node_modules/@img/sharp-libvips-linuxmusl-*/**/*",
        "../../node_modules/@img/sharp-wasm32/**/*",
        "../../node_modules/@img/sharp-win32-*/**/*",
      ] as const)
    : [];

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
  transpilePackages: ["@pg/shared", "@pg/submission"],
  /** Native module used by @pg/submission to rasterize the logo for CID inline images. */
  serverExternalPackages: ["sharp"],
  /** Monorepo root so server traces include `packages/*` correctly on Vercel. */
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  /**
   * Keep Next serverless bundles under Vercel's 250MB limit. Without excludes, NFT can pull in
   * the sibling `apps/api` workspace (standalone Express) and redundant app sources even when
   * routes only need `@pg/submission` subpaths.
   */
  outputFileTracingExcludes: {
    "*": ["../api/**/*", ...vercelSharpTraceExcludes],
  },
  /**
   * Next 16+ defaults `lockDistDir` to true (writes `.next/lock` during build). The lock is
   * removed after the build; Vercel's trace step can still try to `lstat` it and fail with ENOENT.
   * Safe to disable on single-threaded CI (e.g. Vercel).
   */
  experimental: {
    lockDistDir: false,
  },
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
