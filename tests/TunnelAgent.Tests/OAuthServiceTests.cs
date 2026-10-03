using TunnelAgent.Services;

using TunnelAgent.Infrastructure.Engine.CliProxy;
namespace TunnelAgent.Tests;

public sealed class OAuthServiceTests
{
    [Theory]
    [InlineData("claude", true)]
    [InlineData("codex", true)]
    [InlineData("kimi", true)]
    [InlineData("antigravity", true)]
    [InlineData("devin", true)]
    [InlineData("meta", true)]
    [InlineData("local-ai", false)]
    [InlineData("unknown", false)]
    [InlineData("", false)]
    public void IsOAuthProvider_RecognizesKnownProviders(string providerId, bool expected)
    {
        Assert.Equal(expected, OAuthService.IsOAuthProvider(providerId));
    }

    [Fact]
    public void ConnectAsync_KnownProvider_IsNotExercisedInUnitTests()
    {
        // ConnectAsync for a known provider starts the real CLIProxyAPI binary when it is installed,
        // which can launch a browser. Keep unit tests side-effect free and cover unsupported-provider
        // behavior plus provider recognition instead.
        Assert.True(OAuthService.IsOAuthProvider("claude"));
    }

    [Fact]
    public async Task ConnectAsync_UnknownProvider_ReturnsExplicitMessage()
    {
        using var temp = new TestTempDirectory();
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), temp.File("auth"));
        using var service = new OAuthService(config);

        var result = await service.ConnectAsync("local-ai");

        Assert.False(result.Success);
        Assert.Equal(OAuthConnectStatus.NotSupported, result.Status);
    }

    [Fact]
    public async Task Dispose_DoesNotThrow_WhenCalledMultipleTimes()
    {
        using var temp = new TestTempDirectory();
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), temp.File("auth"));
        var service = new OAuthService(config);

        service.Dispose();
        service.Dispose(); // second dispose should not throw
    }

    [Fact]
    public async Task CancelPreviousAuth_WithoutActiveAuth_DoesNotThrow()
    {
        using var temp = new TestTempDirectory();
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), temp.File("auth"));
        var service = new OAuthService(config);

        service.CancelPreviousAuth(); // should not throw
        service.CancelPreviousAuth(); // multiple calls OK
    }

    // Stands in for the CLIProxyAPI binary with a shell script; skipped on Windows.
    private static async Task<(OAuthService Service, TestTempDirectory Temp)?> FakeLoginBinaryAsync(string script)
    {
        if (OperatingSystem.IsWindows()) return null;
        var temp = new TestTempDirectory();
        var binary = temp.File("cli-proxy-api");
        await File.WriteAllTextAsync(binary, "#!/bin/sh\n" + script + "\n");
        File.SetUnixFileMode(binary, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), temp.File("auth"));
        return (new OAuthService(config, binary), temp);
    }

    private static readonly TimeSpan ExitTimeout = TimeSpan.FromSeconds(15);

    [Fact]
    public async Task ConnectAsync_LoginFailsAfterStartWithExitZero_CompletionCarriesOutput()
    {
        var fake = await FakeLoginBinaryAsync("sleep 1.5; echo 'Claude authentication failed: state mismatch' >&2; exit 0");
        if (fake is null) return;
        var (service, temp) = fake.Value;
        using var _ = temp;
        using var __ = service;

        var result = await service.ConnectAsync("claude");

        Assert.True(result.Success);
        Assert.Equal(OAuthConnectStatus.BrowserOpened, result.Status);
        var exit = await result.Completion!.WaitAsync(ExitTimeout);
        Assert.False(exit.Cancelled);
        Assert.Equal(0, exit.ExitCode);
        Assert.Contains("state mismatch", exit.Output);
    }

    [Fact]
    public async Task ConnectAsync_QuickNonZeroExit_ReportsStderr()
    {
        var fake = await FakeLoginBinaryAsync("echo 'port 54545 already in use' >&2; exit 1");
        if (fake is null) return;
        var (service, temp) = fake.Value;
        using var _ = temp;
        using var __ = service;

        var result = await service.ConnectAsync("claude");

        Assert.False(result.Success);
        Assert.Equal(OAuthConnectStatus.Failed, result.Status);
        Assert.Contains("already in use", result.Detail);
    }

    [Fact]
    public async Task ConnectAsync_UrlPrintedAfterFirstSecond_AuthUrlCompletesWithIt()
    {
        var fake = await FakeLoginBinaryAsync("sleep 1.5; echo 'Visit https://claude.ai/oauth/authorize?code=true&state=abc to log in'; sleep 1");
        if (fake is null) return;
        var (service, temp) = fake.Value;
        using var _ = temp;
        using var __ = service;

        var result = await service.ConnectAsync("claude");

        Assert.Equal(OAuthConnectStatus.BrowserOpened, result.Status);
        Assert.Equal("https://claude.ai/oauth/authorize?code=true&state=abc", await result.AuthUrl!.WaitAsync(ExitTimeout));
    }

    [Fact]
    public async Task CancelPreviousAuth_Provider_CancelsOnlyThatProvidersLogin()
    {
        var fake = await FakeLoginBinaryAsync("sleep 30");
        if (fake is null) return;
        var (service, temp) = fake.Value;
        using var _ = temp;
        using var __ = service;

        var claude = await service.ConnectAsync("claude");
        var codex = await service.ConnectAsync("codex");

        service.CancelPreviousAuth("claude");

        var claudeExit = await claude.Completion!.WaitAsync(ExitTimeout);
        Assert.True(claudeExit.Cancelled);
        Assert.False(codex.Completion!.IsCompleted);

        service.CancelPreviousAuth();
        Assert.True((await codex.Completion.WaitAsync(ExitTimeout)).Cancelled);
    }

    [Fact]
    public async Task ConnectAsync_Codex_DoesNotWriteToStdin()
    {
        // CLIProxyAPI asks for a pasted callback URL on stdin; nothing but the user may answer it.
        var fake = await FakeLoginBinaryAsync("if read -r line; then echo \"stdin: [$line]\"; else echo eof; fi");
        if (fake is null) return;
        var (service, temp) = fake.Value;
        using var _ = temp;
        using var __ = service;

        var result = await service.ConnectAsync("codex");
        Assert.False(result.Completion!.IsCompleted);

        await Task.Delay(TimeSpan.FromSeconds(1));
        Assert.False(result.Completion.IsCompleted);
        service.CancelPreviousAuth("codex");
        var exit = await result.Completion.WaitAsync(ExitTimeout);
        Assert.DoesNotContain("stdin:", exit.Output);
    }

    [Theory]
    [InlineData("Waiting for callback\nClaude authentication failed: context deadline exceeded\n", true)]
    [InlineData("time=\"…\" level=error msg=\"Antigravity authentication failed: denied\"\n", true)]
    [InlineData("Authentication saved to /auth/claude-f9c692a7-me@example.com.json\nClaude authentication successful\n", false)]
    public void ReportsFailure_DetectsCliProxyFailureLine(string output, bool expected) =>
        Assert.Equal(expected, OAuthService.ReportsFailure(output));

    [Fact]
    public void FailureSummary_KeepsLastNonEmptyLines()
    {
        var output = "Opening browser\n\nVisit https://x\nWaiting for callback\n  \nClaude authentication failed: timeout\n";

        Assert.Equal(
            string.Join(Environment.NewLine, "Visit https://x", "Waiting for callback", "Claude authentication failed: timeout"),
            OAuthService.FailureSummary(output, maxLines: 3));
    }
}
