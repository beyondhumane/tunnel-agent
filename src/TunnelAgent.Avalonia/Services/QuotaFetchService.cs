using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using TunnelAgent.ViewModels;

namespace TunnelAgent.Services;

/// <summary>
/// Fetches live quota data directly from provider APIs using the OAuth
/// access_token stored in each auth-dir JSON file.
/// </summary>
public sealed class QuotaFetchService
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(10) };

    private readonly string _authDir;

    public QuotaFetchService(string authDir) => _authDir = authDir;

    public async Task FetchAndApplyAsync(ProviderViewModel provider, CancellationToken ct = default)
    {
        var tasks = new List<Task>();
        foreach (var account in provider.Accounts)
            tasks.Add(FetchAccountAsync(provider.Id, account, ct));
        await Task.WhenAll(tasks);
    }

    public Task FetchAccountPublicAsync(string providerId, ProviderAccountViewModel account,
        CancellationToken ct = default) =>
        FetchAccountAsync(providerId, account, ct);

    private Task FetchAccountAsync(string providerId, ProviderAccountViewModel account, CancellationToken ct)
    {
        if (account.IsCustomKey)
        {
            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                account.PlanBadge = "";
                account.QuotaBars.Clear();
                account.QuotaFetchedEmpty = true;
            });
            return Task.CompletedTask;
        }

        return providerId switch
        {
            "claude"         => FetchClaudeAsync(account, ct),
            "codex"          => FetchCodexAsync(account, ct),
            "devin"          => FetchDevinAsync(account, ct),
            "antigravity"    => FetchAntigravityAsync(account, ct),
            "xai"            => FetchXaiAsync(account, ct),
            "cursor"         => FetchCursorAsync(account, ct),
            "kiro"           => FetchKiroAsync(account, ct),
            "trae"           => FetchTraeAsync(account, ct),
            _                => Task.CompletedTask,
        };
    }

    // ── Claude ───────────────────────────────────────────────────────────────
    // GET https://api.anthropic.com/api/oauth/usage?cedar_ember=1
    // { "five_hour":  { "utilization": 70.0, "resets_at": "2026-05-13T23:00:00Z" },
    //   "seven_day":  { "utilization": 41.0, "resets_at": "2026-05-19T06:00:00Z" } }

    // cedar_ember=1 makes the endpoint also return the saved "limit reset" grants (same flag Claude Code uses).
    private const string ClaudeUsageUrl = "https://api.anthropic.com/api/oauth/usage?cedar_ember=1";

    // Anthropic decides cedar_ember grant eligibility by client surface (other agents come back
    // ineligible_reason "surface"), so identify as Claude Code like other usage monitors do.
    private const string ClaudeCodeUserAgent = "claude-cli/2.1.280 (external, cli)";

    // /api/oauth/usage rate-limits aggressively; shared by every QuotaFetchService instance.
    private static readonly ClaudeUsageThrottle ClaudeThrottle = new();

    private Task FetchClaudeAsync(ProviderAccountViewModel account, CancellationToken ct) =>
        FetchClaudeAsync(account, ct, force: false);

    private async Task FetchClaudeAsync(ProviderAccountViewModel account, CancellationToken ct, bool force)
    {
        var key = account.Email;
        var accountLock = ClaudeThrottle.LockFor(key);
        await accountLock.WaitAsync(ct);
        try
        {
            await FetchClaudeLockedAsync(account, key, ct, force);
        }
        finally
        {
            accountLock.Release();
        }
    }

    private async Task FetchClaudeLockedAsync(ProviderAccountViewModel account, string key, CancellationToken ct, bool force)
    {
        var token = ReadAccessToken("claude", account.Email);
        if (token is null)
        {
            SetQuotaError(account, QuotaErrorTokenUnavailable("Claude"));
            return;
        }

        var gate = ClaudeThrottle.Check(key, token, force);
        if (gate.Decision == ClaudeUsageThrottle.Decision.UseCache && gate.CachedBody is not null)
        {
            ApplyClaudeUsage(account, gate.CachedBody);
            return;
        }
        if (gate.Decision == ClaudeUsageThrottle.Decision.RateLimited)
        {
            ApplyClaudeRateLimited(account, gate.CachedBody, gate.RetryIn);
            return;
        }

        try
        {
            token = await RefreshClaudeTokenIfNeededAsync(account.Email, token, ct) ?? token;
            var (status, retryAfter, body) = await SendClaudeUsageAsync(token, ct);

            // Reactive refresh on 401/403, then retry once with the new token
            if (status is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden)
            {
                var refreshed = await RefreshClaudeTokenIfNeededAsync(account.Email, token, ct, force: true);
                if (refreshed is null)
                {
                    SetQuotaError(account, QuotaErrorAuthExpired("Claude"));
                    return;
                }
                token = refreshed;
                (status, retryAfter, body) = await SendClaudeUsageAsync(token, ct);
            }

            if (status == System.Net.HttpStatusCode.TooManyRequests)
            {
                var (retryIn, cachedBody) = ClaudeThrottle.RecordRateLimited(key, retryAfter);
                ApplyClaudeRateLimited(account, cachedBody, retryIn);
                return;
            }

            if ((int)status is < 200 or >= 300)
            {
                SetQuotaError(account, ToQuotaErrorMessage("Claude", status));
                return;
            }

            ApplyClaudeUsage(account, body);
            ClaudeThrottle.RecordSuccess(key, token, body);
        }
        catch (OperationCanceledException) { throw; }
        catch { }
    }

    private static async Task<(System.Net.HttpStatusCode Status, RetryConditionHeaderValue? RetryAfter, string Body)>
        SendClaudeUsageAsync(string token, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, ClaudeUsageUrl);
        AddClaudeOAuthHeaders(req, token);
        using var resp = await Http.SendAsync(req, ct);
        var body = resp.IsSuccessStatusCode ? await resp.Content.ReadAsStringAsync(ct) : "";
        return (resp.StatusCode, resp.Headers.RetryAfter, body);
    }

    /// <summary>Keeps the last good bars (with a notice) while rate limited; an error only when there is nothing to show.</summary>
    private static void ApplyClaudeRateLimited(ProviderAccountViewModel account, string? cachedBody, TimeSpan retryIn)
    {
        var minutes = ClaudeUsageThrottle.ToRetryMinutes(retryIn);
        if (cachedBody is null)
        {
            SetQuotaError(account, $"loc:Quota_Error_RateLimitedRetry|Claude|{minutes}");
            return;
        }
        ApplyClaudeUsage(account, cachedBody);
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            account.QuotaNotice = $"loc:Quota_Notice_RateLimitedRetry|Claude|{minutes}");
    }

    private static void ApplyClaudeUsage(ProviderAccountViewModel account, string json)
    {
        var body = JsonNode.Parse(json);
        if (body is null) return;

        // Plan badge from ~/.claude/.credentials.json
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var credsPath = Path.Combine(home, ".claude", ".credentials.json");
        if (File.Exists(credsPath))
        {
            try
            {
                var credDoc = JsonNode.Parse(File.ReadAllText(credsPath));
                var subType = credDoc?["claudeAiOauth"]?["subscriptionType"]?.GetValue<string>();
                if (!string.IsNullOrEmpty(subType))
                    Avalonia.Threading.Dispatcher.UIThread.Post(() =>
                        account.PlanBadge = ToPlanBadge(subType));
            }
            catch { }
        }

        var bars = new List<(string title, double utilization, string? resetsAt)>();

        // All known rate-limit windows
        var windows = new[]
        {
            ("five_hour",        "Primary (5h)"),
            ("seven_day",        "Weekly"),
            ("seven_day_opus",   "Weekly Opus"),
            ("seven_day_sonnet", "Weekly Sonnet"),
            ("seven_day_omelette", "Weekly Design"),
        };

        foreach (var (key, label) in windows)
        {
            var node = body[key];
            if (node is null) continue;
            var utilNode  = node["utilization"];
            var resetsAt  = node["resets_at"]?.GetValue<string>();
            if (utilNode is null) continue;
            var util = utilNode.GetValue<double>();
            // Always show the primary windows (five_hour, seven_day) even at 0%
            // so users see all their quotas. Only skip sub-plan windows (opus/sonnet/design)
            // when zero with no reset date, as those indicate the plan doesn't include them.
            var isSubWindow = key.StartsWith("seven_day_");
            if (isSubWindow && util == 0 && string.IsNullOrEmpty(resetsAt)) continue;
            // When a primary window (five_hour / seven_day) has no usage, the API returns
            // resets_at = null because the window hasn't started counting yet. Leave it
            // null so the UI shows no reset time — fabricating one (e.g. "in 5h") would be
            // a lie: the reset only begins once quota is actually consumed.
            bars.Add((label, util, resetsAt));
        }

        // extra_usage overage credits
        var extra = body["extra_usage"];
        if (extra?["is_enabled"]?.GetValue<bool>() == true)
        {
            var usedCts  = extra["used_credits"]?.GetValue<double>() ?? 0;
            // Only surface overage when something has actually been spent
            if (usedCts > 0)
            {
                var limitCts = extra["monthly_limit"]?.GetValue<double>();   // null = unlimited
                var currency = extra["currency"]?.GetValue<string>() ?? "USD";
                var limitStr = limitCts is null or 0 ? "unlimited" : $"{currency} {limitCts.Value / 100:0.00}";
                Avalonia.Threading.Dispatcher.UIThread.Post(() =>
                {
                    var badge = account.PlanBadge;
                    account.PlanBadge = string.IsNullOrEmpty(badge)
                        ? $"Overage: {currency} {usedCts / 100:0.00}/{limitStr}"
                        : $"{badge} · Overage: {currency} {usedCts / 100:0.00}/{limitStr}";
                });
            }
        }

        ApplyBarsFromUtilization(account, bars);

        var grants = ParseClaudeResetGrants(body["cedar_ember"]);
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            account.QuotaError = "";
            account.QuotaNotice = "";
            account.ResetCredits.Clear();
            foreach (var g in grants)
                account.ResetCredits.Add(new QuotaResetCreditViewModel(
                    account, g.Id, string.IsNullOrWhiteSpace(g.Label) ? "Rate limit reset" : g.Label,
                    FormatExpiresAtIso(g.EndsAt), g.ResetsLeft, g.UsableNow));
        });
    }

    /// <summary>
    /// Per-account guard for <c>/api/oauth/usage</c>: at most one live call per <see cref="MinInterval"/>
    /// (unless forced), and no calls at all while a 429 cooldown (Retry-After, else <see cref="DefaultCooldown"/>)
    /// is active. Keeps the last good response so callers can repaint it instead of blanking the bars.
    /// </summary>
    internal sealed class ClaudeUsageThrottle
    {
        internal enum Decision { Fetch, UseCache, RateLimited }

        internal readonly record struct Gate(Decision Decision, string? CachedBody, TimeSpan RetryIn);

        internal static readonly TimeSpan MinInterval = TimeSpan.FromMinutes(5);
        internal static readonly TimeSpan DefaultCooldown = TimeSpan.FromMinutes(5);

        private sealed class Entry
        {
            public string? Body;
            public string? Token;
            public DateTimeOffset FetchedAt;
            public DateTimeOffset? RateLimitedUntil;
        }

        private readonly Func<DateTimeOffset> _now;
        private readonly Dictionary<string, Entry> _entries = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, SemaphoreSlim> _accountLocks = new(StringComparer.OrdinalIgnoreCase);
        private readonly object _lock = new();

        internal ClaudeUsageThrottle(Func<DateTimeOffset>? now = null) => _now = now ?? (() => DateTimeOffset.UtcNow);

        internal SemaphoreSlim LockFor(string key)
        {
            lock (_lock)
            {
                if (!_accountLocks.TryGetValue(key, out var sem))
                    _accountLocks[key] = sem = new SemaphoreSlim(1, 1);
                return sem;
            }
        }

        /// <summary>A body fetched with a different token (re-login, external refresh) is dropped; the cooldown is kept.</summary>
        internal Gate Check(string key, string token, bool force)
        {
            lock (_lock)
            {
                if (!_entries.TryGetValue(key, out var e)) return new(Decision.Fetch, null, TimeSpan.Zero);
                if (e.Body is not null && e.Token != token) e.Body = null;
                var now = _now();
                if (e.RateLimitedUntil is { } until && now < until)
                    return new(Decision.RateLimited, e.Body, until - now);
                if (!force && e.Body is not null && now - e.FetchedAt < MinInterval)
                    return new(Decision.UseCache, e.Body, TimeSpan.Zero);
                return new(Decision.Fetch, e.Body, TimeSpan.Zero);
            }
        }

        internal void RecordSuccess(string key, string token, string body)
        {
            lock (_lock)
            {
                var e = GetOrAdd(key);
                e.Body = body;
                e.Token = token;
                e.FetchedAt = _now();
                e.RateLimitedUntil = null;
            }
        }

        internal (TimeSpan RetryIn, string? CachedBody) RecordRateLimited(string key, RetryConditionHeaderValue? retryAfter)
        {
            lock (_lock)
            {
                var now = _now();
                var retryIn = ParseRetryAfter(retryAfter, now) ?? DefaultCooldown;
                var e = GetOrAdd(key);
                e.RateLimitedUntil = now + retryIn;
                return (retryIn, e.Body);
            }
        }

        /// <summary>Drops the cached body so the next check fetches (the cooldown, if any, still applies).</summary>
        internal void Invalidate(string key)
        {
            lock (_lock)
            {
                if (_entries.TryGetValue(key, out var e)) e.Body = null;
            }
        }

        internal static TimeSpan? ParseRetryAfter(RetryConditionHeaderValue? retryAfter, DateTimeOffset now)
        {
            var wait = retryAfter?.Delta ?? (retryAfter?.Date is { } date ? date - now : null);
            return wait is null ? null : wait < TimeSpan.Zero ? TimeSpan.Zero : wait;
        }

        internal static int ToRetryMinutes(TimeSpan retryIn) => Math.Max(1, (int)Math.Ceiling(retryIn.TotalMinutes));

        private Entry GetOrAdd(string key)
        {
            if (!_entries.TryGetValue(key, out var e))
                _entries[key] = e = new Entry();
            return e;
        }
    }

    // ── Claude saved limit reset ("Reset for free") ─────────────────────────────
    // Real Claude account feature (Settings > Usage > Resets): eligible plans get grants they can
    // spend on demand to refill the 5h and/or weekly limit. Same undocumented endpoints Claude Code's
    // /limit-reset command uses (program "cedar_ember").
    // GET  /api/oauth/usage?cedar_ember=1
    //   { ..., "cedar_ember": { "eligible": true, "grants": [{ "id": "...", "label": "...", "resets_left": 1,
    //       "ends_at": "...", "clears": ["five_hour","seven_day"], "paused": false, "usable_now": true }] } }
    // POST /api/organizations/{org_uuid}/reset_rate_limits
    //   { "program": "cedar_ember", "grant_id": "...", "request_id": "<uuid>" }
    //   -> { "result": "reset" | "already_used" | "not_limited" | "cooldown" | "ineligible" | "unavailable", "resets_left": 0 }

    internal sealed record ClaudeResetGrant(string Id, string Label, int ResetsLeft, string? EndsAt, bool UsableNow);

    internal static List<ClaudeResetGrant> ParseClaudeResetGrants(JsonNode? block, DateTimeOffset? now = null)
    {
        var result = new List<ClaudeResetGrant>();
        try
        {
            if (block is not JsonObject || block["eligible"]?.GetValue<bool>() != true) return result;
            var at = now ?? DateTimeOffset.UtcNow;
            // The server only accepts claims for next_grant_id; other grants are listed but not redeemable yet.
            var nextId = block["next_grant_id"]?.GetValue<string>();
            foreach (var g in block["grants"]?.AsArray() ?? new JsonArray())
            {
                try
                {
                    var id = g?["id"]?.GetValue<string>();
                    if (string.IsNullOrEmpty(id)) continue;
                    var left = g!["resets_left"]?.GetValue<int>() ?? 0;
                    if (left <= 0 || g["paused"]?.GetValue<bool>() == true) continue;
                    var endsAt = g["ends_at"]?.GetValue<string>();
                    if (DateTimeOffset.TryParse(endsAt, out var end) && end <= at) continue;
                    result.Add(new ClaudeResetGrant(
                        id,
                        g["label"]?.GetValue<string>() ?? "",
                        left,
                        endsAt,
                        g["usable_now"]?.GetValue<bool>() == true && (nextId is null || nextId == id)));
                }
                catch { /* malformed grant — skip it, keep the rest */ }
            }
        }
        catch { /* malformed block — treat as no resets */ }
        return result;
    }

    /// <summary>Spends one saved Claude limit reset, then re-fetches usage so the bars and the remaining grants update.</summary>
    public async Task ConsumeClaudeResetCreditAsync(ProviderAccountViewModel account, string grantId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(grantId)) return;

        var token = ReadAccessToken("claude", account.Email);
        if (token is null) return;

        try
        {
            token = await RefreshClaudeTokenIfNeededAsync(account.Email, token, ct) ?? token;

            using var profileReq = new HttpRequestMessage(HttpMethod.Get, "https://api.anthropic.com/api/oauth/profile");
            AddClaudeOAuthHeaders(profileReq, token);
            using var profileResp = await Http.SendAsync(profileReq, ct);
            if (!profileResp.IsSuccessStatusCode) return;
            var profile = JsonNode.Parse(await profileResp.Content.ReadAsStringAsync(ct));
            var orgUuid = profile?["organization"]?["uuid"]?.GetValue<string>();
            if (string.IsNullOrEmpty(orgUuid)) return;

            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"https://api.anthropic.com/api/organizations/{Uri.EscapeDataString(orgUuid)}/reset_rate_limits");
            AddClaudeOAuthHeaders(req, token);
            req.Content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(new
                {
                    program = "cedar_ember",
                    grant_id = grantId,
                    request_id = Guid.NewGuid().ToString(),
                }),
                Encoding.UTF8, "application/json");

            using var resp = await Http.SendAsync(req, ct);
            var respDoc = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
            var code = respDoc?["result"]?.GetValue<string>();

            if (resp.IsSuccessStatusCode
                && (string.Equals(code, "reset", StringComparison.OrdinalIgnoreCase)
                 || string.Equals(code, "already_used", StringComparison.OrdinalIgnoreCase)))
            {
                // Drop the spent grant right away so it can't be re-clicked if the re-fetch below fails.
                Avalonia.Threading.Dispatcher.UIThread.Post(() =>
                {
                    foreach (var spent in account.ResetCredits.Where(c => c.Id == grantId).ToList())
                        account.ResetCredits.Remove(spent);
                });
                ClaudeThrottle.Invalidate(account.Email); // cached usage and grants predate the reset
                await FetchClaudeAsync(account, ct, force: true); // re-fetches usage + whatever grants remain
            }
        }
        catch (OperationCanceledException) { throw; }
        catch { /* leave the grant in the list so the user can retry */ }
    }

    private static void AddClaudeOAuthHeaders(HttpRequestMessage req, string token)
    {
        req.Headers.Add("Authorization", $"Bearer {token}");
        req.Headers.Add("Accept", "application/json");
        req.Headers.Add("anthropic-beta", "oauth-2025-04-20");
        req.Headers.Add("User-Agent", ClaudeCodeUserAgent);
    }

    /// <summary>Redeems a saved rate-limit reset for whichever provider owns the account.</summary>
    public Task ConsumeResetCreditAsync(string providerId, ProviderAccountViewModel account, string creditId,
        CancellationToken ct = default) => providerId switch
    {
        "claude" => ConsumeClaudeResetCreditAsync(account, creditId, ct),
        "codex"  => ConsumeCodexResetCreditAsync(account, creditId, ct),
        _        => Task.CompletedTask,
    };

    private async Task<string?> RefreshClaudeTokenIfNeededAsync(
        string email, string currentToken, CancellationToken ct, bool force = false)
    {
        const string ClientId  = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
        const string Scope     = "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload";
        const string RefreshUrl = "https://platform.claude.com/v1/oauth/token";

        if (!Directory.Exists(_authDir)) return null;
        foreach (var file in Directory.GetFiles(_authDir, $"claude-{email}*.json"))
        {
            try
            {
                var doc = JsonNode.Parse(File.ReadAllText(file))?.AsObject();
                if (doc is null) continue;

                var refreshToken = doc["refresh_token"]?.GetValue<string>();
                if (refreshToken is null) return null;

                var expired = doc["expired"]?.GetValue<string>();
                var isExpired = !DateTimeOffset.TryParse(expired, out var expDt)
                    || DateTimeOffset.UtcNow >= expDt.AddMinutes(-5);

                if (!force && !isExpired) return null; // still valid, no refresh needed

                var body = $"{{\"grant_type\":\"refresh_token\",\"refresh_token\":\"{refreshToken}\",\"client_id\":\"{ClientId}\",\"scope\":\"{Scope}\"}}";
                using var req = new HttpRequestMessage(HttpMethod.Post, RefreshUrl);
                req.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
                using var resp = await Http.SendAsync(req, ct);
                if (!resp.IsSuccessStatusCode) return null;

                var rDoc = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                var newToken = rDoc?["access_token"]?.GetValue<string>();
                if (newToken is null) return null;

                // Persist updated token
                var expiresIn = rDoc?["expires_in"]?.GetValue<int>() ?? 3600;
                doc["access_token"]  = newToken;
                doc["refresh_token"] = rDoc?["refresh_token"]?.GetValue<string>() ?? refreshToken;
                doc["expired"]       = DateTimeOffset.UtcNow.AddSeconds(expiresIn).ToString("o");
                File.WriteAllText(file, doc.ToJsonString());
                return newToken;
            }
            catch { }
        }
        return null;
    }

    // ── Codex (ChatGPT) ──────────────────────────────────────────────────────
    // GET https://chatgpt.com/backend-api/wham/usage
    // { "plan_type": "plus",
    //   "rate_limit": {
    //     "primary_window":   { "used_percent": 1,  "reset_at": 1778725667 },
    //     "secondary_window": { "used_percent": 22, "reset_at": 1779181031 } } }

    private async Task FetchCodexAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        var (token, accountId, lastRefresh) = ReadCodexToken(account.Email);
        if (token is null)
        {
            SetQuotaError(account, QuotaErrorTokenUnavailable("Codex"));
            return;
        }

        try
        {
            token = await RefreshCodexTokenIfNeededAsync(account.Email, token, lastRefresh, ct) ?? token;

            using var req = new HttpRequestMessage(HttpMethod.Get,
                "https://chatgpt.com/backend-api/wham/usage");
            req.Headers.Add("Authorization", $"Bearer {token}");
            req.Headers.Add("Accept", "application/json");
            req.Headers.Add("User-Agent", "TunnelAgent/1.0");
            if (!string.IsNullOrEmpty(accountId))
                req.Headers.Add("ChatGPT-Account-Id", accountId);

            using var resp = await Http.SendAsync(req, ct);

            // Reactive refresh on 401/403
            if (resp.StatusCode is System.Net.HttpStatusCode.Unauthorized
                                or System.Net.HttpStatusCode.Forbidden)
            {
                var refreshed = await RefreshCodexTokenIfNeededAsync(account.Email, token, DateTimeOffset.MinValue, ct);
                if (refreshed is null)
                {
                    SetQuotaError(account, QuotaErrorAuthExpired("Codex"));
                    return;
                }
                token = refreshed;
                using var req2 = new HttpRequestMessage(HttpMethod.Get,
                    "https://chatgpt.com/backend-api/wham/usage");
                req2.Headers.Add("Authorization", $"Bearer {token}");
                req2.Headers.Add("Accept", "application/json");
                req2.Headers.Add("User-Agent", "TunnelAgent/1.0");
                if (!string.IsNullOrEmpty(accountId))
                    req2.Headers.Add("ChatGPT-Account-Id", accountId);
                using var resp2 = await Http.SendAsync(req2, ct);
                if (!resp2.IsSuccessStatusCode)
                {
                    SetQuotaError(account, ToQuotaErrorMessage("Codex", resp2.StatusCode));
                    return;
                }
                await ParseCodexUsageAsync(account, resp2, ct);
                await FetchCodexResetCreditsAsync(account, token, accountId, ct);
                return;
            }

            if (!resp.IsSuccessStatusCode)
            {
                SetQuotaError(account, ToQuotaErrorMessage("Codex", resp.StatusCode));
                return;
            }
            await ParseCodexUsageAsync(account, resp, ct);
            await FetchCodexResetCreditsAsync(account, token, accountId, ct);
        }
        catch (OperationCanceledException) { throw; }
        catch { }
    }

    // ── Codex saved rate-limit reset ("banked reset") ──────────────────────────
    // Real ChatGPT/Codex account feature, unrelated to CLIProxyAPI: eligible plans can bank
    // an early reset of the current usage window and spend it on demand. Same undocumented
    // WHAM endpoints the Codex desktop app / IDE extensions use.
    // GET  https://chatgpt.com/backend-api/wham/rate-limit-reset-credits
    //   { "credits": [{ "id": "...", "status": "available", "expires_at": "..." }], "available_count": 1 }
    // POST https://chatgpt.com/backend-api/wham/rate-limit-reset-credits/consume
    //   { "credit_id": "...", "redeem_request_id": "<uuid>" } -> { "code": "reset" | "already_redeemed" | "no_credit" | "nothing_to_reset" }

    private async Task FetchCodexResetCreditsAsync(ProviderAccountViewModel account, string token, string? accountId, CancellationToken ct)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get,
                "https://chatgpt.com/backend-api/wham/rate-limit-reset-credits");
            req.Headers.Add("Authorization", $"Bearer {token}");
            req.Headers.Add("Accept", "application/json");
            req.Headers.Add("User-Agent", "TunnelAgent/1.0");
            if (!string.IsNullOrEmpty(accountId))
                req.Headers.Add("ChatGPT-Account-Id", accountId);

            using var resp = await Http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return;

            var doc = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
            var available = (doc?["credits"]?.AsArray() ?? new JsonArray())
                .Where(c => string.Equals(c?["status"]?.GetValue<string>(), "available", StringComparison.OrdinalIgnoreCase)
                         && !string.IsNullOrEmpty(c?["id"]?.GetValue<string>()))
                .Select(c => new QuotaResetCreditViewModel(
                    account,
                    c!["id"]!.GetValue<string>(),
                    c["title"]?.GetValue<string>() ?? "Rate limit reset",
                    FormatExpiresAtIso(c["expires_at"]?.GetValue<string>())))
                .ToList();

            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                account.ResetCredits.Clear();
                foreach (var credit in available)
                    account.ResetCredits.Add(credit);
            });
        }
        catch (OperationCanceledException) { throw; }
        catch { /* non-fatal — reset-credit visibility is a bonus, not required for quota */ }
    }

    /// <summary>Spends one saved Codex reset, then re-fetches usage so the bars and the remaining reset list update.</summary>
    public async Task ConsumeCodexResetCreditAsync(ProviderAccountViewModel account, string creditId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(creditId)) return;

        var (token, accountId, lastRefresh) = ReadCodexToken(account.Email);
        if (token is null) return;

        try
        {
            token = await RefreshCodexTokenIfNeededAsync(account.Email, token, lastRefresh, ct) ?? token;

            using var req = new HttpRequestMessage(HttpMethod.Post,
                "https://chatgpt.com/backend-api/wham/rate-limit-reset-credits/consume");
            req.Headers.Add("Authorization", $"Bearer {token}");
            req.Headers.Add("Accept", "application/json");
            req.Headers.Add("User-Agent", "TunnelAgent/1.0");
            if (!string.IsNullOrEmpty(accountId))
                req.Headers.Add("ChatGPT-Account-Id", accountId);
            req.Content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(new
                {
                    credit_id = creditId,
                    redeem_request_id = Guid.NewGuid().ToString(),
                }),
                System.Text.Encoding.UTF8, "application/json");

            using var resp = await Http.SendAsync(req, ct);
            var respDoc = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
            var code = respDoc?["code"]?.GetValue<string>();

            if (resp.IsSuccessStatusCode && string.Equals(code, "reset", StringComparison.OrdinalIgnoreCase))
                await FetchCodexAsync(account, ct); // re-fetches usage + whatever reset credits remain
        }
        catch (OperationCanceledException) { throw; }
        catch { /* leave the credit in the list so the user can retry */ }
    }

    private async Task ParseCodexUsageAsync(
        ProviderAccountViewModel account,
        HttpResponseMessage resp,
        CancellationToken ct)
    {
        var body = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
        if (body is null) return;

        var plan = body["plan_type"]?.GetValue<string>() ?? "";
        var apiEmail = body["email"]?.GetValue<string>() ?? "";

        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            if (!string.IsNullOrEmpty(plan)) account.PlanBadge = ToPlanBadge(plan);
            if (!string.IsNullOrEmpty(apiEmail)) account.Email = apiEmail;
        });

        var rl         = body["rate_limit"];
        var primary    = rl?["primary_window"];
        var secondary  = rl?["secondary_window"];
        var codeReview = body["code_review_rate_limit"]?["primary_window"];

        var bars = new List<(string title, double usedPct, long? resetAt)>();

        if (primary is not null)
            bars.Add((CodexWindowTitle(primary, "Primary"),
                primary["used_percent"]?.GetValue<double>() ?? 0,
                primary["reset_at"]?.GetValue<long>()));

        if (secondary is not null)
            bars.Add((CodexWindowTitle(secondary, "Weekly"),
                secondary["used_percent"]?.GetValue<double>() ?? 0,
                secondary["reset_at"]?.GetValue<long>()));

        if (codeReview is not null)
            bars.Add(("Code Review",
                codeReview["used_percent"]?.GetValue<double>() ?? 0,
                codeReview["reset_at"]?.GetValue<long>()));

        // Credits balance in badge when available
        var credits = body["credits"];
        if (credits?["has_credits"]?.GetValue<bool>() == true)
        {
            var unlimited = credits["unlimited"]?.GetValue<bool>() ?? false;
            var balanceStr = unlimited ? "unlimited" : $"${credits["balance"]?.GetValue<string>() ?? "0"}"; 
            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
                account.PlanBadge = string.IsNullOrEmpty(account.PlanBadge)
                    ? $"Credits: {balanceStr}"
                    : $"{account.PlanBadge} · Credits: {balanceStr}");
        }

        ApplyBarsFromPercent(account, bars);
    }

    private static string CodexWindowTitle(JsonNode window, string fallback)
    {
        var seconds = window["limit_window_seconds"]?.GetValue<long>();
        return seconds switch
        {
            18_000  => "Primary (5h)",
            604_800 => "Weekly",
            _       => fallback,
        };
    }

    private (string? token, string? accountId, DateTimeOffset lastRefresh) ReadCodexToken(string email)
    {
        if (!Directory.Exists(_authDir)) return (null, null, DateTimeOffset.MinValue);
        foreach (var file in Directory.GetFiles(_authDir, "codex-*.json"))
        {
            try
            {
                var doc = JsonNode.Parse(File.ReadAllText(file))?.AsObject();
                if (doc is null) continue;
                var fileEmail = doc["email"]?.GetValue<string>() ?? "";
                if (!string.IsNullOrEmpty(email) &&
                    !string.Equals(fileEmail, email, StringComparison.OrdinalIgnoreCase))
                    continue;
                var token     = doc["access_token"]?.GetValue<string>();
                if (token is null) continue;
                var accountId = doc["account_id"]?.GetValue<string>();
                DateTimeOffset.TryParse(doc["last_refresh"]?.GetValue<string>(), out var lastRefresh);
                return (token, accountId, lastRefresh);
            }
            catch { }
        }
        return (null, null, DateTimeOffset.MinValue);
    }

    private async Task<string?> RefreshCodexTokenIfNeededAsync(
        string email, string currentToken, DateTimeOffset lastRefresh, CancellationToken ct)
    {
        const string ClientId   = "app_EMoamEEZ73f0CkXaXp7hrann";
        const string RefreshUrl = "https://auth.openai.com/oauth/token";

        if (!Directory.Exists(_authDir)) return null;
        foreach (var file in Directory.GetFiles(_authDir, $"codex-{email}*.json"))
        {
            try
            {
                var doc = JsonNode.Parse(File.ReadAllText(file))?.AsObject();
                if (doc is null) continue;
                var refreshToken = doc["refresh_token"]?.GetValue<string>();
                if (refreshToken is null) return null;

                var expired = doc["expired"]?.GetValue<string>();
                var nearExpiry = DateTimeOffset.TryParse(expired, out var expDt)
                    && DateTimeOffset.UtcNow >= expDt.AddMinutes(-5);
                var staleRefresh = (DateTimeOffset.UtcNow - lastRefresh).TotalDays > 8;

                if (!nearExpiry && !staleRefresh) return null;

                using var req = new HttpRequestMessage(HttpMethod.Post, RefreshUrl);
                req.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type",    "refresh_token"),
                    new KeyValuePair<string, string>("client_id",     ClientId),
                    new KeyValuePair<string, string>("refresh_token", refreshToken),
                });
                using var resp = await Http.SendAsync(req, ct);
                if (!resp.IsSuccessStatusCode) return null;

                var rDoc = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                var newToken = rDoc?["access_token"]?.GetValue<string>();
                if (newToken is null) return null;

                var expiresIn = rDoc?["expires_in"]?.GetValue<int>() ?? 3600;
                doc["access_token"]  = newToken;
                doc["refresh_token"] = rDoc?["refresh_token"]?.GetValue<string>() ?? refreshToken;
                doc["id_token"]      = rDoc?["id_token"]?.GetValue<string>() ?? doc["id_token"]?.GetValue<string>();
                doc["expired"]       = DateTimeOffset.UtcNow.AddSeconds(expiresIn).ToString("o");
                doc["last_refresh"]  = DateTimeOffset.UtcNow.ToString("o");
                File.WriteAllText(file, doc.ToJsonString());
                return newToken;
            }
            catch { }
        }
        return null;
    }

    // ── Devin (Cognition) ─────────────────────────────────────────────────────
    // POST https://server.codeium.com/exa.seat_management_pb.SeatManagementService/GetUserStatus
    // Connect-RPC JSON; quota arrives as *remaining* percent, int64 fields as strings.

    private const string DevinUserStatusUrl =
        "https://server.codeium.com/exa.seat_management_pb.SeatManagementService/GetUserStatus";

    private async Task FetchDevinAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        var token = ReadDevinSessionToken(account.Email);
        if (token is null)
        {
            SetQuotaError(account, QuotaErrorTokenUnavailable("Devin"));
            return;
        }

        try
        {
            var body = new JsonObject
            {
                ["metadata"] = new JsonObject
                {
                    ["apiKey"]           = token,
                    ["ideName"]          = "devin",
                    ["ideVersion"]       = "1.108.2",
                    ["extensionName"]    = "devin",
                    ["extensionVersion"] = "1.108.2",
                    ["locale"]           = "en",
                },
            };
            using var req = new HttpRequestMessage(HttpMethod.Post, DevinUserStatusUrl)
            {
                Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json"),
            };
            req.Headers.Add("Connect-Protocol-Version", "1");
            using var resp = await Http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                SetQuotaError(account, ToQuotaErrorMessage("Devin", resp.StatusCode));
                return;
            }

            var status = ParseDevinUserStatus(JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct)));
            if (status is null)
            {
                SetQuotaError(account, QuotaErrorNoData("Devin"));
                return;
            }

            var (plan, bars, extraBalance) = status.Value;
            ApplyBarsFromPercent(account, bars);
            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                if (!string.IsNullOrEmpty(plan)) account.PlanBadge = plan;
                if (extraBalance is { } usd)
                    account.QuotaBars.Add(new QuotaBarViewModel
                    {
                        Title      = "Extra balance",
                        ValueLabel = $"${usd:0.00}",
                        ResetIn    = "",
                    });
            });
        }
        catch (OperationCanceledException) { throw; }
        catch { SetQuotaError(account, QuotaErrorRequestFailed("Devin")); }
    }

    /// <summary>
    /// Maps a GetUserStatus JSON response to bars (used %, reset unix). Returns null when no quota data.
    /// Mirrors openusage: flip remaining→used; a weekly reset without a percentage means 0% remaining
    /// (proto3 JSON omits zeros); with daily hidden and no weekly data, the daily figure shows as Weekly.
    /// </summary>
    internal static (string? Plan, List<(string title, double usedPct, long? resetAt)> Bars, double? ExtraBalanceUsd)?
        ParseDevinUserStatus(JsonNode? doc)
    {
        var planStatus = doc?["userStatus"]?["planStatus"];
        if (planStatus is null) return null;
        var planInfo  = planStatus["planInfo"];
        var plan      = planInfo?["planName"]?.GetValue<string>()?.Trim();
        var hideDaily = planInfo?["hideDailyQuota"]?.GetValue<bool>() == true;

        var dailyRemaining  = ProtoNumber(planStatus["dailyQuotaRemainingPercent"]);
        var weeklyRemaining = ProtoNumber(planStatus["weeklyQuotaRemainingPercent"]);
        var dailyReset      = (long?)ProtoNumber(planStatus["dailyQuotaResetAtUnix"]);
        var weeklyReset     = (long?)ProtoNumber(planStatus["weeklyQuotaResetAtUnix"]);
        var extraMicros     = ProtoNumber(planStatus["overageBalanceMicros"]);

        var bars = new List<(string title, double usedPct, long? resetAt)>();
        if (!hideDaily && (dailyRemaining ?? (dailyReset is not null ? 0 : null)) is { } d)
            bars.Add(("Daily", Math.Clamp(100 - d, 0, 100), dailyReset));
        if ((weeklyRemaining ?? (weeklyReset is not null ? 0 : null)) is { } w)
            bars.Add(("Weekly", Math.Clamp(100 - w, 0, 100), weeklyReset));
        else if (hideDaily && dailyRemaining is { } hd)
            bars.Add(("Weekly", Math.Clamp(100 - hd, 0, 100), weeklyReset));

        double? extra = extraMicros is { } m ? Math.Max(0, m) / 1_000_000 : null;
        if (bars.Count == 0 && extra is null) return null;
        return (string.IsNullOrEmpty(plan) ? null : plan, bars, extra);
    }

    /// <summary>Reads a proto3-JSON number, which int64 fields encode as strings.</summary>
    private static double? ProtoNumber(JsonNode? node)
    {
        if (node is not JsonValue v) return null;
        if (v.TryGetValue<double>(out var n)) return n;
        return v.TryGetValue<string>(out var s) && double.TryParse(s,
            System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var p) ? p : null;
    }

    private string? ReadDevinSessionToken(string email)
    {
        if (!Directory.Exists(_authDir)) return null;
        foreach (var file in Directory.GetFiles(_authDir, "devin-*.json"))
        {
            try
            {
                var doc = JsonNode.Parse(File.ReadAllText(file))?.AsObject();
                if (doc is null) continue;
                var fileEmail = doc["email"]?.GetValue<string>() ?? "";
                if (!string.IsNullOrEmpty(email) &&
                    !string.Equals(fileEmail, email, StringComparison.OrdinalIgnoreCase))
                    continue;
                var token = doc["session_token"]?.GetValue<string>() ?? doc["api_key"]?.GetValue<string>();
                if (!string.IsNullOrEmpty(token)) return token;
            }
            catch { }
        }
        return null;
    }

    // ── Antigravity ──────────────────────────────────────────────────────────
    // POST https://daily-cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels  (primary)
    // POST https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels         (fallback)

    // Models to exclude: Gemini 2.x variants and placeholders that duplicate newer entries
    private static readonly HashSet<string> _antigravityModelBlacklist = new(StringComparer.OrdinalIgnoreCase)
    {
        "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-thinking",
        "gemini-2.5-flash-lite", "gemini-3.1-flash-lite",
    };

    private async Task FetchAntigravityAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        var token = await ReadAntigravityTokenAsync(account.Email, ct);
        if (token is null)
        {
            SetQuotaError(account, QuotaErrorTokenUnavailable("Antigravity"));
            return;
        }

        try
        {
            // Step 1: loadCodeAssist to get projectId and plan badge
            string? projectId = null;
            using (var loadReq = new HttpRequestMessage(HttpMethod.Post,
                "https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist"))
            {
                loadReq.Headers.Add("Authorization", $"Bearer {token}");
                loadReq.Headers.Add("User-Agent", "antigravity/1.11.3");
                loadReq.Content = new StringContent(
                    "{\"metadata\":{\"ideType\":\"ANTIGRAVITY\"}}",
                    System.Text.Encoding.UTF8, "application/json");
                using var loadResp = await Http.SendAsync(loadReq, ct);
                if (loadResp.IsSuccessStatusCode)
                {
                    var loadBody = JsonNode.Parse(await loadResp.Content.ReadAsStringAsync(ct));
                    projectId = loadBody?["cloudaicompanionProject"]?.GetValue<string>();
                    var tierId = loadBody?["currentTier"]?["id"]?.GetValue<string>() ?? "";
                    var planBadge = tierId switch
                    {
                        var t when t.Contains("free")       => "Free",
                        var t when t.Contains("pro")        => "Pro",
                        var t when t.Contains("ultra")      => "Ultra",
                        var t when t.Contains("enterprise") => "Enterprise",
                        _ => ""
                    };
                    if (!string.IsNullOrEmpty(planBadge))
                        Avalonia.Threading.Dispatcher.UIThread.Post(() => account.PlanBadge = planBadge);
                }
            }

            // Step 2: fetchAvailableModels with projectId for real fractions
            var modelsPayload = projectId is not null
                ? $"{{\"project\":\"{projectId}\"}}"
                : "{}";

            JsonNode? body = null;
            foreach (var baseUrl in new[]
            {
                "https://daily-cloudcode-pa.googleapis.com",
                "https://cloudcode-pa.googleapis.com",
            })
            {
                using var req = new HttpRequestMessage(HttpMethod.Post,
                    $"{baseUrl}/v1internal:fetchAvailableModels");
                req.Headers.Add("Authorization", $"Bearer {token}");
                req.Headers.Add("User-Agent", "antigravity/1.11.3");
                req.Content = new StringContent(modelsPayload, System.Text.Encoding.UTF8, "application/json");
                using var resp = await Http.SendAsync(req, ct);
                if (!resp.IsSuccessStatusCode) continue;
                body = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                if (body is not null) break;
            }
            if (body is null)
            {
                SetQuotaError(account, QuotaErrorRequestFailed("Antigravity"));
                return;
            }

            var models = body["models"]?.AsObject();
            if (models is null)
            {
                SetQuotaError(account, QuotaErrorNoData("Antigravity"));
                return;
            }

            // Deduplicate by displayName: keep the entry with the lowest remainingFraction
            var seen = new Dictionary<string, (double remaining, string? resetTime)>(StringComparer.OrdinalIgnoreCase);

            foreach (var kvp in models)
            {
                var m           = kvp.Value;
                var displayName = m?["displayName"]?.GetValue<string>() ?? "";
                var isInternal  = m?["isInternal"]?.GetValue<bool>() ?? false;

                // Filter: internal models, empty display names, blacklisted IDs
                if (isInternal || string.IsNullOrEmpty(displayName)) continue;
                if (_antigravityModelBlacklist.Contains(kvp.Key)) continue;

                var qi                = m?["quotaInfo"];
                var remainingNode     = qi?["remainingFraction"];
                if (remainingNode is null) continue; // no quota data for this model (e.g. Claude on free plan)
                var remaining = remainingNode.GetValue<double>();
                var resetTime = qi?["resetTime"]?.GetValue<string>();

                if (!seen.TryGetValue(displayName, out var existing) || remaining < existing.remaining)
                    seen[displayName] = (remaining, resetTime);
            }

            var bars = seen
                .Select(kv => (title: kv.Key, used: 1.0 - kv.Value.remaining, resetTime: kv.Value.resetTime))
                .OrderBy(b => b.title)
                .ToList();

            if (bars.Count == 0) return;
            ApplyBarsFromFraction(account, bars);
        }
        catch (OperationCanceledException) { throw; }
        catch { }
    }

    private async Task<string?> ReadAntigravityTokenAsync(string email, CancellationToken ct)
    {
        // Antigravity OAuth credentials (from Quotio open-source implementation)
        // These are public OAuth app credentials, not user secrets
        const string clientId     = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com";
        const string clientSecret = "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";
        const string tokenUri     = "https://oauth2.googleapis.com/token";

        if (!Directory.Exists(_authDir)) return null;
        foreach (var file in Directory.GetFiles(_authDir, "antigravity-*.json"))
        {
            try
            {
                var doc = JsonNode.Parse(File.ReadAllText(file))?.AsObject();
                if (doc is null) continue;

                var fileEmail = doc["email"]?.GetValue<string>() ?? "";
                if (!string.IsNullOrEmpty(email) &&
                    !string.Equals(fileEmail, email, StringComparison.OrdinalIgnoreCase))
                    continue;

                var accessToken  = doc["access_token"]?.GetValue<string>();
                var refreshToken = doc["refresh_token"]?.GetValue<string>();
                var expiry       = doc["expired"]?.GetValue<string>();

                if (accessToken is null) continue;

                var isExpired = DateTimeOffset.TryParse(expiry, out var expiryDt)
                    && expiryDt - DateTimeOffset.UtcNow <= TimeSpan.FromSeconds(60);

                if (isExpired && refreshToken is not null)
                {
                    var refreshed = await RefreshGoogleTokenAsync(tokenUri, clientId, clientSecret, refreshToken, ct);
                    if (refreshed is null) return null;
                    return refreshed;
                }

                return accessToken;
            }
            catch { }
        }
        return null;
    }


    // ── xAI (Grok) ────────────────────────────────────────────────────────────
    // GET https://cli-chat-proxy.grok.com/v1/settings  (plan badge)
    // GET https://cli-chat-proxy.grok.com/v1/billing   (usage)

    private async Task FetchXaiAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        var token = await ReadXaiTokenAsync(account.Email, ct);
        if (token is null)
        {
            SetQuotaError(account, QuotaErrorTokenUnavailable("xAI"));
            return;
        }

        try
        {
            // Plan badge from /settings
            using (var settingsReq = new HttpRequestMessage(HttpMethod.Get,
                "https://cli-chat-proxy.grok.com/v1/settings"))
            {
                settingsReq.Headers.Add("Authorization", $"Bearer {token}");
                settingsReq.Headers.Add("X-XAI-Token-Auth", "xai-grok-cli");
                settingsReq.Headers.Add("Accept", "application/json");
                using var settingsResp = await Http.SendAsync(settingsReq, ct);
                if (settingsResp.IsSuccessStatusCode)
                {
                    var settingsBody = JsonNode.Parse(await settingsResp.Content.ReadAsStringAsync(ct));
                    var plan = settingsBody?["subscription_tier_display"]?.GetValue<string>();
                    if (!string.IsNullOrEmpty(plan))
                        Avalonia.Threading.Dispatcher.UIThread.Post(() => account.PlanBadge = plan);
                }
            }

            // Usage from /billing
            using var req = new HttpRequestMessage(HttpMethod.Get,
                "https://cli-chat-proxy.grok.com/v1/billing");
            req.Headers.Add("Authorization", $"Bearer {token}");
            req.Headers.Add("X-XAI-Token-Auth", "xai-grok-cli");
            req.Headers.Add("Accept", "application/json");
            using var resp = await Http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                SetQuotaError(account, ToQuotaErrorMessage("xAI", resp.StatusCode));
                return;
            }

            var doc    = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
            var config = doc?["config"];
            if (config is null)
            {
                SetQuotaError(account, QuotaErrorNoData("xAI"));
                return;
            }

            var used         = config["used"]?["val"]?.GetValue<double>() ?? 0;
            var monthlyLimit = config["monthlyLimit"]?["val"]?.GetValue<double>() ?? 0;
            var onDemandCap  = config["onDemandCap"]?["val"]?.GetValue<double>() ?? 0;
            var periodEnd    = config["billingPeriodEnd"]?.GetValue<string>();
            var resetIn      = FormatResetAtIso(periodEnd);

            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                account.QuotaBars.Clear();

                if (monthlyLimit > 0)
                {
                    account.QuotaBars.Add(new QuotaBarViewModel
                    {
                        Title   = $"Credits ({used:0}/{monthlyLimit:0})",
                        Used    = Math.Clamp(used / monthlyLimit, 0, 1),
                        ResetIn = resetIn,
                    });
                }
                // else: no active plan — bars stay empty, mark as fetched
                account.QuotaFetchedEmpty = true;

                if (onDemandCap > 0)
                    account.QuotaBars.Add(new QuotaBarViewModel
                    {
                        Title   = $"Pay as you go (cap: {onDemandCap:0})",
                        Used    = 0,
                        ResetIn = "",
                    });
            });
        }
        catch (OperationCanceledException) { throw; }
        catch { }
    }

    private async Task<string?> ReadXaiTokenAsync(string email, CancellationToken ct)
    {
        if (!Directory.Exists(_authDir)) return null;
        foreach (var file in Directory.GetFiles(_authDir, "xai-*.json"))
        {
            try
            {
                var text = File.ReadAllText(file);
                var doc  = JsonNode.Parse(text)?.AsObject();
                if (doc is null) continue;

                var fileEmail = doc["email"]?.GetValue<string>() ?? "";
                if (!string.IsNullOrEmpty(email) &&
                    !string.Equals(fileEmail, email, StringComparison.OrdinalIgnoreCase))
                    continue;

                var accessToken  = doc["access_token"]?.GetValue<string>();
                var refreshToken = doc["refresh_token"]?.GetValue<string>();
                var expiry       = doc["expired"]?.GetValue<string>();
                var tokenEndpoint = doc["token_endpoint"]?.GetValue<string>() ?? "https://auth.x.ai/oauth2/token";
                // client_id is stored in the JWT audience — extract from JSON directly
                var clientId = doc["sub"] is not null
                    ? ExtractXaiClientId(doc)
                    : null;

                if (accessToken is null) continue;

                var isExpired = DateTimeOffset.TryParse(expiry, out var expiryDt)
                    && expiryDt - DateTimeOffset.UtcNow <= TimeSpan.FromSeconds(60);

                if (isExpired && refreshToken is not null && clientId is not null)
                {
                    using var req = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint);
                    req.Content = new FormUrlEncodedContent(new Dictionary<string, string>
                    {
                        ["grant_type"]    = "refresh_token",
                        ["refresh_token"] = refreshToken,
                        ["client_id"]     = clientId,
                    });
                    using var resp = await Http.SendAsync(req, ct);
                    if (resp.IsSuccessStatusCode)
                    {
                        var body = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                        var newToken = body?["access_token"]?.GetValue<string>();
                        if (newToken is not null)
                        {
                            var newRefresh  = body?["refresh_token"]?.GetValue<string>() ?? refreshToken;
                            var expiresIn   = body?["expires_in"]?.GetValue<int>() ?? 21600;
                            doc["access_token"]  = newToken;
                            doc["refresh_token"] = newRefresh;
                            doc["expired"]       = DateTimeOffset.UtcNow.AddSeconds(expiresIn).ToString("o");
                            File.WriteAllText(file, doc.ToJsonString(
                                new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
                            return newToken;
                        }
                    }
                }

                return accessToken;
            }
            catch { }
        }
        return null;
    }

    private static string? ExtractXaiClientId(JsonObject doc)
    {
        // client_id is stored as the JWT audience — also present in token_endpoint host context
        // cli-proxy-api stores it directly in the file as the OAuth client_id used
        // Fall back to the known cli-proxy-api xAI client_id
        return "b1a00492-073a-47ea-816f-4c329264a828";
    }

    // ── Cursor ─────────────────────────────────────────────────────────────────

    private static async Task FetchCursorAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        try
        {
            var dbPath = CursorStateStore.ResolveStateDbPath();
            if (dbPath is null)
            {
                SetQuotaError(account, QuotaErrorLocalAuthMissing("Cursor"));
                return;
            }

            string? accessToken = null, refreshToken = null, email = null;
            await using (var conn = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={dbPath};Mode=ReadOnly"))
            {
                await conn.OpenAsync(ct);
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT key, value FROM ItemTable WHERE key IN ('cursorAuth/accessToken','cursorAuth/refreshToken','cursorAuth/cachedEmail')";
                await using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    if (reader.GetString(0) == "cursorAuth/accessToken")  accessToken  = reader.GetString(1);
                    if (reader.GetString(0) == "cursorAuth/refreshToken") refreshToken = reader.GetString(1);
                    if (reader.GetString(0) == "cursorAuth/cachedEmail")  email        = reader.GetString(1);
                }
            }

            if (string.IsNullOrEmpty(accessToken))
            {
                SetQuotaError(account, QuotaErrorTokenUnavailable("Cursor"));
                return;
            }

            var (planBody, usageBody) = await FetchCursorDashboardAsync(accessToken, ct);
            if (usageBody is null && !string.IsNullOrEmpty(refreshToken))
            {
                accessToken = await RefreshCursorTokenAsync(refreshToken, ct);
                if (string.IsNullOrEmpty(accessToken))
                {
                    SetQuotaError(account, QuotaErrorAuthExpired("Cursor"));
                    return;
                }
                (planBody, usageBody) = await FetchCursorDashboardAsync(accessToken, ct);
            }
            if (usageBody is null)
            {
                SetQuotaError(account, QuotaErrorRequestFailed("Cursor"));
                return;
            }

            var planName = CursorQuotaParser.ParsePlanName(planBody);
            var bars = CursorQuotaParser.ParsePeriodUsage(usageBody).ToList();
            if (bars.Count == 0)
                bars.AddRange(await FetchCursorUsageFallbacksAsync(accessToken, ct));

            ApplyCursorBars(account, planName, email, bars);
        }
        catch (OperationCanceledException) { throw; }
        catch
        {
            SetQuotaError(account, QuotaErrorRequestFailed("Cursor"));
        }
    }

    private static async Task<(string? planBody, string? usageBody)> FetchCursorDashboardAsync(
        string token, CancellationToken ct)
    {
        var planTask  = CallCursorApiAsync("GetPlanInfo", token, ct);
        var usageTask = CallCursorApiAsync("GetCurrentPeriodUsage", token, ct);
        return (await planTask, await usageTask);
    }

    private static async Task<IReadOnlyList<CursorQuotaBarSpec>> FetchCursorUsageFallbacksAsync(
        string token, CancellationToken ct)
    {
        var authUsage = await CallCursorGetAsync("https://api2.cursor.sh/auth/usage", token, ct);
        if (authUsage is not null)
        {
            var bars = CursorQuotaParser.ParseAuthUsage(authUsage);
            if (bars.Count > 0) return bars;
        }

        foreach (var url in new[]
                 {
                     "https://api2.cursor.sh/api/usage-summary",
                     "https://api2.cursor.sh/api/usage/summary",
                     "https://cursor.com/api/usage-summary",
                 })
        {
            var summary = await CallCursorGetAsync(url, token, ct);
            if (summary is null) continue;
            var bars = CursorQuotaParser.ParseUsageSummary(summary);
            if (bars.Count > 0) return bars;
        }

        return [];
    }

    private static void ApplyCursorBars(
        ProviderAccountViewModel account, string? planName, string? email, IReadOnlyList<CursorQuotaBarSpec> bars)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            if (!string.IsNullOrEmpty(planName))
                account.PlanBadge = planName;
            if (!string.IsNullOrEmpty(email))
            {
                account.Email = email;
                account.Label = email;
            }

            account.QuotaError = "";
            account.QuotaBars.Clear();
            foreach (var bar in bars)
            {
                account.QuotaBars.Add(new QuotaBarViewModel
                {
                    Title   = bar.Title,
                    Used    = bar.UsedFraction,
                    ResetIn = FormatResetAt(bar.ResetsAt),
                });
            }
            account.QuotaFetchedEmpty = bars.Count == 0;
        });
    }

    private static async Task<string?> CallCursorApiAsync(string method, string token, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://api2.cursor.sh/aiserver.v1.DashboardService/{method}");
        req.Headers.Add("Authorization", $"Bearer {token}");
        req.Headers.Add("Connect-Protocol-Version", "1");
        req.Content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json");
        using var resp = await Http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return null;
        return await resp.Content.ReadAsStringAsync(ct);
    }

    private static async Task<string?> CallCursorGetAsync(string url, string token, CancellationToken ct)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Add("Authorization", $"Bearer {token}");
            using var resp = await Http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode) return null;
            return await resp.Content.ReadAsStringAsync(ct);
        }
        catch (OperationCanceledException) { throw; }
        catch { return null; }
    }

    private static async Task<string?> RefreshCursorTokenAsync(string refreshToken, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api2.cursor.sh/oauth/token");
        req.Content = new StringContent(
            $"{{\"grant_type\":\"refresh_token\",\"client_id\":\"KbZUR41cY7W6zRSdpSUJ7I7mLYBKOCmB\",\"refresh_token\":\"{refreshToken}\"}}",
            System.Text.Encoding.UTF8, "application/json");
        using var resp = await Http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return null;
        var doc = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
        if (doc?["shouldLogout"]?.GetValue<bool>() == true) return null;
        return doc?["access_token"]?.GetValue<string>();
    }

    // ── Kiro (Amazon) ─────────────────────────────────────────────────────────

    private static async Task FetchKiroAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        try
        {
            var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var tokenPath = Path.Combine(userProfile, ".aws", "sso", "cache", "kiro-auth-token.json");
            if (!File.Exists(tokenPath))
            {
                SetQuotaError(account, QuotaErrorLocalAuthMissing("Kiro"));
                return;
            }

            var doc = JsonNode.Parse(File.ReadAllText(tokenPath))?.AsObject();
            if (doc is null)
            {
                SetQuotaError(account, QuotaErrorAuthDataUnreadable("Kiro"));
                return;
            }

            var refreshToken = doc["refreshToken"]?.GetValue<string>();
            var expiresAt    = doc["expiresAt"]?.GetValue<string>();
            var authMethod   = doc["authMethod"]?.GetValue<string>() ?? "";
            var profileArn   = doc["profileArn"]?.GetValue<string>();
            var region       = doc["region"]?.GetValue<string>() ?? "us-east-1";
            var clientIdHash = doc["clientIdHash"]?.GetValue<string>();
            var clientId     = doc["client_id"]?.GetValue<string>();
            var clientSecret = doc["client_secret"]?.GetValue<string>();
            var accessToken  = doc["accessToken"]?.GetValue<string>();

            if ((clientId is null || clientSecret is null) && clientIdHash is not null)
            {
                var hashPath = Path.Combine(userProfile, ".aws", "sso", "cache", $"{clientIdHash}.json");
                if (File.Exists(hashPath))
                {
                    try
                    {
                        var hd = JsonNode.Parse(File.ReadAllText(hashPath))?.AsObject();
                        clientId     ??= hd?["client_id"]?.GetValue<string>();
                        clientSecret ??= hd?["client_secret"]?.GetValue<string>();
                    }
                    catch { }
                }
            }

            // profileArn fallback: kiro.kiroagent/profile.json
            if (profileArn is null)
            {
                var profilePath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "Kiro", "User", "globalStorage", "kiro.kiroagent", "profile.json");
                if (File.Exists(profilePath))
                {
                    try
                    {
                        var pd = JsonNode.Parse(File.ReadAllText(profilePath))?.AsObject();
                        profileArn = pd?["arn"]?.GetValue<string>();
                    }
                    catch { }
                }
            }

            if (refreshToken is null)
            {
                SetQuotaError(account, QuotaErrorRefreshUnavailable("Kiro"));
                return;
            }

            // ── 1. Try local SQLite cache ────────────────────────────────────
            var (localBars, localPlanTitle, localOverage, localTimestamp) =
                ReadKiroLocalCache();

            // ── 2. Enrich plan/overage metadata from q-client.log ───────────
            var (logPlanTitle, logOverage) = ReadKiroLogMetadata();
            var planTitle  = logPlanTitle  ?? localPlanTitle;
            var overageStr = logOverage    ?? localOverage;

            // Staleness: if local data is < 10 minutes old, skip live fetch
            var localAgeMs = localTimestamp.HasValue
                ? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - localTimestamp.Value
                : long.MaxValue;
            var useLocal = localBars.Count > 0 && localAgeMs < 10 * 60 * 1000;

            List<(string title, double used, double total, string? resetAt)>? bars = null;

            if (!useLocal)
            {
                // ── 3. Live API fetch ────────────────────────────────────────
                var seed      = clientId ?? refreshToken;
                var machineId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(seed))).ToLowerInvariant();

                var isExpired = DateTimeOffset.TryParse(expiresAt, out var expiryDt)
                    && expiryDt - DateTimeOffset.UtcNow <= TimeSpan.FromMinutes(5);

                if (isExpired || accessToken is null)
                {
                    accessToken = await RefreshKiroTokenAsync(authMethod, region, clientId, clientSecret, refreshToken, ct);
                    if (accessToken is null)
                    {
                        // Live refresh failed — fall back to local snapshot if present
                        if (localBars.Count > 0) bars = localBars;
                        else return;
                    }
                }

                if (bars is null && accessToken is not null)
                {
                    var url = $"https://q.{region}.amazonaws.com/getUsageLimits?origin=AI_EDITOR&resourceType=AGENTIC_REQUEST";
                    if (!string.IsNullOrEmpty(profileArn))
                        url += $"&profileArn={Uri.EscapeDataString(profileArn)}";

                    using var req = new HttpRequestMessage(HttpMethod.Get, url);
                    req.Headers.Add("Authorization", $"Bearer {accessToken}");
                    req.Headers.Add("Host", $"q.{region}.amazonaws.com");
                    // User-Agent contains commas which are invalid per RFC 7230 strict parsing;
                    // TryAddWithoutValidation bypasses that check.
                    req.Headers.TryAddWithoutValidation("User-Agent", $"aws-sdk-js/1.0.0 ua/2.1 os/windows#10.0 lang/js md/nodejs#22.21.1 api/codewhispererruntime#1.0.0 m/N,E KiroIDE-0.10.32-{machineId}");
                    req.Headers.TryAddWithoutValidation("x-amz-user-agent", $"aws-sdk-js/1.0.0 KiroIDE-0.10.32-{machineId}");
                    req.Headers.Add("amz-sdk-invocation-id", Guid.NewGuid().ToString().ToLower());
                    req.Headers.Add("amz-sdk-request", "attempt=1; max=1");

                    if (string.Equals(authMethod, "external_idp", StringComparison.OrdinalIgnoreCase))
                        req.Headers.Add("TokenType", "EXTERNAL_IDP");
                    else if (string.Equals(authMethod, "internal", StringComparison.OrdinalIgnoreCase))
                        req.Headers.Add("redirect-for-internal", "true");

                    using var resp = await Http.SendAsync(req, ct);
                    if (resp.IsSuccessStatusCode)
                    {
                        var body = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                        if (body is not null)
                        {
                            planTitle  ??= body["subscriptionInfo"]?["subscriptionTitle"]?.GetValue<string>();
                            overageStr ??= body["overageConfiguration"]?["overageStatus"]?.GetValue<string>();
                            bars = ParseKiroBreakdownList(body["usageBreakdownList"]?.AsArray(), isLiveApi: true);
                            // email is null in the API response for social accounts; fall back to userId
                            var apiEmail  = body["userInfo"]?["email"]?.GetValue<string>();
                            var apiUserId = body["userInfo"]?["userId"]?.GetValue<string>();
                            var identifier = apiEmail ?? apiUserId;
                            if (!string.IsNullOrEmpty(identifier))
                                Avalonia.Threading.Dispatcher.UIThread.Post(() => account.Email = identifier);
                        }
                    }

                    // If live fetch failed, fall back to local snapshot
                    bars ??= localBars.Count > 0 ? localBars : null;
                }
            }
            else
            {
                bars = localBars;
            }

            if (bars is null || bars.Count == 0) return;

            var normalizedTitle = planTitle?.StartsWith("KIRO ", StringComparison.OrdinalIgnoreCase) == true
                ? planTitle[5..] : planTitle;
            var planBadge = normalizedTitle is not null ? ToPlanBadge(normalizedTitle) : "";
            // Only surface overage status when it's actionable (i.e. enabled)
            if (string.Equals(overageStr, "ENABLED", StringComparison.OrdinalIgnoreCase))
                planBadge = string.IsNullOrEmpty(planBadge)
                    ? "Overage: Enabled"
                    : $"{planBadge} · Overage: Enabled";

            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                if (!string.IsNullOrEmpty(planBadge)) account.PlanBadge = planBadge;
                account.QuotaBars.Clear();
                foreach (var (title, used, total, resetAt) in bars)
                {
                    account.QuotaBars.Add(new QuotaBarViewModel
                    {
                        Title   = title,
                        Used    = total > 0 ? Math.Clamp(used / total, 0, 1) : 0,
                        ResetIn = FormatResetAtIso(resetAt),
                    });
                }
            });
        }
        catch (OperationCanceledException) { throw; }
        catch { }
    }

    /// <summary>
    /// Reads the normalized usage cache from Kiro's SQLite state.vscdb.
    /// Returns (bars, planTitle, overageStatus, timestampMs).
    /// </summary>
    private static (
        List<(string title, double used, double total, string? resetAt)> bars,
        string? planTitle,
        string? overageStatus,
        long? timestampMs)
    ReadKiroLocalCache()
    {
        var empty = (new List<(string, double, double, string?)>(), (string?)null, (string?)null, (long?)null);
        try
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var dbPath  = Path.Combine(appData, "Kiro", "User", "globalStorage", "state.vscdb");
            if (!File.Exists(dbPath)) return empty;

            string? rawJson = null;
            using var conn = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={dbPath};Mode=ReadOnly");
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT value FROM ItemTable WHERE key = 'kiro.kiroAgent'";
            using var reader = cmd.ExecuteReader();
            if (reader.Read()) rawJson = reader.GetString(0);
            if (rawJson is null) return empty;

            var root      = JsonNode.Parse(rawJson)?.AsObject();
            var stateNode = root?["kiro.resourceNotifications.usageState"];
            // The value may be a nested JSON object or a double-serialized string
            JsonNode? usageState = stateNode is System.Text.Json.Nodes.JsonObject
                ? stateNode
                : JsonNode.Parse(stateNode?.GetValue<string>() ?? "");
            if (usageState is null) return empty;

            var timestamp  = usageState["timestamp"]?.GetValue<long>();
            var breakdowns = usageState["usageBreakdowns"]?.AsArray();
            if (breakdowns is null) return empty;

            var bars = ParseKiroBreakdownList(breakdowns, isLiveApi: false);
            return (bars, null, null, timestamp);
        }
        catch { return empty; }
    }

    /// <summary>
    /// Scans the latest Kiro q-client.log for a GetUsageLimitsCommand response
    /// and extracts subscriptionTitle + overageStatus.
    /// </summary>
    private static (string? planTitle, string? overageStatus) ReadKiroLogMetadata()
    {
        try
        {
            var appData  = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var logsRoot = Path.Combine(appData, "Kiro", "logs");
            if (!Directory.Exists(logsRoot)) return (null, null);

            // Find the most recently written q-client.log
            string? latestLog = null;
            DateTime latestWrite = DateTime.MinValue;
            foreach (var session in Directory.GetDirectories(logsRoot))
            foreach (var window in Directory.GetDirectories(session, "window*"))
            {
                var candidate = Path.Combine(window, "exthost", "kiro.kiroAgent", "q-client.log");
                if (!File.Exists(candidate)) continue;
                var w = File.GetLastWriteTimeUtc(candidate);
                if (w > latestWrite) { latestWrite = w; latestLog = candidate; }
            }
            if (latestLog is null) return (null, null);

            // Read last 256 KB to find the latest GetUsageLimitsCommand response
            const int ReadTail = 256 * 1024;
            string tail;
            using (var fs = new FileStream(latestLog, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                var offset = Math.Max(0, fs.Length - ReadTail);
                fs.Seek(offset, SeekOrigin.Begin);
                using var sr = new StreamReader(fs);
                tail = sr.ReadToEnd();
            }

            // Find last occurrence of GetUsageLimitsCommand response JSON block
            const string Marker = "GetUsageLimitsCommand";
            var lastIdx = tail.LastIndexOf(Marker, StringComparison.Ordinal);
            if (lastIdx < 0) return (null, null);

            var jsonStart = tail.IndexOf('{', lastIdx);
            if (jsonStart < 0) return (null, null);

            var segment = tail.AsSpan(jsonStart);
            // Find the matching closing brace
            int depth = 0, end = -1;
            for (var i = 0; i < segment.Length; i++)
            {
                if (segment[i] == '{') depth++;
                else if (segment[i] == '}') { depth--; if (depth == 0) { end = i + 1; break; } }
            }
            if (end < 0) return (null, null);

            var node = JsonNode.Parse(segment[..end].ToString());
            var planTitle  = node?["subscriptionInfo"]?["subscriptionTitle"]?.GetValue<string>();
            var overage    = node?["overageConfiguration"]?["overageStatus"]?.GetValue<string>();
            return (planTitle, overage);
        }
        catch { return (null, null); }
    }

    /// <summary>
    /// Parses a usageBreakdowns (local) or usageBreakdownList (live API) array
    /// into the common bar tuple format.
    /// </summary>
    private static List<(string title, double used, double total, string? resetAt)>
        ParseKiroBreakdownList(System.Text.Json.Nodes.JsonArray? items, bool isLiveApi)
    {
        var bars = new List<(string, double, double, string?)>();
        if (items is null) return bars;

        foreach (var item in items)
        {
            if (item is null) continue;

            var displayName  = item["displayName"]?.GetValue<string>() ?? "Usage";
            // Prefer *WithPrecision fields when available (live API returns truncated int + precise double)
            var currentUsage = item["currentUsageWithPrecision"]?.GetValue<double>()
                            ?? item["currentUsage"]?.GetValue<double>() ?? 0;
            var usageLimit   = item["usageLimitWithPrecision"]?.GetValue<double>()
                            ?? item["usageLimit"]?.GetValue<double>() ?? 0;

            // resetDate (local, ISO string) or nextDateReset (live, unix seconds as float)
            string? resetAt;
            if (isLiveApi)
            {
                // nextDateReset arrives as a JSON number (e.g. 1.782864E9), not a string
                var resetNum = item["nextDateReset"]?.GetValue<double>();
                resetAt = resetNum.HasValue
                    ? DateTimeOffset.FromUnixTimeSeconds((long)resetNum.Value).ToString("o")
                    : null;
            }
            else
            {
                resetAt = item["resetDate"]?.GetValue<string>();
            }

            // freeTrialUsage (local) or freeTrialInfo (live)
            var trialNode   = isLiveApi ? item["freeTrialInfo"] : item["freeTrialUsage"];
            var trialStatus = isLiveApi
                ? trialNode?["freeTrialStatus"]?.GetValue<string>() ?? ""
                : (trialNode is not null ? "ACTIVE" : "");  // local: presence implies active

            if (string.Equals(trialStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase)
                && trialNode is not null)
            {
                var trialCurrent = trialNode["currentUsage"]?.GetValue<double>() ?? 0;
                var trialLimit   = trialNode["usageLimit"]?.GetValue<double>() ?? 1;
                var trialExpiry  = isLiveApi
                    ? trialNode["freeTrialExpiry"]?.GetValue<string>()
                    : trialNode["expiryDate"]?.GetValue<string>();
                bars.Add(($"Bonus {displayName}", trialCurrent, trialLimit, trialExpiry));
            }

            if (usageLimit > 0)
            {
                var title = string.Equals(trialStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase)
                    ? $"{displayName} (Base)"
                    : displayName;
                bars.Add((title, currentUsage, usageLimit, resetAt));
            }
        }
        return bars;
    }

    private static async Task<string?> RefreshKiroTokenAsync(
        string authMethod, string region,
        string? clientId, string? clientSecret,
        string refreshToken, CancellationToken ct)
    {
        try
        {
            if (string.Equals(authMethod, "social", StringComparison.OrdinalIgnoreCase))
            {
                var url  = "https://prod.us-east-1.auth.desktop.kiro.dev/refreshToken";
                var body = $"{{\"refreshToken\":\"{refreshToken}\"}}"; 
                using var req  = new HttpRequestMessage(HttpMethod.Post, url);
                req.Content    = new StringContent(body, Encoding.UTF8, "application/json");
                using var resp = await Http.SendAsync(req, ct);
                if (!resp.IsSuccessStatusCode) return null;
                var json = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                return json?["accessToken"]?.GetValue<string>();
            }
            else
            {
                if (clientId is null || clientSecret is null) return null;
                var form = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("clientId",     clientId),
                    new KeyValuePair<string, string>("clientSecret", clientSecret),
                    new KeyValuePair<string, string>("grantType",    "refresh_token"),
                    new KeyValuePair<string, string>("refreshToken", refreshToken),
                });
                using var resp = await Http.PostAsync($"https://oidc.{region}.amazonaws.com/token", form, ct);
                if (!resp.IsSuccessStatusCode) return null;
                var json = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
                return json?["accessToken"]?.GetValue<string>();
            }
        }
        catch (OperationCanceledException) { throw; }
        catch { return null; }
    }

    // ── Trae (ByteDance) ──────────────────────────────────────────────────────

    private static async Task FetchTraeAsync(ProviderAccountViewModel account, CancellationToken ct)
    {
        try
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var path = Path.Combine(appData, "Trae", "User", "globalStorage", "storage.json");
            if (!File.Exists(path)) return;

            var doc = JsonNode.Parse(File.ReadAllText(path))?.AsObject();
            if (doc is null) return;

            string? token = null, email = null;
            var host = "https://api-sg-central.trae.ai";

            // storage.json is Electron safeStorage-encrypted on Windows; try plain JSON first.
            var authInfoRaw = doc["iCubeAuthInfo://icube.cloudide"]?.GetValue<string>();
            if (!string.IsNullOrEmpty(authInfoRaw))
            {
                try
                {
                    var authDoc = JsonNode.Parse(authInfoRaw)?.AsObject();
                    token = authDoc?["token"]?.GetValue<string>();
                    host  = authDoc?["host"]?.GetValue<string>() ?? host;
                    email = authDoc?["account"]?["email"]?.GetValue<string>();
                }
                catch { }
            }

            // Fallback: extract token + userName from the most recent completion.log
            if (token is null)
            {
                var (logToken, logUser) = await QuotaProviderService.ReadTraeTokenFromLogsAsync(appData);
                token = logToken;
                email ??= logUser;
            }

            if (!string.IsNullOrEmpty(email))
                Avalonia.Threading.Dispatcher.UIThread.Post(() => account.Email = email);

            // Match account by email if set
            if (!string.IsNullOrEmpty(account.Email) && !string.IsNullOrEmpty(email) &&
                !string.Equals(account.Email, email, StringComparison.OrdinalIgnoreCase))
                return;

            if (token is null)
            {
                SetQuotaError(account, QuotaErrorTokenUnavailable("Trae"));
                return;
            }

            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"{host.TrimEnd('/')}/trae/api/v1/pay/user_current_entitlement_list");
            req.Headers.Add("Authorization", $"Cloud-IDE-JWT {token}");
            req.Headers.Add("Accept", "application/json, text/plain, */*");
            req.Headers.Add("Origin", "https://www.trae.ai");
            req.Headers.Add("Referer", "https://www.trae.ai/");
            req.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            req.Content = new StringContent("{\"require_usage\":true}", Encoding.UTF8, "application/json");

            using var resp = await Http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                SetQuotaError(account, resp.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden
                    ? QuotaErrorAuthExpired("Trae")
                    : ToQuotaErrorMessage("Trae", resp.StatusCode));
                return;
            }

            var body = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
            if (body is null) return;

            var packs = body["user_entitlement_pack_list"]?.AsArray();
            if (packs is null) return;

            JsonNode? pack = null;
            foreach (var p in packs)
            {
                if (p?["status"]?.GetValue<int>() == 1) { pack = p; break; }
            }
            // Fallback to first entitlement if none is status=1
            pack ??= packs.Count > 0 ? packs[0] : null;
            if (pack is null) return;

            var baseInfo      = pack["entitlement_base_info"];
            var usage         = pack["usage"];
            var quota         = baseInfo?["quota"];
            var endTime       = baseInfo?["end_time"]?.GetValue<long>();
            var prodType      = baseInfo?["product_type"]?.GetValue<int>() ?? 0;
            var isDollarBased = body["is_dollar_usage_billing"]?.GetValue<bool>() ?? false;

            var plan = prodType switch
            {
                0 => "Free",
                1 => "Pro",
                2 => "Team",
                3 => "Builder",
                _ => "",
            };

            if (!string.IsNullOrEmpty(plan))
                Avalonia.Threading.Dispatcher.UIThread.Post(() => account.PlanBadge = plan);

            var bars = new List<(string title, double used, double total)>();

            if (isDollarBased)
            {
                var basicLimit = quota?["basic_usage_limit"]?.GetValue<double>() ?? 0;
                var basicUsed  = usage?["basic_usage_amount"]?.GetValue<double>() ?? 0;
                if (basicLimit > 0) bars.Add(($"Free plan (${basicUsed:0.00}/${basicLimit:0.00})", basicUsed, basicLimit));

                var autoLimit = quota?["auto_completion_limit"]?.GetValue<double>() ?? 0;
                var autoUsed  = usage?["auto_completion_amount"]?.GetValue<double>() ?? 0;
                if (autoLimit > 0) bars.Add(("Autocomplete", autoUsed, autoLimit));
            }
            else
            {
                var fastLimit = quota?["premium_model_fast_request_limit"]?.GetValue<double>() ?? 0;
                var slowLimit = quota?["premium_model_slow_request_limit"]?.GetValue<double>() ?? 0;
                var advLimit  = quota?["advanced_model_request_limit"]?.GetValue<double>() ?? 0;
                var autoLimit = quota?["auto_completion_limit"]?.GetValue<double>() ?? 0;

                var fastUsed = usage?["premium_model_fast_amount"]?.GetValue<double>() ?? 0;
                var slowUsed = usage?["premium_model_slow_amount"]?.GetValue<double>() ?? 0;
                var advUsed  = usage?["advanced_model_amount"]?.GetValue<double>() ?? 0;
                var autoUsed = usage?["auto_completion_amount"]?.GetValue<double>() ?? 0;

                if (fastLimit > 0) bars.Add(("Premium Fast",    fastUsed, fastLimit));
                if (slowLimit > 0) bars.Add(("Premium Slow",    slowUsed, slowLimit));
                if (advLimit  > 0) bars.Add(("Advanced Models", advUsed,  advLimit));
                if (autoLimit > 0) bars.Add(("Auto Completion", autoUsed, autoLimit));
            }

            Avalonia.Threading.Dispatcher.UIThread.Post(() =>
            {
                account.QuotaError = "";
                account.QuotaBars.Clear();
                foreach (var (title, used, total) in bars)
                {
                    account.QuotaBars.Add(new QuotaBarViewModel
                    {
                        Title   = title,
                        Used    = total > 0 ? Math.Clamp(used / total, 0, 1) : 0,
                        ResetIn = FormatResetAtUnix(endTime),
                    });
                }
            });
        }
        catch (OperationCanceledException) { throw; }
        catch { }
    }

    private static string QuotaErrorTokenUnavailable(string provider) => $"loc:Quota_Error_TokenUnavailable|{provider}";
    private static string QuotaErrorAuthExpired(string provider) => $"loc:Quota_Error_AuthExpired|{provider}";
    private static string QuotaErrorRequestFailed(string provider) => $"loc:Quota_Error_RequestFailed|{provider}";
    private static string QuotaErrorNoData(string provider) => $"loc:Quota_Error_NoData|{provider}";
    private static string QuotaErrorLocalAuthMissing(string provider) => $"loc:Quota_Error_LocalAuthMissing|{provider}";
    private static string QuotaErrorAuthDataUnreadable(string provider) => $"loc:Quota_Error_AuthDataUnreadable|{provider}";
    private static string QuotaErrorRefreshUnavailable(string provider) => $"loc:Quota_Error_RefreshUnavailable|{provider}";

    private static string ToQuotaErrorMessage(string provider, System.Net.HttpStatusCode status) => status switch
    {
        System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden =>
            $"loc:Quota_Error_AuthExpired|{provider}",
        (System.Net.HttpStatusCode)429 =>
            $"loc:Quota_Error_RateLimited|{provider}",
        >= System.Net.HttpStatusCode.InternalServerError =>
            $"loc:Quota_Error_ApiUnavailable|{provider}|{(int)status}",
        _ => $"loc:Quota_Error_RequestFailedWithStatus|{provider}|{(int)status}",
    };

    private static void SetQuotaError(ProviderAccountViewModel account, string message)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            account.QuotaBars.Clear();
            account.QuotaNotice = "";
            account.QuotaFetchedEmpty = false;
            account.QuotaError = message;
        });
    }

    // ── Google OAuth2 token refresh ──────────────────────────────────────────

    private static async Task<string?> RefreshGoogleTokenAsync(
        string tokenUri, string clientId, string clientSecret, string refreshToken, CancellationToken ct)
    {
        try
        {
            var form = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("client_id",     clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("refresh_token", refreshToken),
                new KeyValuePair<string, string>("grant_type",    "refresh_token"),
            });
            using var resp = await Http.PostAsync(tokenUri, form, ct);
            if (!resp.IsSuccessStatusCode) return null;
            var body = JsonNode.Parse(await resp.Content.ReadAsStringAsync(ct));
            return body?["access_token"]?.GetValue<string>();
        }
        catch (OperationCanceledException) { throw; }
        catch { return null; }
    }

    // ── Apply helpers ─────────────────────────────────────────────────────────

    /// <summary>Claude: utilization is 0-100, resets_at is ISO 8601 string.</summary>
    private static void ApplyBarsFromUtilization(
        ProviderAccountViewModel account,
        List<(string title, double utilization, string? resetsAt)> bars)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            account.QuotaBars.Clear();
            foreach (var (title, utilization, resetsAt) in bars)
            {
                account.QuotaBars.Add(new QuotaBarViewModel
                {
                    Title   = title,
                    Used    = Math.Clamp(utilization / 100.0, 0, 1),
                    // A null/empty reset means the window hasn't started counting yet:
                    // the countdown only begins once the current session consumes quota.
                    ResetIn = string.IsNullOrEmpty(resetsAt)
                        ? "loc:Quota_ResetPendingSession"
                        : FormatResetAtIso(resetsAt),
                });
            }
        });
    }

    /// <summary>Codex: used_percent is 0-100, reset_at is unix timestamp.</summary>
    private static void ApplyBarsFromPercent(
        ProviderAccountViewModel account,
        List<(string title, double usedPct, long? resetAt)> bars)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            account.QuotaBars.Clear();
            foreach (var (title, usedPct, resetAt) in bars)
            {
                account.QuotaBars.Add(new QuotaBarViewModel
                {
                    Title   = title,
                    Used    = Math.Clamp(usedPct / 100.0, 0, 1),
                    ResetIn = FormatResetAtUnix(resetAt),
                });
            }
        });
    }

    /// <summary>Used = total - remaining, total = max.</summary>
    private static void ApplyBarsFromUsedTotal(
        ProviderAccountViewModel account,
        List<(string title, double used, double total)> bars)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            account.QuotaBars.Clear();
            foreach (var (title, used, total) in bars)
            {
                var fraction = total > 0 ? used / total : 0;
                account.QuotaBars.Add(new QuotaBarViewModel
                {
                    Title   = title,
                    Used    = Math.Clamp(fraction, 0, 1),
                    ResetIn = "",
                });
            }
        });
    }

    /// <summary>Gemini/Antigravity: used = 1.0 - remainingFraction; resetTime is ISO 8601.</summary>
    private static void ApplyBarsFromFraction(
        ProviderAccountViewModel account,
        List<(string title, double used, string? resetTime)> bars)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            account.QuotaBars.Clear();
            foreach (var (title, used, resetTime) in bars)
            {
                account.QuotaBars.Add(new QuotaBarViewModel
                {
                    Title   = title,
                    Used    = Math.Clamp(used, 0, 1),
                    ResetIn = FormatResetAtIso(resetTime),
                });
            }
        });
    }

    private static string? EarliestIso(string? a, string? b)
    {
        if (a is null) return b;
        if (b is null) return a;
        return DateTimeOffset.TryParse(a, out var dtA) && DateTimeOffset.TryParse(b, out var dtB) && dtB < dtA ? b : a;
    }

    // ── Token reader ─────────────────────────────────────────────────────────

    private string? ReadAccessToken(string prefix, string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        if (!Directory.Exists(_authDir)) return null;
        foreach (var file in Directory.GetFiles(_authDir, $"{prefix}-{email}*.json"))
        {
            try
            {
                var doc = JsonNode.Parse(File.ReadAllText(file))?.AsObject();
                if (doc is null) continue;
                return doc["access_token"]?.GetValue<string>()
                    ?? doc["accessToken"]?.GetValue<string>();
            }
            catch { }
        }
        return null;
    }

    // ── Format helpers ────────────────────────────────────────────────────────

    /// <summary>Normalises an API plan string to title-case badge text (e.g. "pro" → "Pro", "KIRO FREE" → "Kiro Free").</summary>
    private static string ToPlanBadge(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw;
        return string.Join(" ", raw.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant()));
    }

    private static string FormatResetAt(DateTimeOffset? at)
    {
        if (at is null) return "";
        return FormatDiff(at.Value - DateTimeOffset.UtcNow);
    }

    private static string FormatResetAtUnix(long? unixSeconds)
    {
        if (unixSeconds is null) return "";
        var diff = DateTimeOffset.FromUnixTimeSeconds(unixSeconds.Value) - DateTimeOffset.UtcNow;
        return FormatDiff(diff);
    }

    private static string FormatResetAtIso(string? iso)
    {
        if (string.IsNullOrEmpty(iso)) return "";
        if (!DateTimeOffset.TryParse(iso, out var dt)) return "";
        return FormatDiff(dt - DateTimeOffset.UtcNow);
    }

    /// <summary>Saved resets *expire* rather than reset — same countdown math as FormatResetAtIso, different copy.</summary>
    private static string FormatExpiresAtIso(string? iso)
    {
        if (string.IsNullOrEmpty(iso)) return "";
        if (!DateTimeOffset.TryParse(iso, out var dt)) return "";
        var diff = dt - DateTimeOffset.UtcNow;
        if (diff <= TimeSpan.Zero)
            return "loc:Quota_ExpiresInNow";
        if (diff.TotalDays >= 1)
            return $"loc:Quota_ExpiresInDaysHours|{(int)diff.TotalDays}|{diff.Hours}";
        if (diff.TotalHours >= 1)
            return $"loc:Quota_ExpiresInHoursMinutes|{(int)diff.TotalHours}|{diff.Minutes}";
        return $"loc:Quota_ExpiresInMinutes|{diff.Minutes}";
    }

    private static string FormatDiff(TimeSpan diff)
    {
        if (diff <= TimeSpan.Zero)
            return "loc:Quota_ResetInNow";
        if (diff.TotalDays >= 1)
            return $"loc:Quota_ResetInDaysHours|{(int)diff.TotalDays}|{diff.Hours}";
        if (diff.TotalHours >= 1)
            return $"loc:Quota_ResetInHoursMinutes|{(int)diff.TotalHours}|{diff.Minutes}";
        return $"loc:Quota_ResetInMinutes|{diff.Minutes}";
    }

}
