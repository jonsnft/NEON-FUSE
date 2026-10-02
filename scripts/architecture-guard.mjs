import { readdir, readFile } from "node:fs/promises";

const ROOT = new URL("../packages/shared/src/sim/", import.meta.url);
const forbidden = [
  { pattern: /from\s+["']phaser["']|require\(["']phaser["']\)/i, reason: "Phaser renderer dependency" },
  { pattern: /from\s+["'](?:@colyseus\/[^"']+|colyseus)["']/i, reason: "Colyseus transport dependency" },
  { pattern: /openmayhem/i, reason: "OpenMayhem platform coupling" },
  { pattern: /playbay/i, reason: "PlayBay platform coupling" },
  { pattern: /stripe/i, reason: "payment provider coupling" },
  { pattern: /\.\.\/cosmetics\//i, reason: "cosmetic/catalog dependency" },
  { pattern: /entitlement/i, reason: "entitlement dependency" }
];

async function walk(url) {
  const entries = await readdir(url, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    if (entry.isDirectory()) files.push(...await walk(child));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(child);
  }

  return files;
}

const violations = [];
for (const file of await walk(ROOT)) {
  const content = await readFile(file, "utf8");
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) violations.push(`${file.pathname}: ${rule.reason}`);
  }
}

if (violations.length) {
  console.error("ARCHITECTURE GUARD FAILED");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Architecture guard passed: shared simulation remains framework/platform/economy independent.");
