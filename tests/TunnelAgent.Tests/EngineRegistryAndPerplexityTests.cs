using TunnelAgent.Services;
using Xunit;

using TunnelAgent.Core.Engine;
using TunnelAgent.Infrastructure.Engine;
namespace TunnelAgent.Tests;

public sealed class EngineRegistryAndPerplexityTests
{
    [Fact]
    public async Task SettingsService_LoadAsync_SeedsKnownEngines()
    {
        using var temp = new TestTempDirectory();
        var settings = new SettingsService(temp.File("settings.json"));

        await settings.LoadAsync();

        var cli = settings.Current.GetOrAddEngine(EngineCatalog.CliProxyApi.Id, 0);
        var perplexity = settings.Current.GetOrAddEngine(EngineCatalog.PerplexityWebUiScraper.Id, 0);
        var nineRouter = settings.Current.GetOrAddEngine(EngineCatalog.NineRouter.Id, 0);
        Assert.Equal(8317, cli.Port);
        Assert.Equal(8327, perplexity.Port);
        Assert.Equal(20128, nineRouter.Port);
    }

    [Fact]
    public async Task EngineRegistryService_ExposesAllManagedEngines()
    {
        using var temp = new TestTempDirectory();
        var settings = new SettingsService(temp.File("settings.json"));
        await settings.LoadAsync();

        var registry = new EngineRegistryService(settings);

        Assert.Equal(3, registry.Engines.Count);
        Assert.IsType<TunnelAgent.Infrastructure.Engine.CliProxy.EngineService>(registry.Get("cliproxyapi"));
        Assert.IsType<TunnelAgent.Infrastructure.Engine.Perplexity.EngineService>(registry.Get("perplexity-webui-scraper"));
        Assert.IsType<TunnelAgent.Infrastructure.Engine.NineRouter.EngineService>(registry.Get("9router"));
    }

    [Fact]
    public void AccountService_AddSetDefaultRemove_Works()
    {
        using var temp = new TestTempDirectory();
        var accountsDir = System.IO.Path.Combine(temp.Path, "perplexity-accounts");
        var service = new TunnelAgent.Infrastructure.Engine.Perplexity.AccountService(accountsDir, temp.File("credential-backups"));

        var first = service.Add("Primary", "token-1");
        var second = service.Add("Backup", "token-2");
        var changed = service.SetDefault(second.Id);
        var removed = service.Remove(second.Id);

        Assert.True(changed);
        Assert.True(removed);
        Assert.Equal(first.Id, service.GetDefault()!.Id);
        Assert.Single(service.List());
    }

    [Fact]
    public void AccountService_Remove_BacksUpOutsideAccountsDirWithOwnerOnlyPermissions()
    {
        using var temp = new TestTempDirectory();
        var accountsDir = temp.File("perplexity-accounts");
        var backupRoot = temp.File("credential-backups");
        var service = new TunnelAgent.Infrastructure.Engine.Perplexity.AccountService(accountsDir, backupRoot);
        var account = service.Add("Primary", "token-1");

        Assert.True(service.Remove(account.Id));

        Assert.False(System.IO.Directory.Exists(System.IO.Path.Combine(accountsDir, ".backup")));
        var backup = Assert.Single(System.IO.Directory.GetFiles(backupRoot, "*.json", System.IO.SearchOption.AllDirectories));
        Assert.Equal($"{account.Id}.json", System.IO.Path.GetFileName(backup));
        Assert.Equal("perplexity", System.IO.Path.GetFileName(System.IO.Path.GetDirectoryName(backup)));
        Assert.Contains("token-1", System.IO.File.ReadAllText(backup));
        if (!OperatingSystem.IsWindows())
        {
            const System.IO.UnixFileMode ownerRw = System.IO.UnixFileMode.UserRead | System.IO.UnixFileMode.UserWrite;
            Assert.Equal(ownerRw, System.IO.File.GetUnixFileMode(backup));
            Assert.Equal(ownerRw, System.IO.File.GetUnixFileMode(System.IO.Path.Combine(accountsDir, $"{service.Add("Other", "t").Id}.json")));
            Assert.Equal(ownerRw | System.IO.UnixFileMode.UserExecute, System.IO.File.GetUnixFileMode(accountsDir));
        }
    }

    [Fact]
    public void AccountService_PrunesExpiredLegacyBackupsInsideAccountsDir()
    {
        using var temp = new TestTempDirectory();
        var accountsDir = temp.File("perplexity-accounts");
        var legacy = System.IO.Path.Combine(accountsDir, ".backup");
        var expired = System.IO.Path.Combine(legacy, DateTime.UtcNow.AddDays(-8).ToString("yyyyMMddHHmmss"));
        var recent = System.IO.Path.Combine(legacy, DateTime.UtcNow.AddDays(-1).ToString("yyyyMMddHHmmss"));
        foreach (var dir in new[] { expired, recent })
        {
            System.IO.Directory.CreateDirectory(dir);
            System.IO.File.WriteAllText(System.IO.Path.Combine(dir, "a.json"), "{}");
        }

        _ = new TunnelAgent.Infrastructure.Engine.Perplexity.AccountService(accountsDir, temp.File("credential-backups"));

        Assert.False(System.IO.Directory.Exists(expired));
        Assert.True(System.IO.Directory.Exists(recent));
        if (!OperatingSystem.IsWindows())
            Assert.Equal(System.IO.UnixFileMode.UserRead | System.IO.UnixFileMode.UserWrite | System.IO.UnixFileMode.UserExecute,
                System.IO.File.GetUnixFileMode(legacy));
    }
}
