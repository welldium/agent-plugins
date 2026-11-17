// Fails when a PR changes a plugin's files without raising its version.
// Claude Code, Codex and Anthropic's directory only ship a new copy when `version` goes up,
// so an unbumped change would never reach users.
//
// Usage: node scripts/check-version-bump.mjs <base-ref>   (CI passes origin/<base branch>)
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const base = process.argv[2];
if (!base) { console.error("usage: check-version-bump.mjs <base-ref>"); process.exit(2); }

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const changed = git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);

const parse = (v) => v.split(/[.+-]/).slice(0, 3).map(Number);
const greater = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

const errors = [];
const plugins = new Set(changed.map((f) => f.match(/^plugins\/([^/]+)\//)?.[1]).filter(Boolean));
for (const name of plugins) {
  const manifest = `plugins/${name}/.claude-plugin/plugin.json`;
  if (!existsSync(manifest)) continue; // plugin removed in this PR
  const now = JSON.parse(readFileSync(manifest, "utf8")).version;
  let before;
  try { before = JSON.parse(git("show", `${base}:${manifest}`)).version; }
  catch { console.log(`• ${name}: new plugin at ${now}`); continue; }
  if (!greater(now, before)) errors.push(`${name}: files changed but version is still ${now} (was ${before}) — bump it in both manifests`);
  else console.log(`• ${name}: ${before} → ${now}`);
}

if (errors.length) { console.error(errors.map((e) => `✘ ${e}`).join("\n")); process.exit(1); }
console.log(plugins.size ? "✔ every changed plugin has a higher version" : "✔ no plugin files changed");
