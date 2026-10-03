---
description: Conecta cuentas OAuth, claves API, proveedores personalizados compatibles con OpenAI, sesiones de Perplexity y conexiones de 9Router.
group: Uso de Tunnel Agent
order: 4
---
# Proveedores

La pantalla **Proveedores** tiene una pestaña por motor. Cada pestaña muestra el endpoint, un botón para iniciar o detener y las cuentas que puede usar el motor.

## CLIProxyAPI

### Cuentas OAuth

Estos proveedores inician sesión a través del navegador:

| Proveedor | Notas |
| --- | --- |
| Claude | Modelos de Anthropic por OAuth o clave API. |
| OpenAI | Modelos de OpenAI por OAuth o clave API. |
| Kimi | Moonshot AI por OAuth. |
| Antigravity | Antigravity AI por OAuth. |
| xAI | Modelos Grok por OAuth de xAI. |
| Devin | Devin de Cognition por OAuth. |
| Meta | Modelos Muse Spark por OAuth de Meta. |

Haz clic en **Agregar Cuenta**, termina el inicio de sesión y la cuenta aparecerá bajo el proveedor. Puedes conectar varias cuentas por proveedor, activar o desactivar cada una, o eliminarla.

### Claves API y proveedores personalizados

Gemini y cualquier servicio con una API compatible con OpenAI se añaden con una clave API. Usa **Añadir proveedor personalizado** para registrar una URL base, un nombre y los modelos que sirve.

### Reparto entre cuentas

Cuando un proveedor tiene varias cuentas o claves, **Configuración → CLIProxyAPI → Estrategia de enrutamiento** decide cómo se reparten las peticiones:

- **Round Robin**: reparto equitativo entre cuentas.
- **Fill First**: usa la primera cuenta hasta que llegue a su límite y luego pasa a la siguiente.

## Perplexity

Perplexity WebUI Scraper usa tokens de sesión de la web de Perplexity. Haz clic en **Agregar cuenta**, pega el token de sesión y ponle una etiqueta. Una de las cuentas es la **predeterminada**; puedes cambiarla cuando quieras.

> [!WARNING]
> Un token de sesión da acceso completo a esa cuenta de Perplexity. Tunnel Agent solo lo guarda en tu disco, legible por tu usuario. Consulta [Datos y privacidad](data-storage.md).

## 9Router

Arranca primero 9Router: sus conexiones viven dentro del motor en marcha. Después puedes añadir una clave API o conectar un proveedor por OAuth (Kiro, OpenCode Free, Claude, Gemini, Copilot y más). Usa los **combos de 9Router** para agrupar modelos con fallback ordenado, round robin o la estrategia **Fusion** de panel y juez.

## Modelos disponibles

Cada pestaña lista los modelos que expone el motor en marcha. Son los ids de modelo que usas en tu agente o en las [cadenas de fallback](fallback.md).
