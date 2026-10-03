---
description: Apunta Claude Code, Codex CLI, OpenCode, Pi, Factory Droid, Grok Build y otros agentes al endpoint local.
group: Uso de Tunnel Agent
order: 7
---
# Agentes de programación

La pantalla **Agentes** detecta qué agentes de programación están instalados y los configura para usar un motor local.

## Agentes compatibles

| Agente | Fichero de configuración que se escribe |
| --- | --- |
| Claude Code | `~/.claude/settings.json` |
| Codex CLI | `~/.codex/config.toml` y `~/.codex/auth.json` |
| OpenCode | `~/.config/opencode/opencode.json` |
| Pi | `~/.pi/agent/models.json` |
| Oh My Pi (OMP) | `~/.omp/agent/models.yml` |
| Factory Droid | `~/.factory/settings.json` |
| Grok Build | `~/.grok/config.toml` |

Los agentes se detectan buscando su comando en el `PATH`. Si falta alguno, instálalo y pulsa **Detectar agentes**.

## Configurar un agente

1. **Arranca un motor.** La lista de modelos se lee del motor en marcha.
2. **Abre el diálogo.** Haz clic en **Configurar** junto al agente, o en **Configurar varios** para aplicar la misma configuración a varios agentes.
3. **Elige el modo.** **Automático** escribe directamente el fichero de configuración y antes crea una copia de seguridad. **Manual** muestra una vista previa que puedes copiar tú mismo al fichero.
4. **Elige los modelos y aplica.** Selecciona los modelos que quieres exponer y pulsa **Aplicar**.

El agente mostrará entonces la etiqueta **Configurado**. Usa **Restablecer configuración** para deshacer el cambio.

## Otros clientes

Usa un cliente que admita los endpoints compatibles con OpenAI y los modelos del motor elegido. Usa su endpoint y una clave local de cliente de **Configuración**:

| Motor | URL base |
| --- | --- |
| CLIProxyAPI | `http://127.0.0.1:8317/v1` |
| Perplexity | `http://127.0.0.1:8327/v1` |
| 9Router | `http://127.0.0.1:20128/v1` |

> [!TIP]
> Usa el nombre de un [modelo virtual](fallback.md) como modelo del agente para tener fallback automático entre proveedores.
