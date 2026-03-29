/**
 * Trims `@vercel/nft` outputs for Next so serverless bundles stay under Vercel's 250MB limit.
 *
 * Processes both `.next/server/**\/*.nft.json` (per-route) and `.next/*.nft.json` (server-level).
 *
 * 1. Drops traced files under the sibling `apps/api` workspace (standalone Express).
 * 2. Drops `.next/cache` trees (webpack .pack files, preview info) — must not be deployed.
 * 3. Drops `.next/dev` artifacts that NFT may reference from a prior dev session.
 * 4. Drops ALL `sharp` / `@img/*` entries — images are unoptimized, sharp is never used at runtime.
 * 5. Drops `@next/swc-*` native binaries — only needed at build time.
 * 6. For `app/api/**` route handlers, drops traced `apps/web/app/**` and `apps/web/components/**`
 *    sources that NFT incorrectly attaches via shared chunks.
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

/**
 * Images are unoptimized (no sharp at runtime), so drop ALL sharp / @img entries.
 */
function isSharpOrImg(relFromNft) {
  const raw = relFromNft.replace(/\\/g, "/");
  return raw.includes("node_modules/sharp/") || raw.includes("node_modules/@img/");
}

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

  if (
    raw.includes("/cache/webpack/") ||
    raw.includes("/cache/turbopack/") ||
    raw.includes(".next/cache/") ||
    raw.includes("/cache/.previewinfo") ||
    raw.includes("/cache/.rscinfo")
  ) {
    return false;
  }

  if (raw.includes(".next/dev/") || raw.includes("/dev/_events")) {
    return false;
  }

  if (raw.includes("node_modules/@next/swc-") || raw.includes("node_modules/@next/.swc-")) {
    return false;
  }

  if (isSharpOrImg(raw)) {
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

const dotNextDir = path.join(webRoot, ".next");
const serverDir = path.join(dotNextDir, "server");
if (!fs.existsSync(serverDir)) {
  console.warn("prune-nft-trace: .next/server missing; skip.");
  process.exit(0);
}

const nftFiles = [
  ...walk(serverDir),
  ...fs.readdirSync(dotNextDir)
    .filter((f) => f.endsWith(".nft.json"))
    .map((f) => path.join(dotNextDir, f)),
];

let totalPruned = 0;
for (const nftPath of nftFiles) {
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
