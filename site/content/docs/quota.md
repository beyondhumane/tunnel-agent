---
description: Track session and weekly limits for connected accounts and standalone IDEs.
group: Using Tunnel Agent
order: 5
---
# Quota

The **Quota** screen shows how much of each plan you have used and when it resets.

## Supported accounts

| Source | Providers |
| --- | --- |
| CLIProxyAPI accounts | Claude, Codex, Devin, Antigravity, xAI |
| Standalone IDE accounts | Cursor, Kiro, Trae |
| 9Router connections | Usage limits reported by 9Router |

Standalone IDE accounts are detected from the IDE's local sign-in. Open **Quota Providers** and use **Scan** if one is missing; it must be installed and signed in on this machine.

## Reading the bars

Each account lists its windows, for example **Primary (5h)** and **Weekly**, with the percentage used and the time until reset. Some providers only start the timer once you use the quota.

Use the refresh button on an account, or **Refresh all**, to fetch fresh values.

## When something goes wrong

| Message | What to do |
| --- | --- |
| Authentication expired | Sign in to the provider again, then refresh. |
| Local authentication data was not found | Open the IDE, sign in, then refresh. |
| Quota API is rate limited | Tunnel Agent shows the last values and retries automatically after a few minutes. |
| No quota data available | The account has no active plan or the provider returned no usage. |

> [!TIP]
> Enable **Configuration → General → Hide sensitive information** before sharing screenshots: account emails are replaced with dots.
