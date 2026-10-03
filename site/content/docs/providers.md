---
description: Connect OAuth accounts, API keys, custom OpenAI-compatible providers, Perplexity sessions and 9Router connections.
group: Using Tunnel Agent
order: 4
---
# Providers

The **Providers** screen has one tab per engine. Each tab shows the endpoint, a start/stop button and the accounts the engine can use.

## CLIProxyAPI

### OAuth accounts

These providers sign in through your browser:

| Provider | Notes |
| --- | --- |
| Claude | Anthropic models via OAuth or API key. |
| OpenAI | OpenAI models via OAuth or API key. |
| Kimi | Moonshot AI via OAuth. |
| Antigravity | Antigravity AI via OAuth. |
| xAI | Grok models via xAI OAuth. |
| Devin | Cognition Devin via OAuth. |
| Meta | Muse Spark models via Meta OAuth. |

Click **Add Account**, finish signing in and the account appears under the provider. You can connect several accounts per provider, enable or disable each one, or remove it.

### API keys and custom providers

Gemini and any service with an OpenAI-compatible API are added with an API key. Use **Add custom provider** to register a base URL, a name and the models it serves.

### Routing between accounts

When a provider has several accounts or keys, **Configuration → CLIProxyAPI → Routing strategy** decides how requests are spread:

- **Round Robin**: even distribution across accounts.
- **Fill First**: use the first account until it hits its limit, then move on.

## Perplexity

Perplexity WebUI Scraper uses session tokens from the Perplexity web app. Click **Add account**, paste the session token and give it a label. One account is the **default**; you can switch it at any time.

> [!WARNING]
> A session token gives full access to that Perplexity account. Tunnel Agent stores it on your disk only, readable by your user. See [Data and privacy](data-storage.md).

## 9Router

Start 9Router first: its connections live inside the running engine. You can then add an API key or connect a provider with OAuth (Kiro, OpenCode Free, Claude, Gemini, Copilot and more). Use **9Router combos** to group models for ordered fallback, round robin, or a panel-and-judge **Fusion** strategy.

## Available models

Each tab lists the models exposed by the running engine. These are the model ids you use in your agent or in [fallback chains](fallback.md).
