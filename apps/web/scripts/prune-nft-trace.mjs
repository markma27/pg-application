/**
 * Trims `@vercel/nft` outputs for Next so serverless bundles stay under Vercel's 250MB limit.
 *
 * 1. Drops traced files under the sibling `apps/api` workspace (standalone Express) — not used by Next.
 * 2. Drops `.next/cache` trees (e.g. webpack .pack files) — must not be deployed; often blows past 250MB alone.
 * 3. For `app/api/**` route handlers only, drops traced `apps/web/app/**` and `apps/web/components/**`
 *    sources that NFT incorrectly attaches via shared chunks; routes do not execute that UI at runtime.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

function resolveMonorepoRoot() {
  let dir = webRoot;
  for (let i = 0; i < 16; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.name === "pg-application") return dir;
      } catch {
        /* continue */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(webRoot, "..", "..");
}

const monorepoRoot = resolveMonorepoRoot();

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (name.name.endsWith(".nft.json")) out.push(p);
  }
  return out;
}

function isNextApiRouteNft(nftPath) {
  return nftPath.replace(/\\/g, "/").includes("/.next/server/app/api/");
}

function shouldKeepTraceFile(nftPath, relFromNft) {
  const raw = relFromNft.replace(/\\/g, "/");
  /** NFT paths often use `../cache/webpack/...` (no `.next` segment in the string). */
  if (raw.includes("/cache/webpack/") || raw.includes("/cache/turbopack/") || raw.includes(".next/cache/")) {
    return false;
  }

  const abs = path.resolve(path.dirname(nftPath), relFromNft);
  const rel = path.relative(monorepoRoot, abs).replace(/\\/g, "/");
  if (rel.startsWith("apps/api/")) return false;

  if (isNextApiRouteNft(nftPath)) {
    if (rel.startsWith("apps/web/components/")) return false;
    if (rel.startsWith("apps/web/app/")) return false;
    if (rel === "apps/web/components.json") return false;
  }

  return true;
}

const serverDir = path.join(webRoot, ".next", "server");
if (!fs.existsSync(serverDir)) {
  console.warn("prune-nft-trace: .next/server missing; skip.");
  process.exit(0);
}

let totalPruned = 0;
for (const nftPath of walk(serverDir)) {
  const raw = fs.readFileSync(nftPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    continue;
  }
  if (!Array.isArray(data.files)) continue;
  const before = data.files.length;
  data.files = data.files.filter((f) => shouldKeepTraceFile(nftPath, f));
  const pruned = before - data.files.length;
  if (pruned > 0) {
    totalPruned += pruned;
    fs.writeFileSync(nftPath, JSON.stringify(data));
  }
}

if (totalPruned > 0) {
  console.log(`prune-nft-trace: removed ${totalPruned} spurious traced file(s).`);
}
