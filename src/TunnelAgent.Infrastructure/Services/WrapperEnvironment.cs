using System;

namespace TunnelAgent.Services;

/// <summary>
/// Undoes library paths that a packaging wrapper (e.g. the Nix flake) adds
/// for this process, so child processes such as xdg-open load the host's
/// libraries instead of ones built against a different glibc.
/// </summary>
public static class WrapperEnvironment
{
    internal const string HostLibraryPathVariable = "TUNNEL_AGENT_HOST_LD_LIBRARY_PATH";

    /// <summary>
    /// Children inherit the managed environment, while the dynamic loader of
    /// this process keeps the search path it read at startup, so this only
    /// affects processes started afterwards.
    /// </summary>
    public static void RestoreHostLibraryPath()
    {
        var hostPath = Environment.GetEnvironmentVariable(HostLibraryPathVariable);
        if (hostPath is null) return;

        Environment.SetEnvironmentVariable("LD_LIBRARY_PATH", hostPath.Length == 0 ? null : hostPath);
        Environment.SetEnvironmentVariable(HostLibraryPathVariable, null);
    }
}
