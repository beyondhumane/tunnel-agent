---
description: Descarga e instala Tunnel Agent en Windows, macOS o Linux.
group: Primeros pasos
order: 2
---
# Instalación

Cada versión se publica en [GitHub Releases](https://github.com/beyondhumane/tunnel-agent/releases) con builds para x64 y ARM64. La app se prueba sobre todo en Windows.

## Windows

**Instalador (recomendado).** Descarga `TunnelAgent-win-x64-Setup.exe` (o `win-arm64`) y ejecútalo. Las versiones con instalador se actualizan solas en segundo plano.

**Portable.** Descarga `TunnelAgent-win-x64-Portable.zip`, extráelo donde quieras y ejecuta `TunnelAgent.exe`. No se instala nada.

**Scoop.**

```powershell
scoop bucket add villoh https://github.com/Villoh/scoop-bucket
scoop install tunnel-agent
```

Scoop instala una versión con el actualizador integrado desactivado, para que sea Scoop quien gestione las actualizaciones.

## macOS

Descarga el `.pkg` para tu Mac (`osx-arm64` para Apple Silicon, `osx-x64` para Intel) y ábrelo. También hay un `.zip` con el bundle de la app.

## Linux

Elige el formato que mejor encaje con tu distribución:

| Formato | Úsalo en |
| --- | --- |
| `.AppImage` | Cualquier distribución. Hazlo ejecutable y ábrelo. |
| `.deb` | Debian, Ubuntu y derivadas. |
| `.rpm` | Fedora, openSUSE y derivadas. |

```bash
chmod +x TunnelAgent-*-linux-x64.AppImage
./TunnelAgent-*-linux-x64.AppImage
```

## Requisitos

- Windows 10 o posterior, un macOS reciente o un escritorio Linux de 64 bits.
- **Solo para 9Router:** [Node.js 18+](https://nodejs.org/) en el `PATH`. CLIProxyAPI y Perplexity WebUI Scraper son binarios autónomos.

## Primer arranque

En el primer arranque, Tunnel Agent descarga los binarios de los motores desde sus releases de GitHub y los verifica con SHA256 antes de instalarlos. Puedes elegir otra versión del motor, o desactivar las actualizaciones automáticas, en [Configuración](configuration.md).

Siguiente: [Inicio rápido](quick-start.md).
