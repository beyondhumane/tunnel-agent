---
description: Qué es Tunnel Agent, qué motores ejecuta y cómo encajan las piezas.
group: Primeros pasos
order: 1
---
# Introducción

Tunnel Agent es una app de escritorio gratuita y de código abierto que gestiona por ti motores de proxy de IA locales. Conecta cuentas compatibles, arranca un motor con un clic y apunta un agente de programación compatible al endpoint local.

Es una app nativa hecha con .NET y Avalonia, así que se ve y se comporta igual en Windows, macOS y Linux, en modo claro u oscuro y en 14 idiomas.

## Cómo encaja todo

```text
agente de        ──► http://127.0.0.1:<puerto>/v1 ──► motor ──► tus cuentas de proveedor
programación          (endpoint local)                (CLIProxyAPI,    (OAuth, claves API,
(Claude Code,                                          Perplexity,      tokens de sesión)
 Codex, OpenCode…)                                     9Router)
```

El tráfico de modelos pasa normalmente por los motores locales. Tunnel Agent los descarga, configura, arranca y supervisa, guarda sus ajustes y te da una ventana para gestionar cuentas, cuotas, fallbacks y agentes. Su [fallback experimental de CLIProxyAPI](fallback.md) añade un puente local de enrutamiento delante de ese motor.

## Motores

| Motor | Endpoint por defecto | Qué hace |
| --- | --- | --- |
| [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) | `http://127.0.0.1:8317/v1` | Proxy unificado para proveedores OAuth y compatibles con OpenAI. |
| [Perplexity WebUI Scraper](https://github.com/Villoh/perplexity-webui-scraper) | `http://127.0.0.1:8327/v1` | API compatible con OpenAI basada en sesiones de Perplexity WebUI. |
| [9Router](https://github.com/decolua/9router) | `http://127.0.0.1:20128/v1` | Router multiproveedor compatible con OpenAI con combos de modelos con fallback, round robin y Fusion. |

Todos los motores escuchan solo en localhost. Puedes ejecutar cualquier combinación a la vez.

Tunnel Agent no incluye acceso de pago a modelos. Necesitas una suscripción válida, una clave API, una sesión o una conexión gratuita compatible. Los costes, cuotas y condiciones del proveedor siguen vigentes.

## Qué puedes hacer

- **Proveedores**: conecta cuentas OAuth (Claude, OpenAI, Kimi, Antigravity, xAI, Devin, Meta), añade claves API o proveedores personalizados compatibles con OpenAI, y gestiona sesiones de Perplexity. Consulta [Proveedores](providers.md).
- **Cuota**: sigue el uso restante de las cuentas e IDE compatibles. Consulta [Cuota](quota.md).
- **Fallback**: crea modelos virtuales que cambian de proveedor cuando se acaba la cuota. Consulta [Fallback de modelos](fallback.md).
- **Agentes**: configura Claude Code, Codex CLI, OpenCode y otros en un clic. Consulta [Agentes de programación](agents.md).
- **Panel y registros**: peticiones, tokens y coste estimado por modelo y proveedor.

> [!NOTE]
> Tunnel Agent es un proyecto independiente. No está afiliado a ninguno de los proveedores a los que se conecta. Asegúrate de que el uso de cada cuenta cumple las condiciones de su proveedor.

¿Listo? Sigue con la [Instalación](installation.md).
