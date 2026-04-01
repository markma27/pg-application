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

/**
 * Images are unoptimized (no sharp at runtime), so exclude ALL sharp / @img platform binaries.
 * Patterns are relative to outputFileTracingRoot (monorepo root); duplicate with `../../` prefix
 * so both absolute and relative NFT resolutions are covered.
 */
const sharpExcludes = [
  "node_modules/sharp/**/*",
  "node_modules/@img/**/*",
];

/**
 * Exclude SWC native binaries — only needed at build time, never at runtime in serverless.
 */
const swcExcludes = [
  "node_modules/@next/swc-*/**/*",
  "node_modules/@next/.swc-*/**/*",
];

/**
 * Build cache, dev artifacts, and other items that must never land in serverless functions.
 */
const cacheExcludes = [
  "apps/web/.next/cache/**/*",
  ".next/cache/**/*",
  "**/.next/cache/**/*",
  "node_modules/.cache/**/*",
];

const vercelExcludes = [...sharpExcludes, ...swcExcludes, ...cacheExcludes].flatMap(
  (p) => (p.startsWith("node_modules/") ? [p, `../../${p}`] : [p]),
);

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
  /** Monorepo root so server traces include `packages/*` correctly on Vercel. */
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  /**
   * Keep Next serverless bundles under Vercel's 250MB limit. Without excludes, NFT can pull in
   * the sibling `apps/api` workspace (standalone Express) and redundant app sources even when
   * routes only need `@pg/submission` subpaths.
   */
  outputFileTracingExcludes: {
    "*": [
      "apps/api/**/*",
      "../api/**/*",
      ...vercelExcludes,
    ],
  },
  /**
   * Server code reads logos from disk for Resend CID attachments; ensure they are traced.
   * PNG is preferred for email; SVG remains as fallback.
   */
  outputFileTracingIncludes: {
    "*": [
      "./public/portfolioguardian-logo.png",
      "./public/PortfolioGuardian_OriginalLogo.svg",
    ],
  },
  /**
   * Avoid pulling `sharp` / `@img/*` into the serverless bundle for `next/image` optimization.
   * Images are served from `public/` or remote URLs as-is (acceptable trade-off for bundle size).
   */
  images: {
    unoptimized: true,
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
  async headers() {
    /**
     * Maps / Places JS API (address autocomplete) loads scripts and workers from `*.gstatic.com` and
     * connects to `*.googleapis.com` / `*.google.com`. Omitting these breaks production when CSP is
     * enforced (see https://developers.google.com/maps/documentation/javascript/content-security-policy).
     */
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com https://*.google.com blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com https://*.google.com data: blob:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
