// Builds the ZIP that is uploaded to the OpenAI plugin directory (platform.openai.com → Plugins).
//
// The repo keeps the layout that Codex and ChatGPT desktop install from the marketplace today
// (.codex-plugin/plugin.json + `apps` → .app.json, .mcp.json with oauth.client_id). The public
// submission rejects some of that, so this script rewrites a copy:
//   - drops Claude-only files (.claude-plugin/, claude.mcp.json) and .app.json
//     ("packages with apps/.app.json references can't currently be submitted")
//   - replaces `apps` with `mcpServers` in .codex-plugin/plugin.json
//   - rewrites .mcp.json to the submission OAuth format: extensions["com.openai"].auth with a
//     `provided` client whose id comes from scripts/release.config.json
// Output: dist/<name>-<version>-openai.zip
//
// Usage: node scripts/build-openai.mjs [--test] [plugin-name ...]   (default: every plugin)
//   --test  build the ZIP from the generated test copy (scripts/build-test.mjs) instead, for a
//           dry-run upload against the test environment: dist/<test name>-<version>-openai.zip
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { buildTest } from "./build-test.mjs";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const config = readJson(join(root, "scripts/release.config.json"));
const market = readJson(join(root, ".claude-plugin/marketplace.json"));
const args = process.argv.slice(2);
const test = args.includes("--test");
const requested = args.filter((a) => a !== "--test");
const names = requested.length ? requested : market.plugins.map((p) => p.name);

const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

for (const pluginName of names) {
  let src = join(root, "plugins", pluginName);
  if (!existsSync(src)) throw new Error(`plugins/${pluginName} does not exist`);
  let openai = config[pluginName]?.openai;
  if (!openai?.clientId) throw new Error(`scripts/release.config.json: ${pluginName}.openai.clientId is missing`);
  let name = pluginName;
  if (test) {
    const built = buildTest(pluginName);
    ({ dir: src, name } = built);
    openai = { ...openai, clientId: built.chatgptClientId };
  }

  const stage = join(dist, "stage", name);
  rmSync(stage, { recursive: true, force: true });
  cpSync(src, stage, { recursive: true });
  for (const p of [".claude-plugin", "claude.mcp.json", ".app.json"]) rmSync(join(stage, p), { recursive: true, force: true });

  const manifestPath = join(stage, ".codex-plugin/plugin.json");
  const manifest = readJson(manifestPath);
  delete manifest.apps;
  manifest.mcpServers = "./.mcp.json";

  // Review test cases, demo URL and release notes travel in the ZIP manifest under
  // extensions["com.openai"] (reviewer credentials are entered in the portal instead).
  if (openai.review) {
    const { review, publication } = readJson(join(root, openai.review));
    const ext = ((manifest.extensions ??= {})["com.openai"] ??= {});
    const demo = review?.demo_recording_url;
    ext.review = { ...review };
    if (!demo) { delete ext.review.demo_recording_url; console.warn(`! ${name}: no demo_recording_url in ${openai.review} — required before submitting for review`); }
    if (publication) ext.publication = publication;
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  const mcpPath = join(stage, ".mcp.json");
  const servers = readJson(mcpPath).mcpServers ?? {};
  if (Object.keys(servers).length !== 1) throw new Error(`${name}: OpenAI allows one connected MCP server per plugin (found ${Object.keys(servers).length})`);
  const out = {};
  for (const [id, cfg] of Object.entries(servers)) {
    out[id] = {
      type: "streamable-http",
      url: cfg.url,
      extensions: {
        "com.openai": {
          auth: {
            type: "oauth",
            client: { mode: "provided", clientId: openai.clientId, tokenEndpointAuthMethod: openai.tokenEndpointAuthMethod ?? "none" },
          },
        },
      },
    };
  }
  writeFileSync(mcpPath, JSON.stringify({ $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", mcpServers: out }, null, 2) + "\n");

  const zip = join(dist, `${name}-${manifest.version}-openai.zip`);
  rmSync(zip, { force: true });
  // Plugin files at the ZIP root. bsdtar (Windows) writes zip with -a; Linux/macOS CI uses zip.
  if (process.platform === "win32") execFileSync(join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"), ["-a", "-c", "-f", zip, "-C", stage, "."], { stdio: "inherit" });
  else execFileSync("zip", ["-qr", zip, "."], { cwd: stage, stdio: "inherit" });
  console.log(`✔ ${zip.replace(root + "\\", "").replace(root + "/", "")}`);
}
rmSync(join(dist, "stage"), { recursive: true, force: true });
