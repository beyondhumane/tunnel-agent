---
description: Where Tunnel Agent keeps settings, engine binaries, credentials and session tokens on each platform.
group: Reference
order: 9
---
# Data and privacy

Your settings and credentials stay on your machine. Tunnel Agent talks to GitHub to download releases and to your providers on your behalf; the project runs no server of its own.

## Settings

| Platform | Path |
| --- | --- |
| Windows | `%AppData%\TunnelAgent\settings.json` |
| macOS | `~/Library/Preferences/TunnelAgent/settings.json` |
| Linux | `~/.config/TunnelAgent/settings.json` |

## Engine binaries

| Platform | Path |
| --- | --- |
| Windows | `%LocalAppData%\TunnelAgent\engine\` |
| macOS | `~/Library/Application Support/TunnelAgent/engine/` |
| Linux | `~/.local/share/TunnelAgent/engine/` |

9Router keeps its own runtime data in `%APPDATA%\9router` on Windows and `~/.9router` on macOS and Linux.

## Credentials

CLIProxyAPI OAuth tokens and custom keys live in `~/.cli-proxy-api/` (`%UserProfile%\.cli-proxy-api\` on Windows). This folder belongs to CLIProxyAPI; Tunnel Agent only touches the files it manages.

Perplexity session tokens are stored one file per account under `perplexity-accounts/` in the settings folder.

> [!WARNING]
> Tokens are stored in plain text, protected by your operating system's file permissions. Do not share these folders or commit them to a repository.

## Resetting

**Reset all credentials** and **Reset session accounts** in [Configuration](configuration.md) back up the files to a timestamped `.backup/` folder before deleting them.
