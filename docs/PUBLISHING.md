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
There is one plugin, `welldium` (production). A test copy for trying changes is generated with `scripts/build-test.mjs` and never published.

## Checklist

### Shared

- [x] Public GitHub repo with Claude and OpenAI marketplaces
- [x] Remote HTTPS MCP server (test: `https://test.welldium.com/api/partner/mcp`)
- [x] OAuth with pre-registered clients in test Auth DB: `chatgpt`, `claude-pilot`, `codex`. Both directories accept a pre-registered client, so Dynamic Client Registration is **not** required
- [x] Sign-in that reviewers can use: Welldium Auth supports email + password
- [ ] **Prod OAuth for the partner MCP** — blocker. On `welldium.com` the protected-resource metadata URL returns the website HTML and the MCP 401 has no `WWW-Authenticate` challenge, so clients cannot discover sign-in. Deploy the Auth OAuth provider and the API OAuth settings to prod
- [x] **Production plugin** `welldium` (permanent name) pointing at the prod MCP URL, in both marketplaces
- [ ] **Register the OAuth clients in the prod Auth DB** (`yarn oauth:register-client` in Welldium.Auth): one per surface, see the Claude and OpenAI sections
- [ ] **Reviewer test account** in prod: email + password, no SMS/MFA/magic link, populated with sample clients and plans
- [x] **Tool annotations**: every tool has `readOnlyHint`/`destructiveHint`; titles added in welldium/WelldiumAPI#3763 (must be deployed)
- [ ] Privacy policy covers what the plugin sends (client details, plan contents)
- [ ] **Public documentation** for the connector, e.g. a help-center article on welldium.com: what it does, how to connect, what it can change. Anthropic requires it by the publish date and OpenAI's review reads it too
- [ ] **Product decisions on health positioning**, see [Health and medical policy](#health-and-medical-policy). Owner: product

### Anthropic directory — plugin + connector

Docs: [Submit your plugin](https://claude.com/docs/plugins/submit), [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist), [Submit a connector](https://claude.com/docs/connectors/building/submission).

- [x] `claude plugin validate` passes (CI)
- [x] Kebab-case name, `description`, `author`, `version` set
- [x] Remote MCP server declared with `type` + `https` URL, no secrets in headers
- [x] **`LICENSE`** (MIT) in the repo root and each plugin folder
- [x] **`README.md` in the plugin folder** (≥ 40 words), saying what the plugin sends where
- [ ] Submitter on a paid claude.ai plan (Team/Enterprise: an Owner, or a member with the Directory permission); GitHub account connected on claude.ai with push access
- [ ] Submit the plugin: **Plugin bundle**, repo `welldium/agent-plugins`, path `plugins/welldium`, tracked branch `main`
- [ ] Set up the GitHub push webhook (needs repo admin)
- [ ] Data handling answers: plugin handles **personal data** and health-related context (answers in `docs/REVIEW.md`)
- [ ] **High-risk use (Medical)**: a qualified practitioner reviews every plan before it reaches a client (already enforced by the skill), **and the client must be told AI was used to produce the plan**. Needs a product change, see [Health and medical policy](#health-and-medical-policy)
- [ ] Also submit the MCP server as a **connector** (**MCP connector** in the same portal) and pair it with the plugin. Needs: docs URL, privacy policy URL, support contact, icon
- [ ] Connector auth: enter the OAuth client id (Anthropic-held client). Callback is `https://claude.ai/api/mcp/auth_callback`. The prod client `claude` allows it, plus `localhost:8080` for Claude Code
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
- [x] **Listing avoids clinical inputs**: no symptoms, prescriptions or lab results in the listing text, release notes or test cases
- [ ] **Health-category risk**, see [Health and medical policy](#health-and-medical-policy). Submit to Anthropic first
- [ ] Upload the ZIP → fix validation findings → Submit for review → Publish after approval

## Health and medical policy

For product review. This is the biggest risk to the listing, and it's a product call, not an engineering one.

### What the directories say

| | Rule | Source |
|---|---|---|
| Anthropic | Healthcare is a **high-risk use case**. The "Medical" area includes "recommending, starting, stopping, or adjusting a treatment or medication, including dose". Allowed, with two duties: "A qualified person must meaningfully review a High-risk AI Recommendation, with the authority to change or modify it", and the person receiving it "must be clearly told that AI was used to produce it" | [Usage Policy](https://www.anthropic.com/legal/aup), [Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy) §1B |
| OpenAI | Plugins may not "collect, solicit, or process" **protected health information**. Sensitive data only if "strictly necessary", consented and disclosed. Physical-goods commerce is allowed | [Plugin guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines) |
| OpenAI, in practice | November 2026 reports of plugins rejected as "intended for use in healthcare or medicine, which is not yet supported", including an educational drug-interaction reference with no personal data. OpenAI's reply only pointed to the appeal route | [thread 1](https://community.openai.com/t/plugin-rejected-as-healthcare-while-similar-healthcare-plugins-are-published-what-decides-this/1412516), [thread 2](https://community.openai.com/t/plugin-rejected-for-accepting-medications-named-conditions-and-genotype-phenotype-inputs-similar-biomedical-reference-plugins-are-listed/1417101) |

Being practitioner-only is fine for both: OpenAI allows signing in "to an existing paid account", and both want a reviewer account with sample data.

### Our assessment

- **Anthropic: likely to pass**, if we add the client disclosure and public documentation. The practitioner-review duty is already built in: the skill makes the practitioner approve every plan and every send.
- **OpenAI: uncertain.** A tool that turns client health information into supplement plans reads as "healthcare". Mitigation so far: the listing is framed as a catalog and plan tool around wellness goals, and only search phrases and plan contents reach Welldium (no health records).

### Decisions for product

1. **Positioning.** The listing now says "wellness goals", while the `build-plan` skill still invites "symptoms, a prescription or lab results" (`plugins/welldium/skills/build-plan/SKILL.md`). Options: keep clinical inputs in the skill (more useful, higher OpenAI risk), or limit it to goals and product needs (lower risk). The skill ships to both directories.
2. **Client disclosure (Anthropic requirement).** Clients who receive a plan must be told AI helped produce it. Where should that go: the plan page, the share email or SMS, or both? Is the wording "Prepared by your practitioner with AI assistance" acceptable? This needs an API or web change.
3. **Plan notes and intake instructions** can hold health details typed by the practitioner. Do we treat them as health data in the privacy policy and the directories' data-handling answers?
4. **Public documentation page**: who writes it, and at which URL?
5. **Submission order**: Anthropic first, then OpenAI with what we learn? If OpenAI rejects, we can appeal by replying to the rejection email.

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
| `scripts/build-openai.mjs` | Builds `dist/<name>-<version>-openai.zip` for the OpenAI directory (`--test`: from the test copy) |
| `scripts/build-test.mjs` | Generates the unpublished test copy `dist/welldium-test` from `plugins/welldium` |
| `scripts/release.config.json` | Per-plugin OAuth client id and review file used in the OpenAI ZIP |
| `review/<name>.json` | OpenAI review test cases, demo URL and release notes (merged into the ZIP manifest) |
| `.github/workflows/validate.yml` | PRs and main: all checks + ZIP build (downloadable artifact) |
| `.github/workflows/release.yml` | Tag `<name>--v<version>`: draft GitHub release with the ZIP |
