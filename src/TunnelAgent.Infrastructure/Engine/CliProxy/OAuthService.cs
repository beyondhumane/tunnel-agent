using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace TunnelAgent.Infrastructure.Engine.CliProxy;

/// <summary>Outcome of an OAuth connect attempt. The UI layer maps each status to a localized message.</summary>
public enum OAuthConnectStatus
{
    /// <summary>Browser flow started; AuthFileWatcher will detect completion.</summary>
    BrowserOpened,
    /// <summary>Browser flow started and a sign-in URL was captured as a manual fallback (<c>Detail</c> = URL).</summary>
    BrowserOpenedWithUrl,
    /// <summary>Provider does not support OAuth login (<c>Detail</c> = provider id).</summary>
    NotSupported,
    /// <summary>CLIProxyAPI binary is not installed yet.</summary>
    BinaryMissing,
    /// <summary>The login process could not be started (<c>Detail</c> = error message).</summary>
    StartFailed,
    /// <summary>The login process exited with a non-zero code (<c>Detail</c> = captured output).</summary>
    Failed,
    /// <summary>The login process exited with a non-zero code and produced no output.</summary>
    FailedUnexpected,
}

/// <summary>Structured result of <see cref="OAuthService.ConnectAsync"/>. <c>Detail</c> carries dynamic, non-localizable data.</summary>
public readonly record struct OAuthConnectResult(bool Success, OAuthConnectStatus Status, string Detail = "")
{
    /// <summary>Completes when the login process exits; null when no login process was started.</summary>
    public Task<OAuthLoginExit>? Completion { get; init; }

    /// <summary>Completes with the first sign-in URL the binary prints, or "" if it exits without one.</summary>
    public Task<string>? AuthUrl { get; init; }
}

/// <summary>
/// How a login process ended. CLIProxyAPI exits 0 on most login failures, so success has to be
/// judged by whether a token file was written, not by <see cref="ExitCode"/>.
/// </summary>
/// <param name="Cancelled">The process was killed by <see cref="OAuthService.CancelPreviousAuth"/>.</param>
public readonly record struct OAuthLoginExit(bool Cancelled, int ExitCode, string Output);

