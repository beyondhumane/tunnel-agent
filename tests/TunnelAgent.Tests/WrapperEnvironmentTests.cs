using TunnelAgent.Services;

namespace TunnelAgent.Tests;

[Collection("EnvironmentVariables")]
public class WrapperEnvironmentTests
{
    [Theory]
    [InlineData("/usr/lib/custom", "/usr/lib/custom")]
    [InlineData("", null)]
    public void RestoreHostLibraryPath_RestoresCapturedValue(string captured, string? expected)
    {
        var previousPath = Environment.GetEnvironmentVariable("LD_LIBRARY_PATH");
        try
        {
            Environment.SetEnvironmentVariable("LD_LIBRARY_PATH", "/nix/store/libx11/lib");
            Environment.SetEnvironmentVariable(WrapperEnvironment.HostLibraryPathVariable, captured);

            WrapperEnvironment.RestoreHostLibraryPath();

            Assert.Equal(expected, Environment.GetEnvironmentVariable("LD_LIBRARY_PATH"));
            Assert.Null(Environment.GetEnvironmentVariable(WrapperEnvironment.HostLibraryPathVariable));
        }
        finally
        {
            Environment.SetEnvironmentVariable("LD_LIBRARY_PATH", previousPath);
            Environment.SetEnvironmentVariable(WrapperEnvironment.HostLibraryPathVariable, null);
        }
    }

    [Fact]
    public void RestoreHostLibraryPath_WithoutWrapper_LeavesPathAlone()
    {
        var previousPath = Environment.GetEnvironmentVariable("LD_LIBRARY_PATH");
        try
        {
            Environment.SetEnvironmentVariable("LD_LIBRARY_PATH", "/opt/lib");
            Environment.SetEnvironmentVariable(WrapperEnvironment.HostLibraryPathVariable, null);

            WrapperEnvironment.RestoreHostLibraryPath();

            Assert.Equal("/opt/lib", Environment.GetEnvironmentVariable("LD_LIBRARY_PATH"));
        }
        finally
        {
            Environment.SetEnvironmentVariable("LD_LIBRARY_PATH", previousPath);
        }
    }
}
