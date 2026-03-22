import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Resolves the monorepo root (package name `pg-application` with workspaces)
 * so a single `.env` / `.env.local` at the repo root applies to the API.
 */
export function resolveMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
          name?: string;
          workspaces?: unknown;
        };
        if (pkg.name === "pg-application" && pkg.workspaces != null) {
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
  return path.join(process.cwd(), "../..");
}

/** Load root `.env` then `.env.local` (override). */
export function loadRootEnv(): void {
  const root = resolveMonorepoRoot();
  config({ path: path.join(root, ".env") });
  config({ path: path.join(root, ".env.local"), override: true });
}