/// <summary>
/// Launches the CLIProxyAPI binary in OAuth login mode for a given provider.
/// The binary opens the browser, completes the OAuth flow, and writes a token file
/// to the auth-dir. The AuthFileWatcher detects the new file and updates Connected state.
/// </summary>
public sealed class OAuthService : IDisposable
{
    /// <summary>Maps provider ID → CLI login flag (without leading dash).</summary>
    private static readonly IReadOnlyDictionary<string, string> LoginFlags =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["claude"]          = "claude-login",
            ["codex"]           = "codex-login",
            ["kimi"]            = "kimi-login",
            ["antigravity"]     = "antigravity-login",
            ["xai"]             = "xai-login",
            ["devin"]           = "devin-login",
            ["meta"]            = "meta-login",
        };

    public static bool IsOAuthProvider(string providerId) =>
        LoginFlags.ContainsKey(providerId);

    private sealed class LoginRun(Process process)
    {
        public Process Process { get; } = process;
        public volatile bool Cancelled;
    }

    private readonly ConfigService _config;
    private readonly string? _binaryPath;
    // One login per provider: each provider's callback server listens on its own port.
    private readonly Dictionary<string, LoginRun> _runs = new(StringComparer.OrdinalIgnoreCase);
    private readonly Lock _lock = new();

    private static readonly TimeSpan OutputDrainTimeout = TimeSpan.FromSeconds(2);

    public OAuthService(ConfigService config) : this(config, null) { }

    internal OAuthService(ConfigService config, string? binaryPath)
    {
        _config = config;
        _binaryPath = binaryPath;
    }

    /// <summary>
    /// Starts the OAuth flow for the given provider.
    /// Returns immediately after the browser is expected to open.
    /// The AuthFileWatcher handles the completion detection.
    /// </summary>
    /// <returns>A user-facing status message.</returns>
    public async Task<OAuthConnectResult> ConnectAsync(string providerId)
    {
        if (!LoginFlags.TryGetValue(providerId, out var flag))
            return new OAuthConnectResult(false, OAuthConnectStatus.NotSupported, providerId);

        var binaryPath = _binaryPath ?? DownloadService.BinaryPath;
        if (!File.Exists(binaryPath))
            return new OAuthConnectResult(false, OAuthConnectStatus.BinaryMissing);

        CancelPreviousAuth(providerId);

        var configPath = _config.ConfigPath;
        if (!File.Exists(configPath))
            await _config.WriteConfigAsync();

        var psi = new ProcessStartInfo(binaryPath)
        {
            UseShellExecute        = false,
            CreateNoWindow         = true,
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            RedirectStandardInput  = true,
        };
        psi.ArgumentList.Add("--config");
        psi.ArgumentList.Add(configPath);
        psi.ArgumentList.Add($"-{flag}");

        var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        var run = new LoginRun(process);

        var output = new StringBuilder();
        var urlTcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        void OnLine(string? line)
        {
            if (line is null) return;
            lock (output) output.AppendLine(line);
            var url = ExtractAuthUrl(line);
            if (url.Length > 0) urlTcs.TrySetResult(url);
        }
        string CapturedOutput() { lock (output) return output.ToString().Trim(); }
        process.OutputDataReceived += (_, e) => OnLine(e.Data);
        process.ErrorDataReceived  += (_, e) => OnLine(e.Data);

        // Capture the exit code from inside the handler so callers never touch a
        // disposed Process, and always dispose once it exits (a successful login
        // keeps the process alive until the user completes the flow).
        var exitTcs = new TaskCompletionSource<OAuthLoginExit>(TaskCreationOptions.RunContinuationsAsynchronously);
        process.Exited += (_, _) => _ = Task.Run(async () =>
        {
            var code = -1;
            try { code = process.ExitCode; } catch { /* already gone */ }

            // Exited can fire before the async readers have delivered the last lines.
            var drained = Task.Run(() => { try { process.WaitForExit(); } catch { /* disposed */ } });
            await Task.WhenAny(drained, Task.Delay(OutputDrainTimeout));

            urlTcs.TrySetResult("");
            exitTcs.TrySetResult(new OAuthLoginExit(run.Cancelled, code, CapturedOutput()));

            lock (_lock)
            {
                if (_runs.TryGetValue(providerId, out var current) && current == run)
                    _runs.Remove(providerId);
            }
            try { process.Dispose(); } catch { /* idempotent */ }
        });

        lock (_lock) { _runs[providerId] = run; }

        try
        {
            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
        }
        catch (Exception ex)
        {
            lock (_lock)
            {
                if (_runs.TryGetValue(providerId, out var current) && current == run)
                    _runs.Remove(providerId);
            }
            process.Dispose();
            return new OAuthConnectResult(false, OAuthConnectStatus.StartFailed, ex.Message);
        }

        // Give the process ~1s: a live process means the browser flow started.
        // A quick non-zero exit is reported right away; everything else is judged by
        // the caller once Completion finishes, never by parsing stdout (which changes
        // between binary releases).
        var finished = await Task.WhenAny(exitTcs.Task, Task.Delay(1000));

        if (finished != exitTcs.Task)
        {
            // Still running: surface the sign-in URL as a fallback for headless
            // environments where the binary could not open a browser.
            var url = urlTcs.Task.IsCompletedSuccessfully ? urlTcs.Task.Result : "";
            var status = string.IsNullOrEmpty(url)
                ? OAuthConnectStatus.BrowserOpened
                : OAuthConnectStatus.BrowserOpenedWithUrl;
            return new OAuthConnectResult(true, status, url) { Completion = exitTcs.Task, AuthUrl = urlTcs.Task };
        }

        var exit = await exitTcs.Task;
        if (exit.ExitCode == 0)
            return new OAuthConnectResult(true, OAuthConnectStatus.BrowserOpened) { Completion = exitTcs.Task, AuthUrl = urlTcs.Task };

        return string.IsNullOrWhiteSpace(exit.Output)
            ? new OAuthConnectResult(false, OAuthConnectStatus.FailedUnexpected)
            : new OAuthConnectResult(false, OAuthConnectStatus.Failed, exit.Output);
    }

    /// <summary>
    /// Kills the active login process of <paramref name="providerId"/>, or of every provider when null
    /// (e.g. when the user disconnects, starts a new login, or resets all credentials).
    /// </summary>
    public void CancelPreviousAuth(string? providerId = null)
    {
        List<LoginRun> runs;
        lock (_lock)
        {
            if (providerId is null)
            {
                runs = [.. _runs.Values];
                _runs.Clear();
            }
            else
            {
                runs = _runs.Remove(providerId, out var run) ? [run] : [];
            }
        }

        foreach (var run in runs)
        {
            run.Cancelled = true;
            try
            {
                if (!run.Process.HasExited)
                    run.Process.Kill(entireProcessTree: true);
            }
            catch { /* best-effort; the Exited handler disposes */ }
        }
    }

    public void Dispose() => CancelPreviousAuth();

    /// <summary>The last few non-empty lines of a login's output, where CLIProxyAPI prints why it failed.</summary>
    public static string FailureSummary(string output, int maxLines = 4)
    {
        var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return string.Join(Environment.NewLine, lines[Math.Max(0, lines.Length - maxLines)..]);
    }

    /// <summary>
    /// True when the login output reports a failure. Every CLIProxyAPI login command prints
    /// "{Provider} authentication failed: …" before exiting 0, so this catches failures even when
    /// another write (e.g. a token refresh) touched the provider's token files meanwhile.
    /// </summary>
    public static bool ReportsFailure(string output) =>
        output.Contains("authentication failed", StringComparison.OrdinalIgnoreCase);
    // ── helpers ───────────────────────────────────────────────────────────────

    private static string ProviderDisplayName(string providerId) => providerId switch
    {
        "claude"         => "Claude Code",
        "codex"          => "OpenAI Codex",
        "kimi"           => "Kimi",
        "antigravity"    => "Antigravity",
        "xai"            => "xAI",
        "devin"          => "Devin",
        "meta"           => "Meta",
        _                => providerId,
    };

    private static readonly Regex UrlPattern =
        new(@"https?://[^\s'""<>]+", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>Returns the first http(s) URL found in the captured output, or empty when none.</summary>
    private static string ExtractAuthUrl(string output)
    {
        if (string.IsNullOrEmpty(output)) return "";
        var match = UrlPattern.Match(output);
        return match.Success ? match.Value.TrimEnd('.', ',', ')', ']') : "";
    }
}
