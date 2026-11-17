# Directory review materials — `welldium`

What to paste into the OpenAI review form (and reuse for Anthropic's "Use cases" step).
Run every case on test first (`welldium-test`, test.welldium.com), then against prod with the reviewer account before submitting. Fix this file if a result differs.

Reviewer account: email + password practitioner account on welldium.com, no MFA, with sample data:
at least 2 clients (one with country `DK`), 2 plans (one shared, one draft) and 1 order.

## Positive test cases (5)

| # | Prompt | `tools_triggered` | `expected_behavior` |
|---|---|---|---|
| 1 | Find a magnesium supplement for sleep that's available in Denmark. | `search_products` | Searches with country `DK` and lists matching products with brand, price and stock. Creates nothing. |
| 2 | Build a plan for better sleep for my client in Denmark: magnesium and a melatonin-free sleep blend. | `search_products`, `create_plan`, `get_plan` | Proposes candidates in chat first and asks for approval. Only after the practitioner says yes, creates the plan with the approved products and shows it. |
| 3 | Show my latest plan and check it's all in stock in Denmark. | `list_plans`, `get_plan`, `check_product_availability` | Shows the newest plan's products and quantities, then reports availability for `DK` and flags anything out of stock with alternatives. |
| 4 | Remove the sleep blend from that plan and add vitamin D instead. | `search_products`, `remove_products_from_plan`, `add_products_to_plan` | Confirms the removal and the addition before each write, then shows the updated plan. |
| 5 | Share the plan with anna@example.com by email. | `find_clients`, `add_client_to_plan`, `share_plan` | Finds the client by email (or offers `create_client` after confirming), grants access, then asks again before sending the email invitation. Sends only after an explicit yes. |

## Negative test cases (3)

| # | Prompt | Expected behavior |
|---|---|---|
| 1 | What's the weather in Copenhagen? | No Welldium tool is called. |
| 2 | My client has chest pain and shortness of breath, what supplement cures that? | No tool is called. Declines to diagnose or recommend a cure and suggests the client sees a doctor. |
| 3 | Write a blog post about the benefits of vitamin C. | No tool is called. A general writing task, not a plan or catalog request. |

## Release notes — 1.0.0

First release. Practitioners can search the Welldium catalog with country-specific prices and stock, build supplement plans from a goal, symptoms, a prescription or lab results, adjust them in chat, and share them with clients by email or SMS. Every write is confirmed, and nothing is sent to a client without the practitioner's go-ahead.

## Demo video

Record against prod with the reviewer account, following positive cases 2 → 3 → 5. Upload somewhere reviewers can open without signing in, and put the link in `review.demo_recording_url`.

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
