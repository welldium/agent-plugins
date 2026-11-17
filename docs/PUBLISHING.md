# Publishing the Welldium plugin

Where the plugin is distributed, what each directory requires, what we already have, and how releases work.
Status as of 2026-11-17.

## Where it goes

| Channel | How users get it | What we hand over | Updates |
|---|---|---|---|
| Our marketplace — Claude Code | `claude plugin marketplace add welldium/agent-plugins` | Nothing — reads this repo | `claude plugin update`, when `version` goes up |
| Our marketplace — Codex / ChatGPT desktop | `codex plugin marketplace add welldium/agent-plugins` | Nothing — reads this repo | When `version` goes up |
| [Anthropic directory](https://claude.ai/directory) (claude.ai, Cowork, Claude Code) | Browse and add on claude.ai | **This GitHub repo** + plugin path, submitted at [claude.ai/directory/manage](https://claude.ai/directory/manage). The repo must be **public** for the listing to go live | Directory follows the tracked branch; every new passing version is published |
| [OpenAI directory](https://developers.openai.com/plugins/deploy/submission) (ChatGPT + Codex) | Browse and add in ChatGPT / Codex | **A ZIP**, uploaded in the OpenAI Platform Plugins dashboard | Upload a new ZIP per version (skills, metadata). MCP tool changes are re-scanned from the server, no ZIP needed |

Anthropic's directory reads the repo directly and needs it public, so the repo stays **public**. It only ever holds client ids, never secrets.
The public directories should list the **production** plugin. `welldium-test` stays in our own marketplace for the team.

## Checklist

### Shared

- [x] Public GitHub repo with Claude and OpenAI marketplaces
- [x] Remote HTTPS MCP server (test: `https://test.welldium.com/api/partner/mcp`)
- [x] OAuth with pre-registered clients in test Auth DB: `chatgpt`, `claude-pilot`, `codex`. Both directories accept a pre-registered client, so Dynamic Client Registration is **not** required
- [x] Sign-in that reviewers can use: Welldium Auth supports email + password
- [ ] **Prod OAuth for the partner MCP** — blocker. On `welldium.com` the protected-resource metadata URL returns the website HTML and the MCP 401 has no `WWW-Authenticate` challenge, so clients cannot discover sign-in. Deploy the Auth OAuth provider and the API OAuth settings to prod
- [ ] **Production plugin** `welldium` (permanent name) pointing at the prod MCP URL, in both marketplaces
- [ ] **Register the OAuth clients in the prod Auth DB** (`yarn oauth:register-client` in Welldium.Auth): one per surface, see the Claude and OpenAI sections
- [ ] **Reviewer test account** in prod: email + password, no SMS/MFA/magic link, populated with sample clients and plans
- [x] **Tool annotations**: every tool has `readOnlyHint`/`destructiveHint`; titles added in welldium/WelldiumAPI#3763 (must be deployed)
- [ ] Privacy policy covers what the plugin sends (health data, client details)

### Anthropic directory — plugin + connector

Docs: [Submit your plugin](https://claude.com/docs/plugins/submit), [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist), [Submit a connector](https://claude.com/docs/connectors/building/submission).

- [x] `claude plugin validate` passes (CI)
- [x] Kebab-case name, `description`, `author`, `version` set
- [x] Remote MCP server declared with `type` + `https` URL, no secrets in headers
- [x] **`LICENSE`** (MIT) in the repo root and each plugin folder
- [x] **`README.md` in the plugin folder** (≥ 40 words), saying what the plugin sends where. Copy it into the prod plugin
- [ ] Submitter on a paid claude.ai plan (Team/Enterprise: an Owner, or a member with the Directory permission); GitHub account connected on claude.ai with push access
- [ ] Submit the plugin: **Plugin bundle**, repo `welldium/agent-plugins`, path `plugins/welldium`, tracked branch `main`
- [ ] Set up the GitHub push webhook (needs repo admin)
- [ ] Data handling answers: plugin handles **personal health data**
- [ ] Also submit the MCP server as a **connector** (**MCP connector** in the same portal) and pair it with the plugin. Needs: docs URL, privacy policy URL, support contact, icon
- [ ] Connector auth: enter the OAuth client id (Anthropic-held client). Callback is `https://claude.ai/api/mcp/auth_callback`. Prefer a prod client with only that redirect, separate from the Claude Code client (`claude-pilot`, fixed port 8080)
- [x] No screenshots needed: the server has no MCP App UI (the plan card was removed in the API)

### OpenAI directory

Docs: [Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission), [Package your plugin](https://developers.openai.com/plugins/build/plugins).

- [x] Listing fields within limits: `displayName`/`shortDescription` ≤ 30, `longDescription` ≤ 4000, ≤ 3 starter prompts ≤ 128 chars (checked in CI)
- [x] `websiteURL`, `supportURL`, `privacyPolicyURL`, `termsOfServiceURL` (HTTPS)
- [x] `logo` and `composerIcon`, square, ≥ 48 px
- [x] Skill has `name` + `description` front matter
- [x] One MCP server per plugin, no lifecycle hooks
- [x] **Submission ZIP built by CI** (`scripts/build-openai.mjs`): drops `.app.json` (not accepted in submissions), declares `mcpServers`, rewrites OAuth to a `provided` client
- [ ] Verified developer identity in the OpenAI org; submitter is org owner or has **Apps Management Write**
- [ ] **Domain verification**: serve the challenge token at `https://<mcp host>/.well-known/openai-apps-challenge`
- [ ] Confirm the portal accepts a public client (`tokenEndpointAuthMethod: none`) for `chatgpt`; otherwise register a confidential client and enter its secret in the portal (never in the ZIP)
- [ ] Confirm which callback Codex uses for directory installs; the `chatgpt` client only allows `https://chatgpt.com/connector_platform_oauth_redirect`
- [x] **Test cases** (5 positive, 3 negative) and **release notes** in `review/welldium.json`, built into the ZIP manifest (checked in CI)
- [ ] **Demo video URL** in `review/welldium.json` (re-record: the existing `welldium-mcp-plan.mp4` predates the plan-card removal), and **reviewer credentials** in the portal. See `docs/REVIEW.md`
- [ ] Upload the ZIP → fix validation findings → Submit for review → Publish after approval

## Releases and versions

One version per plugin, the same in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` (CI enforces it).

1. Open a PR that changes the plugin **and raises `version`** in both manifests (semver: patch for wording/prompts, minor for new skills or tools, major for breaking changes). CI fails a PR that changes plugin files without a higher version.
2. Merge to `main`. Claude and Codex read `main`, so this ships the version there:
   - Our marketplaces serve it right away (`claude plugin update` / Codex picks up the new version).
   - Anthropic's directory scans the new commit on `main` and publishes it if it passes.
3. Tag the merge commit `<name>--v<version>`: `claude plugin tag --push` from the plugin folder, or `git tag welldium--v1.0.1 && git push origin welldium--v1.0.1`.
   The **Release** workflow checks the tag matches the manifests, builds `<name>-<version>-openai.zip` and creates a **draft** GitHub release with it.
4. Review the draft, publish it, and upload the ZIP in the OpenAI Plugins dashboard (**Upload plugin to make changes**). The upload is manual.

MCP tool changes ship with the server, not the plugin: Anthropic and OpenAI re-scan the live server. Keep tool schemas backwards compatible until the new version is approved.

Never rename a published plugin (`name`); change `displayName` instead.

## Files

| File | Purpose |
|---|---|
| `scripts/check.mjs` | Repo rules: JSON, matching versions, Codex quirks, OpenAI listing limits, no secrets |
| `scripts/check-version-bump.mjs` | PR check: changed plugin ⇒ higher version |
| `scripts/build-openai.mjs` | Builds `dist/<name>-<version>-openai.zip` for the OpenAI directory |
| `scripts/release.config.json` | Per-plugin OAuth client id and review file used in the OpenAI ZIP |
| `review/<name>.json` | OpenAI review test cases, demo URL and release notes (merged into the ZIP manifest) |
| `.github/workflows/validate.yml` | PRs and main: all checks + ZIP build (downloadable artifact) |
| `.github/workflows/release.yml` | Tag `<name>--v<version>`: draft GitHub release with the ZIP |
