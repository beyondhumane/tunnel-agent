using TunnelAgent.Services;

namespace TunnelAgent.Tests;

public class LaunchAtLoginServiceTests
{
    [Fact]
    public void GetExecutablePath_PrefersExistingOverride()
    {
        var wrapper = Path.GetTempFileName();
        var previous = Environment.GetEnvironmentVariable(LaunchAtLoginService.ExecutableOverrideVariable);
        try
        {
            Environment.SetEnvironmentVariable(LaunchAtLoginService.ExecutableOverrideVariable, wrapper);
            Assert.Equal(wrapper, LaunchAtLoginService.GetExecutablePath());
        }
        finally
        {
            Environment.SetEnvironmentVariable(LaunchAtLoginService.ExecutableOverrideVariable, previous);
            File.Delete(wrapper);
        }
    }

    [Fact]
    public void GetExecutablePath_IgnoresMissingOverride()
    {
        var previous = Environment.GetEnvironmentVariable(LaunchAtLoginService.ExecutableOverrideVariable);
        try
        {
            var missing = Path.Combine(Path.GetTempPath(), $"missing-{Guid.NewGuid():N}");
            Environment.SetEnvironmentVariable(LaunchAtLoginService.ExecutableOverrideVariable, missing);
            Assert.NotEqual(missing, LaunchAtLoginService.GetExecutablePath());
        }
        finally
        {
            Environment.SetEnvironmentVariable(LaunchAtLoginService.ExecutableOverrideVariable, previous);
        }
    }
}
