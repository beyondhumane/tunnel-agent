---
description: What Tunnel Agent is, which engines it runs and how the pieces fit together.
group: Getting started
order: 1
---
# Introduction

Tunnel Agent is a free, open-source desktop app that manages local AI proxy engines for you. You sign in to the providers you already use, start an engine with one click and point any coding agent at the local endpoint it exposes.

It is a native app built with .NET and Avalonia, so it looks and behaves the same on Windows, macOS and Linux, in light or dark mode and in 14 languages.

## How it fits together

```text
coding agent ──► http://127.0.0.1:<port>/v1 ──► engine ──► your provider accounts
 (Claude Code,        (local endpoint)          (CLIProxyAPI,     (OAuth, API keys,
  Codex, OpenCode…)                              Perplexity,       session tokens)
                                                 9Router)
```

Tunnel Agent itself does not proxy model traffic. It downloads, configures, starts and monitors the engines, stores their settings and gives you a window to manage accounts, quotas, fallbacks and agents.

## Engines

| Engine | Default endpoint | What it does |
| --- | --- | --- |
| [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) | `http://127.0.0.1:8317/v1` | Unified proxy for OAuth and OpenAI-compatible upstream providers. |
| [Perplexity WebUI Scraper](https://github.com/Villoh/perplexity-webui-scraper) | `http://127.0.0.1:8327/v1` | OpenAI-compatible API backed by Perplexity WebUI sessions. |
| [9Router](https://github.com/decolua/9router) | `http://127.0.0.1:20128/v1` | OpenAI-compatible router for 40+ providers with auto-fallback. |

All engines listen on localhost only. You can run any combination at the same time.

## What you can do

- **Providers**: connect OAuth accounts (Claude, OpenAI, Kimi, Antigravity, xAI, Devin, Meta), add API keys or custom OpenAI-compatible providers, and manage Perplexity sessions. See [Providers](providers.md).
- **Quota**: watch remaining usage for supported accounts and IDEs. See [Quota](quota.md).
- **Fallback**: build virtual models that switch provider when quota runs out. See [Model fallback](fallback.md).
- **Agents**: configure Claude Code, Codex CLI, OpenCode and others in one click. See [Coding agents](agents.md).
- **Dashboard and logs**: requests, tokens and estimated cost per model and provider.

> [!NOTE]
> Tunnel Agent is an independent project. It is not affiliated with any of the providers it connects to. Make sure your use of each account follows that provider's terms.

Ready? Continue with [Installation](installation.md).
