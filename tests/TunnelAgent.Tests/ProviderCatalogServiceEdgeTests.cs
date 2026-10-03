using TunnelAgent.Services;

using TunnelAgent.Infrastructure.Engine.CliProxy;
namespace TunnelAgent.Tests;

public sealed class ProviderCatalogServiceEdgeTests
{
    [Fact]
    public async Task ResetAllCredentialsAsync_RemovesAllCustomAndOAuthAccounts()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();

        // Add a custom provider with account
        settings.Current.Providers.Add(new ProviderSettings
        {
            Id = "local-ai",
            Enabled = true,
            BaseUrl = "https://local.example/v1",
            DisplayName = "Local AI",
            Accounts = [new ProviderAccountSettings { ApiKey = "sk-key" }]
        });

        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        // Should have our custom provider
        Assert.Contains(catalog.Providers, p => p.Id == "local-ai");

        Directory.CreateDirectory(authDir);
        var unmanagedFile = Path.Combine(authDir, "unmanaged.json");
        var oauthFile = Path.Combine(authDir, "claude-user@example.com-pro.json");
        var customFile = Path.Combine(authDir, "openai-compat-local-ai-test.json");
        await File.WriteAllTextAsync(unmanagedFile, "{}");
        await File.WriteAllTextAsync(oauthFile, "{\"access_token\":\"token\"}");
        await File.WriteAllTextAsync(customFile, "{\"type\":\"openai-compat\",\"provider\":\"local-ai\",\"api_key\":\"sk-key\"}");

        await catalog.ResetAllCredentialsAsync();

