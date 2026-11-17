// Generates the TEST-environment copy of a plugin into dist/<test name>/, from plugins/<name>/.
// Nothing is published: the marketplaces list only the production plugin. Use the copy to try
// the full plugin (skills + MCP server) against test before a change ships:
//
//   node scripts/build-test.mjs                 → dist/welldium-test/
//   claude --plugin-dir dist/welldium-test      → Claude Code, one session
//   node scripts/build-openai.mjs --test        → dist/welldium-test-<version>-openai.zip (dry-run upload)
//
// What changes is set in scripts/release.config.json → <name>.test: name, display name,
// MCP URL, OAuth client ids per surface, and the ChatGPT app the desktop app should use.
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");

export function buildTest(name) {
  const test = readJson(join(root, "scripts/release.config.json"))[name]?.test;
  if (!test) throw new Error(`scripts/release.config.json: ${name}.test is missing`);
  const src = join(root, "plugins", name);
  if (!existsSync(src)) throw new Error(`plugins/${name} does not exist`);

  const out = join(root, "dist", test.name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(root, "dist"), { recursive: true });
  cpSync(src, out, { recursive: true });

  const prodUrl = readJson(join(src, ".mcp.json")).mcpServers;
  const prodUrls = Object.values(prodUrl).map((s) => s.url);
  const label = `${test.displayName} — TEST environment (${new URL(test.url).host}). `;

  const claude = readJson(join(out, ".claude-plugin/plugin.json"));
  Object.assign(claude, { name: test.name, displayName: test.displayName, description: label + claude.description });
  writeJson(join(out, ".claude-plugin/plugin.json"), claude);

  const codex = readJson(join(out, ".codex-plugin/plugin.json"));
  codex.name = test.name;
  codex.description = label + codex.description;
  codex.interface.displayName = test.displayName;
  if (test.chatgptApp) {
    codex.apps = "./.app.json";
    writeJson(join(out, ".app.json"), { apps: { [Object.keys(prodUrl)[0]]: { id: test.chatgptApp } } });
  }
  writeJson(join(out, ".codex-plugin/plugin.json"), codex);

  const mcp = readJson(join(out, ".mcp.json"));
  for (const s of Object.values(mcp.mcpServers)) { s.url = test.url; s.oauth = { client_id: test.clients.codex }; }
  writeJson(join(out, ".mcp.json"), mcp);

  const claudeMcp = readJson(join(out, "claude.mcp.json"));
  for (const s of Object.values(claudeMcp.mcpServers)) { s.url = test.url; s.oauth = { ...s.oauth, clientId: test.clients.claude }; }
  writeJson(join(out, "claude.mcp.json"), claudeMcp);

  let readme = readFileSync(join(out, "README.md"), "utf8");
  for (const u of prodUrls) readme = readme.replaceAll(u, test.url);
  readme = readme.replace(/^# .*$/m, `# ${test.displayName}\n\nThis is the **test** build. It connects to \`${new URL(test.url).host}\` and isn't published.`);
  writeFileSync(join(out, "README.md"), readme);

  return { dir: out, name: test.name, chatgptClientId: test.clients.chatgpt };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const market = readJson(join(root, ".claude-plugin/marketplace.json"));
  const names = process.argv.slice(2).length ? process.argv.slice(2) : market.plugins.map((p) => p.name);
  for (const name of names) console.log(`✔ ${buildTest(name).dir.replace(root, "").replace(/^[\\/]/, "")}`);
}
