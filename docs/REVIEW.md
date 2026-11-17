# Directory review materials — `welldium`

What each directory asks for at review, where it goes, and what we give it.

| | OpenAI (ChatGPT + Codex) | Anthropic (Claude) |
|---|---|---|
| Test cases | **In the ZIP**: 5 positive + 3 negative under `extensions["com.openai"].review.test_cases`. Source: [`review/welldium.json`](../review/welldium.json), merged in by `scripts/build-openai.mjs`. Read-only in the dashboard: change the JSON and upload a new ZIP | None. The portal's **Use cases** step asks for use cases, prerequisites and read/write (answers below) |
| Demo video | **In the ZIP**: `review.demo_recording_url` (required for MCP review) | Not asked |
| Release notes | **In the ZIP**: `publication.release_notes` | Not asked. Listing text comes from `plugin.json` and the README |
| Reviewer account | **Portal** → Review details. Never in the package | By email, if the listing goes to Verified review |

Run every test case on test first (`node scripts/build-test.mjs`, then `claude --plugin-dir dist/welldium-test`), then on prod with the reviewer account, before submitting. If a result differs, fix `review/welldium.json`. `tools_triggered` is a comma-separated string of exact MCP tool names, because the portal rejects arrays.

## Reviewer account

OpenAI: the account "should work immediately without MFA approval, email or SMS codes, magic links, or private-network access."

- Email + password practitioner account on welldium.com: no SMS or passwordless sign-in, no MFA
- Sample data matching the test cases: a few products searchable in `DK`, at least 2 clients (one is `anna@example.com`, country `DK`), 2 plans (one shared, one draft), 1 order
- Sharing must not reach a real person. `example.com` doesn't deliver mail, so case 5 is safe. Give other sample clients addresses and phone numbers we own

## Demo video

Record against prod with the reviewer account, following positive cases 2 → 3 → 5. Host it where reviewers can open it without signing in, and put the URL in `review/welldium.json` → `review.demo_recording_url`. The build warns until it's set.

## Anthropic portal answers

**Use cases**
- Search the Welldium catalog with prices and stock for a client's country
- Build a supplement plan from a goal, symptoms, a prescription or lab results, and adjust it in chat
- Share the plan with a client by email or SMS, after the practitioner confirms

**What users need before connecting:** a Welldium practitioner account (free sign-up at welldium.com).

**Reads or writes:** both. It reads the catalog, plans, clients and orders. It writes plans and clients and sends share invitations, each after explicit confirmation.

**Data handling:** our own API. Handles personal data (client name, email, phone, country) and health-related context from the practitioner. No sponsored content.

## Prod OAuth clients (Welldium.Auth)

Register in the prod Auth DB once the OAuth provider is enabled there (`yarn oauth:register-client`, see Welldium.Auth `docs/oauth-client-registration.md`):

```bash
yarn oauth:register-client -- --client-id chatgpt --name "ChatGPT" \
  --redirect-uri https://chatgpt.com/connector_platform_oauth_redirect
yarn oauth:register-client -- --client-id claude --name "Claude" \
  --redirect-uri https://claude.ai/api/mcp/auth_callback \
  --redirect-uri http://localhost:8080/callback --redirect-uri http://127.0.0.1:8080/callback
yarn oauth:register-client -- --client-id codex --name "Codex" \
  --redirect-uri http://127.0.0.1:8787/callback --redirect-uri http://localhost:8787/callback
```

These match the ids in `plugins/welldium` (`claude.mcp.json`, `.mcp.json`) and `scripts/release.config.json`.

## Lessons from other submissions

From [aictrl.dev's OpenAI submission](https://github.com/aictrl-dev/skills/pull/83), whose commits record what the portal enforced:
- `tools_triggered` must be a string, not an array
- `shortDescription` ≤ 30 characters and `supportURL` are required (`scripts/check.mjs` checks both)
- The manifest `name` must match the existing listing's identifier on later uploads, so never rename the plugin
- The portal asked for a description that explains the plugin's main purpose, and couldn't confirm the chosen category
