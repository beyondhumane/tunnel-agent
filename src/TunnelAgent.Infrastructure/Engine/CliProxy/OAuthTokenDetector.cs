using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace TunnelAgent.Infrastructure.Engine.CliProxy;

/// <summary>
/// One authenticated OAuth session found in the auth-dir.
/// Filename format: {type}-[{id}-]{email}[-{plan}].json (the JSON email wins when present)
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
    /// <summary>Token file name in the auth-dir. Identifies the account: one email can have several
    /// files, e.g. one per Claude organization or Codex workspace.</summary>
    public string TokenFile  { get; init; } = "";
    /// <summary>Organization name, or else CLIProxyAPI's file id, to tell apart files sharing an email.</summary>
    public string Discriminator { get; init; } = "";
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

    /// <summary>
    /// Patches the disabled field on <paramref name="tokenFile"/>, or on every token file matching
    /// <paramref name="email"/> when no file is given.
    /// </summary>
    public void SetDisabled(string providerId, string email, bool disabled, string? tokenFile = null)
    {
        if (!KnownProviders.TryGetValue(providerId, out var prefix)) return;

        foreach (var file in GetTokenFiles(_directory, prefix, email, tokenFile))
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
    /// Write time (UTC) of each of the provider's token files, keyed by file name. Comparing a
    /// snapshot taken before a login with one taken after it (<see cref="HasNewToken"/>) tells
    /// whether the login wrote a token, including a re-login that rewrites an existing file.
    /// </summary>
    public IReadOnlyDictionary<string, DateTime> GetTokenWriteTimes(string providerId)
    {
        var result = new Dictionary<string, DateTime>(StringComparer.OrdinalIgnoreCase);
        if (!KnownProviders.TryGetValue(providerId, out var prefix)) return result;

        foreach (var file in GetTokenFiles(_directory, prefix))
        {
            try { result[Path.GetFileName(file)] = File.GetLastWriteTimeUtc(file); }
            catch { /* removed meanwhile */ }
        }
        return result;
    }

    /// <summary>True when <paramref name="after"/> has a token file that is missing from, or newer than, <paramref name="before"/>.</summary>
    public static bool HasNewToken(IReadOnlyDictionary<string, DateTime> before, IReadOnlyDictionary<string, DateTime> after) =>
        after.Any(kv => !before.TryGetValue(kv.Key, out var t) || kv.Value > t);

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
    /// the JSON <c>email</c> field when present, since some providers (e.g. Meta) sanitize
    /// the email in the filename; otherwise by the legacy filename <c>{prefix}-{email}[-{plan}]</c>.
    /// </summary>
    public static IEnumerable<string> GetTokenFiles(string directory, string prefix, string? email = null)
    {
        if (!Directory.Exists(directory)) yield break;

        foreach (var file in Directory.GetFiles(directory, $"{prefix}-*.json"))
        {
            var name = Path.GetFileName(file);
            if (name.StartsWith("openai-compat-", StringComparison.OrdinalIgnoreCase)) continue;
            if (email is null)
            {
                yield return file;
                continue;
            }
            var jsonEmail = ReadEmail(file);
            var matches = string.IsNullOrEmpty(jsonEmail)
                ? IsEmailWithOptionalPlan(LegacyAccountPart(name, prefix), email)
                : string.Equals(jsonEmail, email, StringComparison.OrdinalIgnoreCase);
            if (matches) yield return file;
        }
    }

    /// <summary>
    /// The single token file <paramref name="tokenFile"/> (nothing if it no longer exists), or every
    /// file of <paramref name="email"/> when no file is given. Callers acting on one account pass the
    /// file, so an account sharing its email with another never touches the other's file.
    /// </summary>
    public static IEnumerable<string> GetTokenFiles(string directory, string prefix, string? email, string? tokenFile)
    {
        if (string.IsNullOrEmpty(tokenFile)) return GetTokenFiles(directory, prefix, email);

        var name = Path.GetFileName(tokenFile);
        var path = Path.Combine(directory, name);
        return name.StartsWith($"{prefix}-", StringComparison.OrdinalIgnoreCase) && File.Exists(path)
            ? [path]
            : [];
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

            var organization = doc["organization_name"]?.GetValue<string>();

            return new OAuthAccount
            {
                ProviderId = providerId,
                Email      = email,
                Plan       = plan,
                IsDisabled = disabled,
                TokenFile  = Path.GetFileName(filePath),
                Discriminator = string.IsNullOrWhiteSpace(organization) ? FileId(filePath, prefix, email) : organization,
            };
        }
        catch { return null; }
    }

    /// <summary>Filename without the provider prefix, e.g. "codex-me@gmail.com-plus.json" → "me@gmail.com-plus".</summary>
    private static string LegacyAccountPart(string fileName, string prefix)
    {
        var name = Path.GetFileNameWithoutExtension(fileName);
        return name.Length > prefix.Length + 1 ? name[(prefix.Length + 1)..] : "";
    }

    /// <summary>
    /// What follows <paramref name="email"/> in a <c>{prefix}-[{id}-]{email}[-{plan}]</c> filename,
    /// where {id} is CLIProxyAPI's 8-hex-digit identity hash; null when the email isn't there.
    /// </summary>
    private static string? AfterEmail(string fileName, string prefix, string email)
    {
        var rest = LegacyAccountPart(fileName, prefix);
        if (rest.StartsWith(email, StringComparison.OrdinalIgnoreCase)) return rest[email.Length..];
        if (FileIdPrefix.IsMatch(rest) && rest[9..].StartsWith(email, StringComparison.OrdinalIgnoreCase))
            return rest[(9 + email.Length)..];
        return null;
    }

    /// <summary>CLIProxyAPI's id in "{prefix}-{id}-{email}…", e.g. "f9c692a7"; empty for legacy names.</summary>
    private static string FileId(string fileName, string prefix, string email)
    {
        if (string.IsNullOrEmpty(email)) return "";
        var rest = LegacyAccountPart(fileName, prefix);
        return FileIdPrefix.IsMatch(rest) && rest[9..].StartsWith(email, StringComparison.OrdinalIgnoreCase)
            ? rest[..8]
            : "";
    }

    private static readonly Regex FileIdPrefix = new("^[0-9a-fA-F]{8}-", RegexOptions.Compiled);

    /// <summary>
    /// True for "{email}" or "{email}-{plan}". Plans never contain dots, so "a@x.com" does not
    /// match "a@x.com.au" or "a@x.com-foo.org".
    /// </summary>
    private static bool IsEmailWithOptionalPlan(string accountPart, string email)
    {
        if (!accountPart.StartsWith(email, StringComparison.OrdinalIgnoreCase)) return false;
        var suffix = accountPart[email.Length..];
        return suffix.Length == 0 || (suffix.Length > 1 && suffix[0] == '-' && !suffix.Contains('.'));
    }

    /// <summary>
    /// Extracts email from a legacy filename: {prefix}-{email}[-{plan}].json
    /// e.g. "codex-me@gmail.com-plus.json" → "me@gmail.com". Only used when the JSON has no
    /// <c>email</c>, which CLIProxyAPI always writes for id-prefixed filenames.
    /// </summary>
    private static string EmailFromFilename(string filePath, string prefix)
    {
        var afterPrefix = LegacyAccountPart(filePath, prefix); // e.g. "me@gmail.com-plus"

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
    /// e.g. "codex-me@gmail.com-plus.json" or "codex-8017738c-me@gmail.com-plus.json" → "PLUS"
    /// </summary>
    private static string PlanFromFilename(string filePath, string prefix, string email)
    {
        if (string.IsNullOrEmpty(email)) return "";

        // Everything after "{email}-"
        var rest = AfterEmail(filePath, prefix, email);
        if (rest is null || !rest.StartsWith('-')) return "";

        var suffix = rest[1..];
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
