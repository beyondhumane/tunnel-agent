---
description: Download and install Tunnel Agent on Windows, macOS or Linux.
group: Getting started
order: 2
---
# Installation

Every release is published on [GitHub Releases](https://github.com/beyondhumane/tunnel-agent/releases) with builds for x64 and ARM64. The app is primarily tested on Windows.

## Windows

**Installer (recommended).** Download `TunnelAgent-win-x64-Setup.exe` (or `win-arm64`) and run it. Supported packaged builds can check for updates and prompt you to install them.

**Portable.** Download `TunnelAgent-win-x64-Portable.zip`, extract it anywhere and run `TunnelAgent.exe`. Nothing is installed.

**Scoop.**

```powershell
scoop bucket add villoh https://github.com/Villoh/scoop-bucket
scoop install tunnel-agent
```

Scoop installs a build with the built-in updater disabled, so Scoop owns updates.

## macOS

Download the `.pkg` for your Mac (`osx-arm64` for Apple Silicon, `osx-x64` for Intel) and open it. A `.zip` with the app bundle is also available.

## Linux

Pick the format that suits your distribution:

| Format | Use it on |
| --- | --- |
| `.AppImage` | Any distribution. Mark it executable and run it. |
| `.deb` | Debian, Ubuntu and derivatives. |
| `.rpm` | Fedora, openSUSE and derivatives. |

```bash
chmod +x TunnelAgent-*-linux-x64.AppImage
./TunnelAgent-*-linux-x64.AppImage
```

## Requirements

- Windows 10 or later, a recent macOS, or a 64-bit Linux desktop.
- **9Router only:** [Node.js 18+](https://nodejs.org/) on `PATH`. CLIProxyAPI and Perplexity WebUI Scraper are self-contained binaries.

## First launch

Tunnel Agent manages engine installation: CLIProxyAPI and Perplexity are downloaded from GitHub releases; 9Router is installed from the npm registry and needs Node.js. You can pick another engine version or control engine updates in [Configuration](configuration.md).

Next: [Quick start](quick-start.md).
