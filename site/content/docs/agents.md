---
description: Point Claude Code, Codex CLI, OpenCode, Pi, Factory Droid, Grok Build and other agents at the local endpoint.
group: Using Tunnel Agent
order: 7
---
# Coding agents

The **Agents** screen detects which coding agents are installed and configures them to use a local engine.

## Supported agents

| Agent | Config file written |
| --- | --- |
| Claude Code | `~/.claude/settings.json` |
| Codex CLI | `~/.codex/config.toml` and `~/.codex/auth.json` |
| OpenCode | `~/.config/opencode/opencode.json` |
| Pi | `~/.pi/agent/models.json` |
| Oh My Pi (OMP) | `~/.omp/agent/models.yml` |
| Factory Droid | `~/.factory/settings.json` |
| Grok Build | `~/.grok/config.toml` |

Agents are detected by looking for their command on `PATH`. If one is missing, install it and press **Detect agents**.

## Configure an agent

1. **Start an engine.** The model list is read from the running engine.
2. **Open the dialog.** Click **Configure** next to the agent, or **Configure multiple** to apply one setup to several agents.
3. **Choose the mode.** **Automatic** writes the config file directly and creates a backup first. **Manual** shows a preview you can copy to the target file yourself.
4. **Pick models and apply.** Select the models to expose and press **Apply**.

The agent then shows a **Configured** badge. Use **Reset configuration** to undo the change.

## Other clients

Use a client that supports the selected engine's OpenAI-compatible endpoints and models. Use that engine's endpoint and a local client key from **Configuration**:

| Engine | Base URL |
| --- | --- |
| CLIProxyAPI | `http://127.0.0.1:8317/v1` |
| Perplexity | `http://127.0.0.1:8327/v1` |
| 9Router | `http://127.0.0.1:20128/v1` |

> [!TIP]
> Use a [virtual model](fallback.md) name as the agent's model to get automatic fallback between providers.
