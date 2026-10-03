---
description: Create virtual models that fall back to another provider model when quota is exhausted.
group: Using Tunnel Agent
order: 6
---
# Model fallback

Model fallback is an **experimental** CLIProxyAPI feature. A virtual model is a name you choose, for example `my-opus-thinking`, mapped to an ordered list of real provider models. When the first one runs out of quota, the request moves to the next.

## How it works

When fallback is enabled, Tunnel Agent runs a small local bridge on the public CLIProxyAPI port and moves CLIProxyAPI to an internal port behind it. Your agents keep using the same endpoint.

Turning the **Enable Fallback** switch off stops the bridge. Turning it on starts it even without virtual models; traffic is then forwarded unchanged.

## Create a virtual model

1. **Start CLIProxyAPI.** Tunnel Agent reads `/v1/models` from the running engine to list the models you can map.
2. **Enable fallback.** Open **Fallback** and turn on **Enable Fallback**.
3. **Add a model.** Click **Add Model**, type a name and pick the first real model.
4. **Add entries.** Use **Add Entry** to append more models. Reorder them with the arrows; a chain needs at least one entry.
5. **Use it.** Point your agent at the virtual model name.

## Route caching

With **Cache working routes** on, Tunnel Agent reuses the last entry that worked for the chosen duration (or until restart) before trying from the top again. Use **Reset cached route** to start over, or **Use this route now** to pin an entry.

> [!NOTE]
> 9Router has its own fallback system, **combos**, managed from the 9Router tab in Providers.
