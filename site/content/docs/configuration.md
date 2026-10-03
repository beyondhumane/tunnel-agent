---
description: General app settings and per-engine options for versions, ports, keys, routing and logs.
group: Reference
order: 8
---
# Configuration

**Configuration** has a **General** tab and one tab per engine.

## General

| Setting | What it does |
| --- | --- |
| Tunnel Agent | Shows the installed version and checks for updates. |
| Auto-check for app updates | Checks GitHub for a new version on startup. |
| Launch at login | Starts automatically and stays in the system tray. |
| Theme | Follow the system, or force light or dark. |
| Language | One of 14 display languages. |
| Hide sensitive information | Replaces account emails with dots. |

## CLIProxyAPI

| Setting | What it does |
| --- | --- |
| Engine version | Install a specific release; downloads are verified with SHA256. |
| Auto-start / Auto-check / Auto-update | Start with the app and keep the engine current. |
| Auth files location | Opens the folder with OAuth tokens and custom keys. |
| API keys | Keys accepted by clients. Agent setup uses the default key. |
| Web control panel / Management key | Serves CLIProxyAPI's management page; the key is its password. |
| Reset all credentials | Backs up and removes Tunnel Agent-managed tokens and keys. |
| Routing strategy | Round Robin or Fill First across accounts. |
| Listen port | Localhost only. Restart required. Default `8317`. |
| Proxy logs | Auto-refresh and refresh interval for the raw log view. |

## Perplexity

Engine version and updates, the accounts folder, **Reset session accounts** and the listen port (default `8327`).

## 9Router

Engine version and updates, dashboard login password, **Require API key**, API keys, the engine install folder, a shortcut to the local dashboard and the listen port (default `20128`).

> [!NOTE]
> Two engines cannot share a port. If you pick one that is in use, Tunnel Agent tells you which engine owns it.
