---
description: Build Tunnel Agent from source, run the tests and send a pull request.
group: Project
order: 11
---
# Contributing

Contributions are welcome. Tunnel Agent is written in C# on .NET 10 with Avalonia 11 and CommunityToolkit.Mvvm.

## Build from source

Install the [.NET SDK 10.0.203+](https://dotnet.microsoft.com/download), then:

```bash
git clone https://github.com/beyondhumane/tunnel-agent.git
cd tunnel-agent
dotnet restore
dotnet run --project src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj
```

Run the tests:

```bash
dotnet test tests/TunnelAgent.Tests/TunnelAgent.Tests.csproj
```

## Repository layout

| Path | Contents |
| --- | --- |
| `src/TunnelAgent.Abstractions` | Shared interfaces and models. |
| `src/TunnelAgent.Core` | Engine catalog and core logic. |
| `src/TunnelAgent.Infrastructure` | Platform and storage implementations. |
| `src/TunnelAgent.Avalonia` | The desktop app: views, view models, services, themes and translations. |
| `tests/TunnelAgent.Tests` | Unit tests. |
| `site` | This website. |

## Pull requests

- Keep PRs focused: one feature or fix per PR.
- Match the existing code style and naming.
- Add a bullet to `CHANGELOG.md` under `## [Unreleased]` for every behavioural change.
- All CI checks must pass before merging.

## Working on this site

The site is a Vite + React app prerendered to static HTML. Pages live in `site/content/docs/*.md`, with Spanish translations in `site/content/docs/es/*.md`.

```bash
cd site
npm install
npm run dev
```

## Credits

Tunnel Agent builds on [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI), [perplexity-webui-scraper](https://github.com/henrique-coder/perplexity-webui-scraper) and [9Router](https://github.com/decolua/9router), and was inspired by [VibeProxy](https://github.com/automazeio/vibeproxy). Quota tracking draws on [Quotio](https://github.com/nguyenphutrong/quotio) and [OpenUsage](https://github.com/robinebers/openusage).
