# Welldium agent plugins

The Welldium plugin for Claude Code, Codex and the ChatGPT desktop app, and the source we submit to the Anthropic and OpenAI directories.

| Plugin | Server |
|---|---|
| `welldium` | `https://welldium.com/api/partner/mcp` |

The plugin connects to the Welldium MCP server and adds a `build-plan` skill. You sign in with your Welldium **practitioner** account (OAuth) the first time a tool is used.

## Install

### Claude Code

```bash
claude plugin marketplace add welldium/agent-plugins
claude plugin install welldium@welldium
```

Then run `/mcp` in a session and sign in to `welldium`.

### Codex CLI

```bash
codex plugin marketplace add welldium/agent-plugins
codex plugin marketplace list
```

Install `welldium` from the plugin list.

### ChatGPT desktop app

Clone this repo, restart the ChatGPT desktop app, open the **Plugins** directory and pick the **Welldium** marketplace.

### Claude.ai / ChatGPT web

These don't read this marketplace. Add the server as a custom connector / app by URL instead, with OAuth.

## Try a change against test

There is one plugin, `plugins/welldium`. A test-environment copy is generated from it and never published, so the two can't drift:

```bash
node scripts/build-test.mjs                  # dist/welldium-test: test.welldium.com, test OAuth clients
claude --plugin-dir dist/welldium-test       # Claude Code with the skill + test server, one session
node scripts/build-openai.mjs --test         # dist/welldium-test-<version>-openai.zip for a dry-run upload
```

What differs in the test copy (name, URL, OAuth client ids, ChatGPT app) is set in `scripts/release.config.json` → `welldium.test`.
To test only the server, add `https://test.welldium.com/api/partner/mcp` as a custom connector.

## Layout

```
.claude-plugin/marketplace.json     Claude Code marketplace
.agents/plugins/marketplace.json    Codex / ChatGPT desktop marketplace
plugins/welldium/
  .claude-plugin/plugin.json        Claude Code manifest
  .mcp.json                         MCP server, Codex format (OAuth client `codex`); Claude reads it too
  claude.mcp.json                   Claude Code override of the same server (client `claude`, port 8080)
  .codex-plugin/plugin.json         OpenAI manifest (max 3 starter prompts)
  skills/build-plan/SKILL.md        Shared skill
  README.md, LICENSE                Required by Anthropic's directory
review/welldium.json                OpenAI review test cases, demo URL, release notes (built into the ZIP)
scripts/                            Checks, OpenAI ZIP build, test build, release config
docs/PUBLISHING.md                  Directory requirements, checklist, release process
docs/REVIEW.md                      What reviewers get, and answers for the Anthropic portal
```

OAuth clients are registered in Welldium.Auth (`scripts/register-oauth-client.mjs`). The packages hold client ids only, never secrets.

## Releasing

Raise `version` in both manifests in the PR (CI enforces it), merge, then tag the merge commit `welldium--v<version>`. The tag builds a draft GitHub release with the OpenAI ZIP. Details are in [docs/PUBLISHING.md](docs/PUBLISHING.md#releases-and-versions).

CI (`.github/workflows/validate.yml`) runs `scripts/check.mjs`, `claude plugin validate`, the version check and both ZIP builds on every PR.
Codex has no validator and silently skips parts it can't read (only its local log, `~/.codex/logs_2.sqlite`, says why), so `check.mjs` enforces the rules it applied in practice: at most 3 starter prompts, icons under `./assets/`, and only `type`/`url`/`headers`/`oauth.client_id` in `.mcp.json`.
