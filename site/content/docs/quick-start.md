---
description: From a fresh install to your first prompt through the local endpoint in four steps.
group: Getting started
order: 3
---
# Quick start

This guide uses CLIProxyAPI, the default engine. The steps are the same for the others.

1. **Start the engine.** Open **Providers**, choose the CLIProxyAPI tab and press the play button next to the endpoint. The status pill in the sidebar turns green when the engine is running.
2. **Connect a provider.** In the same tab, click **Add Account** on a provider such as Claude or OpenAI and finish the sign-in in your browser. For API-key providers, click the key icon and paste your key.
3. **Check the models.** The **Available models** section lists every model the running engine exposes. If it is empty, the engine is not running or no account is connected.
4. **Configure your agent.** Open **Agents**, click **Configure** next to an installed agent, choose the models and press **Apply**. Tunnel Agent writes the agent's config file and keeps a backup.

That's it: run your agent as usual and its requests go through the local endpoint.

## Using any other client

Anything that speaks the OpenAI API works. Copy the endpoint from the Providers header and an API key from **Configuration → CLIProxyAPI → API keys**:

```bash
export OPENAI_BASE_URL=http://127.0.0.1:8317/v1
export OPENAI_API_KEY=<a key from Configuration>

curl "$OPENAI_BASE_URL/models" -H "Authorization: Bearer $OPENAI_API_KEY"
```

> [!TIP]
> Turn on **Configuration → CLIProxyAPI → Auto-start** so the engine starts with the app, and **General → Launch at login** to keep Tunnel Agent in the system tray.
