#!/usr/bin/env node
/**
 * Vulnerability scan for the pg-application monorepo.
 *
 * Runs `npm audit --json`, turns the result into a plain-text report, and
 * reports back to GitHub Actions so the workflow only emails when something
 * was actually found. Never changes dependencies and never opens a PR.
 *
 * Usage:
 *   node scripts/audit-report.mjs           # print report to stdout
 *
 * Environment:
 *   AUDIT_LEVEL=low|moderate|high|critical   lowest severity to report (default: low)
 *   GITHUB_OUTPUT                            set by Actions; receives has_vulns/total/summary/report
 *
 * Exits 1 only when the scan itself could not run — a scan that completes and
 * finds vulnerabilities still exits 0, because the email is the deliverable.
 */

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Most severe first — also the order vulnerabilities are listed in the report.
const SEVERITIES = ["critical", "high", "moderate", "low", "info"];
const level = (process.env.AUDIT_LEVEL ?? "low").toLowerCase();
const threshold = SEVERITIES.indexOf(level) === -1 ? SEVERITIES.indexOf("low") : SEVERITIES.indexOf(level);

// Keep emails readable when a single advisory fans out across the tree.
const MAX_ADVISORIES = 50;
const MAX_AFFECTED = 50;
const MAX_EFFECTS = 8;

if (process.platform === "win32") {
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ");
}

function runAudit() {
  // npm audit exits non-zero when it finds something, so the exit code is not
  // an error signal here — only unparseable output is.
  const result = spawnSync("npm audit --json", {
    cwd: rootDir,
    shell: true,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 32 * 1024 * 1024,
  });

  const raw = result.stdout?.trim();
  if (!raw) {
    const reason = result.stderr?.trim() || `npm audit produced no output (exit ${result.status})`;
    throw new Error(reason);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`npm audit did not return valid JSON:\n${raw.slice(0, 2000)}`);
  }
}

function atOrAbove(severity) {
  const idx = SEVERITIES.indexOf(severity);
  return idx !== -1 && idx <= threshold;
}

