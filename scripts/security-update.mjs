#!/usr/bin/env node
/**
 * Weekly dependency maintenance for the pg-application monorepo.
 *
 * Usage:
 *   node scripts/security-update.mjs              # apply patch updates (default)
 *   node scripts/security-update.mjs --dry-run    # audit + report only
 *   node scripts/security-update.mjs --target minor
 *
 * Environment:
 *   UPDATE_TARGET=patch|minor|latest   (default: patch)
 *   FAIL_ON_VULNS=1                    exit 1 if vulnerabilities remain
 *   USE_SYSTEM_CA=1                    set NODE_OPTIONS=--use-system-ca (Windows/corp proxy)
 */

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const target =
  [...args].find((a) => a.startsWith("--target="))?.split("=")[1] ??
  process.env.UPDATE_TARGET ??
  "patch";
const failOnVulns = process.env.FAIL_ON_VULNS === "1";
const reportPath = path.join(rootDir, "security-update-report.md");

if (process.env.USE_SYSTEM_CA === "1" || process.platform === "win32") {
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, "--use-system-ca"]
    .filter(Boolean)
    .join(" ");
}

function run(cmd, options = {}) {
  const { cwd = rootDir, stdio = "inherit", env = process.env } = options;
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd, stdio, env, shell: true });
}

function runCapture(cmd, options = {}) {
  const { cwd = rootDir, env = process.env } = options;
  return execSync(cmd, {
    cwd,
    env,
    shell: true,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryCapture(cmd) {
  try {
    return runCapture(cmd);
  } catch {
    return null;
  }
}

function parseAudit() {
  const result = spawnSync("npm audit --json", {
    cwd: rootDir,
    shell: true,
    encoding: "utf8",
    env: process.env,
  });
  const raw = result.stdout?.trim();
  if (!raw) {
    return { total: null, bySeverity: {}, vulnerabilities: [] };
  }
  try {
    const data = JSON.parse(raw);
    const meta = data.metadata?.vulnerabilities ?? {};
    return {
      total: meta.total ?? 0,
      bySeverity: {
        critical: meta.critical ?? 0,
        high: meta.high ?? 0,
        moderate: meta.moderate ?? 0,
        low: meta.low ?? 0,
        info: meta.info ?? 0,
      },
      vulnerabilities: Object.values(data.vulnerabilities ?? {}),
    };
  } catch {
    return { total: null, bySeverity: {}, vulnerabilities: [] };
  }
}

function gitDiffStat() {
  return tryCapture("git diff --stat") ?? "(no git diff)";
}

function gitStatusPorcelain() {
  return tryCapture("git status --porcelain") ?? "";
}

function writeReport({ before, after, steps }) {
  const lines = [
    "# Dependency security update report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${dryRun ? "dry-run" : "apply"}`,
    `Update target: ${target}`,
    "",
    "## Steps",
    ...steps.map((s) => `- ${s}`),
    "",
    "## Vulnerabilities (before)",
    formatAuditSection(before),
    "",
    "## Vulnerabilities (after)",
    formatAuditSection(after),
    "",
    "## Changed files",
    "```",
    gitDiffStat(),
    "```",
    "",
  ];
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`\nReport written to ${path.relative(rootDir, reportPath)}`);
}

function formatAuditSection(audit) {
  if (audit.total === null) {
    return "- npm audit unavailable";
  }
  const sev = audit.bySeverity;
  return [
    `- Total: **${audit.total}**`,
    `- Critical: ${sev.critical}, High: ${sev.high}, Moderate: ${sev.moderate}, Low: ${sev.low}`,
  ].join("\n");
}

function main() {
  const steps = [];
  console.log(`pg-application security update (${dryRun ? "dry-run" : "apply"})`);

  const before = parseAudit();
  steps.push(`Initial audit: ${before.total ?? "unknown"} issue(s)`);

  if (!dryRun) {
    steps.push(`Bump package.json ranges with npm-check-updates (target: ${target})`);
    run(
      `npx --yes npm-check-updates@latest -u --workspaces --root --target ${target}`,
    );

    steps.push("npm install");
    run("npm install");

    steps.push("npm audit fix");
    const auditFix = spawnSync("npm audit fix", {
      cwd: rootDir,
      shell: true,
      stdio: "inherit",
      env: process.env,
    });
    if (auditFix.status !== 0) {
      steps.push("npm audit fix reported unresolved issues (continuing)");
    }

    steps.push("npm update (workspaces)");
    run("npm update --workspaces");

    steps.push("npm install (lockfile refresh)");
    run("npm install");
  } else {
    steps.push("Skipped updates (dry-run)");
    tryCapture("npm outdated") &&
      console.log("\n--- npm outdated ---\n" + tryCapture("npm outdated"));
  }

  const after = parseAudit();
  steps.push(`Final audit: ${after.total ?? "unknown"} issue(s)`);

  writeReport({ before, after, steps });

  const changed = gitStatusPorcelain()
    .split("\n")
    .filter(Boolean)
    .some((line) => !line.includes("security-update-report.md"));
  if (changed) {
    console.log("\nDependency files changed — review diff and run typecheck/build.");
  } else {
    console.log("\nNo dependency file changes detected.");
  }

  if (failOnVulns && (after.total ?? 0) > 0) {
    console.error("\nFAIL_ON_VULNS=1 and vulnerabilities remain after update.");
    process.exit(1);
  }
}

main();
