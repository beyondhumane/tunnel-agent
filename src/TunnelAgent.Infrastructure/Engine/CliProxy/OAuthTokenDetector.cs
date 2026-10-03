using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace TunnelAgent.Infrastructure.Engine.CliProxy;

/// <summary>
/// One authenticated OAuth session found in the auth-dir.
/// Filename format: {type}-[{id}-]{email}[-{plan}].json
/// e.g. codex-me@gmail.com-plus.json or codex-8017738c-me@gmail.com-plus.json
/// → type=codex, email=me@gmail.com, plan=PLUS
/// </summary>
public sealed class OAuthAccount
{
    public string ProviderId { get; init; } = "";
    public string Email      { get; init; } = "";
    /// <summary>Uppercase plan badge, e.g. "PLUS", "PRO", "FREE". Empty = no badge.</summary>
    public string Plan       { get; init; } = "";
    public bool   IsDisabled { get; init; }
}

/// <summary>
/// Detects which OAuth providers have active token files in the auth-dir
/// and parses the account details (email, plan) from each file.
/// </summary>
public sealed class OAuthTokenDetector
{
    // Maps provider-id → filename prefix used by CLIProxyAPI
    public static readonly IReadOnlyDictionary<string, string> KnownProviders =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["claude"]          = "claude",
            ["codex"]           = "codex",
            ["kimi"]            = "kimi",
            ["antigravity"]     = "antigravity",
            ["xai"]             = "xai",
            ["devin"]           = "devin",
            ["meta"]            = "meta",
        };

    private readonly string _directory;

    public OAuthTokenDetector(string directory) => _directory = directory;

    /// <summary>Returns all active OAuth accounts grouped by provider ID.</summary>
    public Dictionary<string, List<OAuthAccount>> GetAccounts()
    {
        var result = new Dictionary<string, List<OAuthAccount>>(StringComparer.OrdinalIgnoreCase);
        if (!Directory.Exists(_directory)) return result;

        foreach (var (providerId, prefix) in KnownProviders)
        {
            var files = Directory.GetFiles(_directory, $"{prefix}-*.json")
                .Where(f => !Path.GetFileName(f).StartsWith("openai-compat-", StringComparison.OrdinalIgnoreCase));

            foreach (var file in files)
            {
                var account = ParseAccount(file, providerId, prefix);
                if (account is null) continue;

                if (!result.TryGetValue(providerId, out var list))
                    result[providerId] = list = new List<OAuthAccount>();
                list.Add(account);
            }
        }

        return result;
    }

    /// <summary>Patches the disabled field on the token file matching the given email.</summary>
    public void SetDisabled(string providerId, string email, bool disabled)
    {
        if (!KnownProviders.TryGetValue(providerId, out var prefix)) return;

        foreach (var file in GetTokenFiles(_directory, prefix, email))
        {
            try
            {
                var text = File.ReadAllText(file);
                var doc  = System.Text.Json.Nodes.JsonNode.Parse(text)?.AsObject();
                if (doc is null) continue;
                doc["disabled"] = disabled;
                File.WriteAllText(file, doc.ToJsonString(
                    new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
            }
            catch { }
        }
    }

    /// <summary>
    /// Returns the most recent write time (UTC) among the provider's token files,
    /// or null when none exist. Used to detect a fresh login even when re-authenticating
    /// an already-present account (the account count stays the same but the file is rewritten).
    /// </summary>
    public DateTime? GetLatestTokenWriteUtc(string providerId)
    {
        if (!KnownProviders.TryGetValue(providerId, out var prefix)) return null;
        if (!Directory.Exists(_directory)) return null;

        DateTime? latest = null;
        foreach (var file in Directory.GetFiles(_directory, $"{prefix}-*.json"))
        {
            if (Path.GetFileName(file).StartsWith("openai-compat-", StringComparison.OrdinalIgnoreCase))
                continue;
            var t = File.GetLastWriteTimeUtc(file);
            if (latest is null || t > latest) latest = t;
        }
        return latest;
    }

    /// <summary>Returns IDs of providers that have at least one active account.</summary>
    public HashSet<string> GetConnectedProviderIds()
    {
        var accounts = GetAccounts();
        return new HashSet<string>(
            accounts.Where(kv => kv.Value.Any(a => !a.IsDisabled)).Select(kv => kv.Key),
            StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Token files for a prefix, optionally filtered to one account. An account matches by
    /// filename (<c>{prefix}-[{id}-]{email}*</c>) or by the JSON <c>email</c> field, since some
    /// providers (e.g. Meta) sanitize the email in the filename.
    /// </summary>
    public static IEnumerable<string> GetTokenFiles(string directory, string prefix, string? email = null)
    {
        if (!Directory.Exists(directory)) yield break;

        foreach (var file in Directory.GetFiles(directory, $"{prefix}-*.json"))
        {
            var name = Path.GetFileName(file);
            if (name.StartsWith("openai-compat-", StringComparison.OrdinalIgnoreCase)) continue;
            if (email is null
                || AccountPart(name, prefix).StartsWith(email, StringComparison.OrdinalIgnoreCase)
                || string.Equals(ReadEmail(file), email, StringComparison.OrdinalIgnoreCase))
                yield return file;
        }
    }

    // ── private ──────────────────────────────────────────────────────────────

    private static string? ReadEmail(string file)
    {
        try { return JsonNode.Parse(File.ReadAllText(file))?["email"]?.GetValue<string>(); }
        catch { return null; }
    }

    private static OAuthAccount? ParseAccount(string filePath, string providerId, string prefix)
    {
        try
        {
            var text = File.ReadAllText(filePath);
            var doc  = JsonNode.Parse(text)?.AsObject();
            if (doc is null) return null;

            var disabled = doc["disabled"]?.GetValue<bool>() ?? false;

            // Require at least one auth-related field
            var hasAuth = doc["access_token"] != null
                       || doc["token"]        != null
                       || doc["api_key"]      != null
                       || doc["oauth_token"]  != null
                       || doc["credentials"]  != null
                       || doc.Count > 2;
            if (!hasAuth) return null;

            var email = doc["email"]?.GetValue<string>() ?? "";
            if (string.IsNullOrEmpty(email))
                email = EmailFromFilename(filePath, prefix);

            // Plan: prefer JSON field, fall back to filename suffix
            var plan = ToPlanBadge(doc["plan"]?.GetValue<string>() ?? "");
            if (string.IsNullOrEmpty(plan))
                plan = PlanFromFilename(filePath, prefix, email);

            return new OAuthAccount
            {
                ProviderId = providerId,
                Email      = email,
                Plan       = plan,
                IsDisabled = disabled,
            };
        }
        catch { return null; }
    }

    /// <summary>
    /// Filename without the provider prefix and CLIProxyAPI's optional 8-hex-digit id,
    /// e.g. "codex-8017738c-me@gmail.com-plus.json" → "me@gmail.com-plus".
    /// </summary>
    private static string AccountPart(string fileName, string prefix)
    {
        var name = Path.GetFileNameWithoutExtension(fileName);
        if (name.Length <= prefix.Length + 1) return "";
        var rest = name[(prefix.Length + 1)..];
        return FileIdPrefix.IsMatch(rest) ? rest[9..] : rest;
    }

    private static readonly Regex FileIdPrefix = new("^[0-9a-fA-F]{8}-(?=[^@]*@)", RegexOptions.Compiled);

    /// <summary>
    /// Extracts email from filename: {prefix}-[{id}-]{email}[-{plan}].json
    /// e.g. "codex-me@gmail.com-plus.json" → "me@gmail.com"
    /// </summary>
    private static string EmailFromFilename(string filePath, string prefix)
    {
        var afterPrefix = AccountPart(filePath, prefix); // e.g. "me@gmail.com-plus"

        if (string.IsNullOrEmpty(afterPrefix)) return "";

        // If it contains '@' it's an email; strip any trailing "-plan" suffix
        if (afterPrefix.Contains('@'))
        {
            // Find last '-' that comes after '@' — that would be the plan suffix
            var atIdx   = afterPrefix.IndexOf('@');
            var dashIdx = afterPrefix.LastIndexOf('-');
            if (dashIdx > atIdx)
            {
                var candidate = afterPrefix[(dashIdx + 1)..];
                // Known plan tokens
                if (IsKnownPlan(candidate))
                    return afterPrefix[..dashIdx];
            }
            return afterPrefix;
        }

        return afterPrefix;
    }

    /// <summary>
    /// Extracts plan badge from filename suffix after the email.
    /// e.g. "codex-me@gmail.com-plus.json" → "PLUS"
    /// </summary>
    private static string PlanFromFilename(string filePath, string prefix, string email)
    {
        if (string.IsNullOrEmpty(email)) return "";

        var name = AccountPart(filePath, prefix);
        // Everything after "{email}-"
        var key  = $"{email}-";
        if (!name.StartsWith(key, StringComparison.OrdinalIgnoreCase)) return "";

        var suffix = name[key.Length..];
        return IsKnownPlan(suffix) ? ToPlanBadge(suffix) : "";
    }

    private static string ToPlanBadge(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw;
        return string.Join(" ", raw.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant()));
    }

    private static bool IsKnownPlan(string s) =>
        s.Equals("plus",  StringComparison.OrdinalIgnoreCase) ||
        s.Equals("pro",   StringComparison.OrdinalIgnoreCase) ||
        s.Equals("prolite", StringComparison.OrdinalIgnoreCase) ||
        s.Equals("free",  StringComparison.OrdinalIgnoreCase) ||
        s.Equals("team",  StringComparison.OrdinalIgnoreCase) ||
        s.Equals("enterprise", StringComparison.OrdinalIgnoreCase);
}