/** Pull the unique advisories out of the audit tree, deduped by advisory id. */
function collectAdvisories(vulnerabilities) {
  const byId = new Map();
  for (const vuln of vulnerabilities) {
    for (const via of vuln.via ?? []) {
      // String entries point at another package's advisory; object entries are the advisory.
      if (typeof via !== "object" || !atOrAbove(via.severity)) continue;
      const id = via.source ?? `${via.name}@${via.range}`;
      if (!byId.has(id)) byId.set(id, via);
    }
  }
  return [...byId.values()].sort(
    (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
  );
}

function describeFix(fixAvailable) {
  if (fixAvailable === true) return "yes — run `npm audit fix`";
  if (fixAvailable && typeof fixAvailable === "object") {
    const major = fixAvailable.isSemVerMajor ? " (breaking / major bump)" : "";
    return `yes — upgrade to ${fixAvailable.name}@${fixAvailable.version}${major}`;
  }
  return "no fix available yet";
}

function buildReport({ counts, advisories, affected, dependencyTotal }) {
  const lines = [];
  const push = (...l) => lines.push(...l);

  push(
    "Daily dependency vulnerability scan found issues in pg-application.",
    "",
    `Scanned: ${dependencyTotal} dependencies`,
    `Reporting severity: ${level} and above`,
    "",
    "SUMMARY",
    "-------",
    // npm counts a package once at its highest severity, so this is deliberately
    // not the advisory count — one package can carry several advisories.
    `Affected packages: ${affected.length}`,
    `Advisories:        ${advisories.length}`,
    "",
    "By severity (packages):",
    SEVERITIES.filter((s) => s !== "info")
      .map((s) => `  ${s.padEnd(9)}${counts[s] ?? 0}`)
      .join("\n"),
    "",
  );

  push("ADVISORIES", "----------");
  if (advisories.length === 0) {
    push("(none at or above the reporting threshold)");
  }
  for (const adv of advisories.slice(0, MAX_ADVISORIES)) {
    push(
      `[${adv.severity.toUpperCase()}] ${adv.name}`,
      `  ${adv.title ?? "(no title)"}`,
      `  Vulnerable versions: ${adv.range ?? "unknown"}`,
      `  Advisory: ${adv.url ?? "n/a"}`,
      "",
    );
  }
  if (advisories.length > MAX_ADVISORIES) {
    push(`... and ${advisories.length - MAX_ADVISORIES} more advisories.`, "");
  }

  push("AFFECTED PACKAGES", "-----------------");
  for (const vuln of affected.slice(0, MAX_AFFECTED)) {
    const effects = vuln.effects ?? [];
    const shown = effects.slice(0, MAX_EFFECTS).join(", ");
    const more = effects.length > MAX_EFFECTS ? `, +${effects.length - MAX_EFFECTS} more` : "";

    push(
      `[${vuln.severity.toUpperCase()}] ${vuln.name} (${vuln.range ?? "unknown range"})`,
      `  Direct dependency: ${vuln.isDirect ? "yes" : "no"}`,
      `  Fix: ${describeFix(vuln.fixAvailable)}`,
    );
    if (effects.length > 0) push(`  Breaks: ${shown}${more}`);
    push("");
  }
  if (affected.length > MAX_AFFECTED) {
    push(`... and ${affected.length - MAX_AFFECTED} more packages.`, "");
  }

  push(
    "WHAT TO DO",
    "----------",
    "Nothing is changed automatically — this scan is report-only.",
    "",
    "  npm audit                 # full detail locally",
    "  npm audit fix             # apply non-breaking fixes",
    "  npm audit fix --force     # includes breaking major bumps — review the diff",
    "",
    "Then verify with `npm run typecheck` and `npm run build` before committing.",
  );

  return lines.join("\n");
}

/** Multi-line values need a delimiter that cannot appear in the payload. */
function setOutputs(outputs) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  const chunks = Object.entries(outputs).map(([key, value]) => {
    const delimiter = `ghadelim_${randomUUID()}`;
    return `${key}<<${delimiter}\n${value}\n${delimiter}\n`;
  });
  fs.appendFileSync(file, chunks.join(""), "utf8");
}

function main() {
  let data;
  try {
    data = runAudit();
  } catch (err) {
    console.error(`Vulnerability scan could not run: ${err.message}`);
    process.exit(1);
  }

  const dependencyTotal = data.metadata?.dependencies?.total ?? "unknown";

  const affected = Object.values(data.vulnerabilities ?? {})
    .filter((v) => atOrAbove(v.severity))
    .sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
  const advisories = collectAdvisories(Object.values(data.vulnerabilities ?? {}));

  const reportedTotal = affected.length;

  if (reportedTotal === 0) {
    console.log(`No vulnerabilities at severity "${level}" or above. Nothing to report.`);
    setOutputs({ has_vulns: "false", total: "0", summary: "No vulnerabilities", report: "" });
    return;
  }

  // Counted from the filtered set, not metadata.vulnerabilities, so raising
  // AUDIT_LEVEL does not leave below-threshold severities in the subject line.
  const counts = {};
  for (const vuln of affected) counts[vuln.severity] = (counts[vuln.severity] ?? 0) + 1;

  const headline = SEVERITIES.filter((s) => s !== "info" && (counts[s] ?? 0) > 0)
    .map((s) => `${counts[s]} ${s}`)
    .join(", ");
  const plural = reportedTotal === 1 ? "" : "s";
  const summary = `${reportedTotal} vulnerable package${plural} (${headline})`;
  const report = buildReport({ counts, advisories, affected, dependencyTotal });

  console.log(report);
  setOutputs({ has_vulns: "true", total: String(reportedTotal), summary, report });
}

main();
