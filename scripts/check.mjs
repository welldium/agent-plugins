// Repo checks that `claude plugin validate` doesn't cover: OpenAI files, matching versions, no secrets.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const errors = [];
const fail = (msg) => errors.push(msg);

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const path = join(dir, name);
    statSync(path).isDirectory() ? walk(path) : files.push(path);
  }
};
walk(root);
const rel = (p) => relative(root, p).replaceAll("\\", "/");

// 1. Every JSON file parses.
const json = {};
for (const file of files.filter((f) => f.endsWith(".json"))) {
  try { json[rel(file)] = JSON.parse(readFileSync(file, "utf8")); }
  catch (e) { fail(`${rel(file)}: invalid JSON (${e.message})`); }
}

// 2. Both marketplaces list the same plugins, and each points at an existing folder.
const claudeMarket = json[".claude-plugin/marketplace.json"];
const openaiMarket = json[".agents/plugins/marketplace.json"];
if (!claudeMarket) fail(".claude-plugin/marketplace.json is missing");
if (!openaiMarket) fail(".agents/plugins/marketplace.json is missing");
const claudeNames = (claudeMarket?.plugins ?? []).map((p) => p.name).sort();
const openaiNames = (openaiMarket?.plugins ?? []).map((p) => p.name).sort();
if (claudeNames.join() !== openaiNames.join())
  fail(`marketplaces list different plugins: Claude [${claudeNames}] vs OpenAI [${openaiNames}]`);
for (const p of openaiMarket?.plugins ?? []) {
  const path = p.source?.path;
  if (!path?.startsWith("./")) fail(`.agents/plugins/marketplace.json: ${p.name} source.path must start with ./`);
  else if (!existsSync(join(root, path))) fail(`.agents/plugins/marketplace.json: ${p.name} path ${path} does not exist`);
}

// 3. Per plugin: both manifests exist and agree on name and version.
for (const name of claudeNames) {
  const claude = json[`plugins/${name}/.claude-plugin/plugin.json`];
  const openai = json[`plugins/${name}/plugin.json`];
  if (!claude) { fail(`plugins/${name}/.claude-plugin/plugin.json is missing`); continue; }
  if (!openai) { fail(`plugins/${name}/plugin.json is missing`); continue; }
  if (claude.name !== name || openai.name !== name)
    fail(`plugins/${name}: manifest names must both be "${name}" (Claude "${claude.name}", OpenAI "${openai.name}")`);
  if (claude.version !== openai.version)
    fail(`plugins/${name}: version differs (Claude ${claude.version}, OpenAI ${openai.version}) — bump both`);
}

// 4. No secrets. Client ids are public; secrets and API keys must never be committed.
const secretPatterns = [/wd_live_[0-9a-f]{8,}/i, /client_?secret"\s*:/i, /"x-api-key"\s*:/i, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
for (const file of files.filter((f) => !f.endsWith(".png") && !rel(f).startsWith("scripts/"))) {
  const text = readFileSync(file, "utf8");
  for (const pattern of secretPatterns)
    if (pattern.test(text)) fail(`${rel(file)}: looks like a secret (${pattern}) — remove it`);
}

if (errors.length) {
  console.error(errors.map((e) => `✘ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✔ ${Object.keys(json).length} JSON files, ${claudeNames.length} plugin(s) checked`);
