---
description: Compila Tunnel Agent desde el código fuente, ejecuta los tests y envía un pull request.
group: Proyecto
order: 11
---
# Contribuir

Las contribuciones son bienvenidas. Tunnel Agent está escrito en C# sobre .NET 10 con Avalonia 11 y CommunityToolkit.Mvvm.

## Compilar desde el código fuente

Instala el [SDK de .NET 10.0.203+](https://dotnet.microsoft.com/download) y después:

```bash
git clone https://github.com/beyondhumane/tunnel-agent.git
cd tunnel-agent
dotnet restore
dotnet run --project src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj
```

Ejecuta los tests:

```bash
dotnet test tests/TunnelAgent.Tests/TunnelAgent.Tests.csproj
```

## Estructura del repositorio

| Ruta | Contenido |
| --- | --- |
| `src/TunnelAgent.Abstractions` | Interfaces y modelos compartidos. |
| `src/TunnelAgent.Core` | Catálogo de motores y lógica principal. |
| `src/TunnelAgent.Infrastructure` | Implementaciones de plataforma y almacenamiento. |
| `src/TunnelAgent.Avalonia` | La app de escritorio: vistas, view models, servicios, temas y traducciones. |
| `tests/TunnelAgent.Tests` | Tests unitarios. |
| `site` | Esta web. |

## Pull requests

- Mantén los PR acotados: una función o corrección por PR.
- Sigue el estilo y los nombres del código existente.
- Añade una línea a `CHANGELOG.md` bajo `## [Unreleased]` por cada cambio de comportamiento.
- Todos los checks de CI tienen que pasar antes de mergear.

## Trabajar en esta web

La web es una app de Vite + React prerenderizada a HTML estático. Las páginas en inglés están en `site/content/docs/*.md` y sus traducciones al español en `site/content/docs/es/*.md`.

```bash
cd site
npm install
npm run dev
```

## Créditos

Tunnel Agent se apoya en [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI), [perplexity-webui-scraper](https://github.com/henrique-coder/perplexity-webui-scraper) y [9Router](https://github.com/decolua/9router), y se inspiró en [VibeProxy](https://github.com/automazeio/vibeproxy). El seguimiento de cuota se basa en [Quotio](https://github.com/nguyenphutrong/quotio) y [OpenUsage](https://github.com/robinebers/openusage).
