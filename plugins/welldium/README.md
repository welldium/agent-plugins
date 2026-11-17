# Welldium

Build supplement plans for your clients from the Welldium catalog, then share them, without leaving Claude, ChatGPT or Codex.

## Who it is for

Health practitioners with a Welldium practitioner account. You sign in with that account the first time a Welldium tool is used.

## What it does

- **Search the catalog** with prices and stock for your client's country.
- **Draft a plan** around your client's wellness goals, and review it with you in chat.
- **Create and edit the plan** on Welldium once you approve it.
- **Share the plan** with your client by email or SMS, only when you say so.

The `build-plan` skill guides the assistant through these steps. It asks you to confirm every change and never contacts a client without your explicit go-ahead. It does not diagnose or make treatment claims: you make every clinical decision.

## What it connects to and what it sends

The plugin adds one remote MCP server, `https://welldium.com/api/partner/mcp`, operated by Welldium. It runs no local code, hooks or scripts.

Sign-in uses OAuth with your Welldium account at `welldium.com`. The assistant only receives an access token, never your password.

When a tool runs, the plugin sends Welldium only that tool's inputs:

- search phrases, product ids and country codes
- plan contents: products, quantities and intake instructions
- client details when you look up, create or share with a client: name, email address, phone number and country
- the channel (email or SMS) and an optional personal message when you share a plan

Anything else you share in the conversation, such as notes or documents, stays in the conversation. Only the product needs the assistant derives from it, as search phrases, are sent to Welldium. The plugin sends nothing to any other service.

## Privacy and support

- Privacy policy: https://welldium.com/privacy-policy
- Terms: https://welldium.com/practitioner-terms-conditions
- Help: https://welldium.com/faqs, support@welldium.com