        // After reset, custom provider accounts should be cleared. Managed auth files are backed up and removed,
        // but unrelated JSON in the auth folder must be preserved.
        Assert.Empty(settings.Current.Providers.Where(p => p.Id == "local-ai")
            .SelectMany(p => p.Accounts));
        Assert.True(File.Exists(unmanagedFile));
        Assert.False(File.Exists(oauthFile));
        Assert.False(File.Exists(customFile));
        // Backups must live outside auth-dir so CLIProxyAPI's own credential scan never sees them.
        Assert.False(Directory.Exists(Path.Combine(authDir, ".tunnelagent-backup")));
        Assert.True(Directory.Exists(Path.Combine(IPlatformInfo.Current.LocalDataDirectory, "credential-backups")));
    }

    [Fact]
    public async Task RemoveAccountAsync_LastCustomProviderKey_RemovesEntriesAndKeepsProvider()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        settings.Current.Providers.Add(new ProviderSettings
        {
            Id = "opencode",
            Enabled = true,
            Kind = ProviderKind.OpenAICompatibility,
            BaseUrl = "https://opencode.ai/zen/go/v1",
            Accounts = [new ProviderAccountSettings { ApiKey = "1234" }]
        });

        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        await catalog.RemoveAccountAsync("opencode", "1234");

        var provider = Assert.Single(settings.Current.Providers, p => p.Id == "opencode");
        Assert.Empty(provider.Accounts);

        var yaml = await File.ReadAllTextAsync(config.ConfigPath);
        Assert.Contains("  - name: opencode", yaml);
        Assert.Contains("    base-url: \"https://opencode.ai/zen/go/v1\"", yaml);
        Assert.DoesNotContain("api-key-entries:", yaml);
        Assert.DoesNotContain("label:", yaml);
    }

    [Fact]
    public async Task DisconnectOAuth_NonExistentProvider_DoesNotThrow()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        // Should not throw for unknown provider
        catalog.DisconnectOAuth("nonexistent-provider-id");
    }

    [Fact]
    public async Task DisconnectOAuth_DisablesKnownProvider()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        Directory.CreateDirectory(authDir);
        var claudeFile = Path.Combine(authDir, "claude-user@example.com-pro.json");
        var unrelatedFile = Path.Combine(authDir, "notes.json");
        await File.WriteAllTextAsync(claudeFile, "{\"access_token\":\"token\"}");
        await File.WriteAllTextAsync(unrelatedFile, "{}");

        catalog.DisconnectOAuth("claude");

        Assert.Contains(catalog.Providers, p => p.Id == "claude");
        Assert.False(File.Exists(claudeFile));
        Assert.True(File.Exists(unrelatedFile));
        Assert.False(Directory.Exists(Path.Combine(authDir, ".tunnelagent-backup")));
        Assert.True(Directory.Exists(Path.Combine(IPlatformInfo.Current.LocalDataDirectory, "credential-backups")));
    }

    [Fact]
    public async Task ConnectedProviderCount_ReflectsConnectedState()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        // Without any OAuth tokens, no providers should be connected
        var connected = catalog.Providers.Count(p => p.Connected);
        Assert.Equal(0, connected);
    }

    private static void WriteSameEmailClaudeAccounts(string authDir)
    {
        Directory.CreateDirectory(authDir);
        File.WriteAllText(Path.Combine(authDir, "claude-f9c692a7-name@domain.com.json"),
            "{\"email\":\"name@domain.com\",\"access_token\":\"a\",\"organization_name\":\"Acme\"}");
        File.WriteAllText(Path.Combine(authDir, "claude-0a1b2c3d-name@domain.com.json"),
            "{\"email\":\"name@domain.com\",\"access_token\":\"b\"}");
    }

    [Fact]
    public async Task Providers_SameEmailInTwoOrganizations_ShowsOneRowPerTokenFile()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        WriteSameEmailClaudeAccounts(authDir);
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        var rows = catalog.Providers.Single(p => p.Id == "claude").Accounts
            .OrderBy(a => a.TokenFile, StringComparer.Ordinal).ToList();

        Assert.Equal(["claude-0a1b2c3d-name@domain.com.json", "claude-f9c692a7-name@domain.com.json"], rows.Select(a => a.TokenFile));
        Assert.Equal(["name@domain.com · 0a1b2c3d", "name@domain.com · Acme"], rows.Select(a => a.DisplayName));
    }

    [Fact]
    public async Task RemoveOAuthAccount_WithTokenFile_KeepsOtherAccountWithSameEmail()
    {
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        WriteSameEmailClaudeAccounts(authDir);
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();

        catalog.RemoveOAuthAccount("claude", "name@domain.com", "claude-f9c692a7-name@domain.com.json");

        Assert.False(File.Exists(Path.Combine(authDir, "claude-f9c692a7-name@domain.com.json")));
        Assert.True(File.Exists(Path.Combine(authDir, "claude-0a1b2c3d-name@domain.com.json")));
    }

    [Fact]
    public void PruneCredentialBackups_DeletesOnlyBackupsPastRetention()
    {
        using var temp = new TestTempDirectory();
        var root = temp.File("credential-backups");
        var now = new DateTime(2026, 10, 2, 12, 0, 0, DateTimeKind.Utc);
        var expired = Path.Combine(root, now.AddDays(-8).ToString("yyyyMMddHHmmss"));
        var recent = Path.Combine(root, now.AddDays(-1).ToString("yyyyMMddHHmmss"));
        var unrelated = Path.Combine(root, "keep-me");
        foreach (var dir in new[] { expired, recent, unrelated })
        {
            Directory.CreateDirectory(dir);
            File.WriteAllText(Path.Combine(dir, "claude-user@example.com.json"), "{\"refresh_token\":\"r\"}");
        }

        ProviderCatalogService.PruneCredentialBackups(root, now);

        Assert.False(Directory.Exists(expired));
        Assert.True(Directory.Exists(recent));
        Assert.True(Directory.Exists(unrelated));
    }

    [Fact]
    public async Task DisconnectOAuth_BackupIsReadableByOwnerOnly()
    {
        if (OperatingSystem.IsWindows()) return;
        using var temp = new TestTempDirectory();
        var authDir = temp.File("auth");
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();
        var config = new ConfigService(settings, temp.File("proxy-config.yaml"), authDir);
        using var catalog = new ProviderCatalogService(settings, config, authDir);
        await catalog.InitializeAsync();
        Directory.CreateDirectory(authDir);
        var name = $"claude-{Guid.NewGuid():N}@example.com.json";
        await File.WriteAllTextAsync(Path.Combine(authDir, name), "{\"access_token\":\"token\"}");

        catalog.DisconnectOAuth("claude");

        var root = Path.Combine(IPlatformInfo.Current.LocalDataDirectory, "credential-backups");
        var backup = Assert.Single(Directory.GetFiles(root, name, SearchOption.AllDirectories));
        Assert.Equal(UnixFileMode.UserRead | UnixFileMode.UserWrite, File.GetUnixFileMode(backup));
        Assert.Equal(UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute, File.GetUnixFileMode(root));
        File.Delete(backup);
    }
}
