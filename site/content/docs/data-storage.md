---
description: Where Tunnel Agent keeps settings, engine binaries, credentials and session tokens on each platform.
group: Reference
order: 9
---
# Data and privacy

Your settings and credential files stay on your machine. Engines send prompts to your selected upstream providers, whose data policies apply. Tunnel Agent contacts GitHub for releases, npm for 9Router and models.dev for model pricing; the project runs no proxy service of its own.

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

**Reset all credentials** and **Reset session accounts** in [Configuration](configuration.md) back up files under `credential-backups/<timestamp>/` in the app's local data directory before deleting them. Perplexity copies use a `perplexity/` subfolder. These copies also contain plain-text credentials; Unix files are owner-only (`0600`), while Windows uses the user profile's permissions.

Backups older than seven days are pruned at provider initialization and when backup/reset operations run, not by a continuous timer. Manual recovery is possible from the remaining files; there is no in-app restore action. These credential backups are separate from the [coding agent configuration backups](agents.md).
