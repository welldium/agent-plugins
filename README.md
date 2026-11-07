# Welldium agent plugins

Private plugin marketplace for trying the Welldium plugin in Claude Code, Codex and the ChatGPT desktop app before it is published to the public directories.

| Plugin | Environment | Server |
|---|---|---|
| `welldium-test` | Test | `https://test.welldium.com/api/partner/mcp` |

The plugin connects to the Welldium MCP server and adds a `build-plan` skill. You sign in with your Welldium **practitioner** account (OAuth) the first time a tool is used.

## Install

### Claude Code

```bash
claude plugin marketplace add welldium/agent-plugins
claude plugin install welldium-test@welldium
```

Then run `/mcp` in a session and sign in to `welldium`. The repo is private, so your git must be able to clone it (for example `gh auth login`).

### Codex CLI

```bash
codex plugin marketplace add welldium/agent-plugins
codex plugin marketplace list
```

Install `welldium-test` from the plugin list.

### ChatGPT desktop app

Clone this repo, restart the ChatGPT desktop app, open the **Plugins** directory and pick the **Welldium** marketplace.

### Claude.ai / ChatGPT web

These don't read this marketplace. Add the server as a custom connector / app by URL instead (`https://test.welldium.com/api/partner/mcp`), with OAuth.

## Layout

```
.claude-plugin/marketplace.json     Claude Code marketplace
.agents/plugins/marketplace.json    Codex / ChatGPT desktop marketplace
plugins/welldium-test/
  .claude-plugin/plugin.json        Claude Code manifest
  .mcp.json                         Claude Code MCP server (OAuth client `claude-pilot`, callback port 8080)
  plugin.json                       OpenAI manifest (portable format)
  mcp.json                          OpenAI MCP server (OAuth client `chatgpt`)
  skills/build-plan/SKILL.md        Shared skill
```

OAuth clients are registered in Welldium.Auth (`scripts/register-oauth-client.mjs`). The packages hold client ids only — never secrets.

## Updating

Bump `version` in both manifests when you change a plugin, so installs pick up the update.

```bash
claude plugin validate .
```
