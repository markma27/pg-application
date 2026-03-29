import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Monorepo root (`package.json` name `pg-application`), for resolving `apps/web/public` assets. */
export function resolveMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 14; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
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
  return process.cwd();
}
