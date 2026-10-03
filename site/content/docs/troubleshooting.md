---
description: Fixes for the most common problems with engines, ports, models, agents and quota.
group: Reference
order: 10
---
# Troubleshooting

## The engine does not start

- Check **Logs → Proxy Logs** for the engine's own output.
- Another program may be using the port. Change it in [Configuration](configuration.md) and restart the engine.
- For 9Router, make sure Node.js 18 or later is installed and on `PATH`, then restart Tunnel Agent.

## No models are listed

The model list comes from the running engine. Start it and connect at least one account. For fallback chains, CLIProxyAPI must be running so Tunnel Agent can read `/v1/models`.

## My agent still talks to the provider directly

- Confirm the agent shows **Configured** in **Agents**.
- Restart the agent: most CLIs read their config only at startup.
- Environment variables such as `ANTHROPIC_BASE_URL` or `OPENAI_BASE_URL` set in your shell override config files.

## Requests fail with 401

The client is not sending a key the engine accepts. Copy one from **Configuration → API keys** or reconfigure the agent.

## Quota shows an error

See the table in [Quota](quota.md#when-something-goes-wrong). Most errors are fixed by signing in to the provider again.

## Rebuilding from source on Windows fails

Stop Tunnel Agent before rebuilding: Windows locks `TunnelAgent.exe` while it is open.

## Still stuck?

Open an [issue](https://github.com/beyondhumane/tunnel-agent/issues) with your OS, the app version, steps to reproduce and relevant log lines. Remove tokens and emails before posting. Security problems go through the [security policy](https://github.com/beyondhumane/tunnel-agent/blob/main/SECURITY.md), not public issues.
