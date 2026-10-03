using System;
using System.Globalization;
using System.IO;

namespace TunnelAgent.Services;

/// <summary>
/// Copies of deleted credential files, kept under {LocalData}/credential-backups/{yyyyMMddHHmmss}/
/// with owner-only permissions and removed after <see cref="Retention"/>.
/// </summary>
public static class CredentialBackups
{
    // Backups must live outside engine directories: CLIProxyAPI's management UI scans
    // auth-dir for credential files and would otherwise list these backups as accounts.
    public static string DefaultRoot =>
        Path.Combine(IPlatformInfo.Current.LocalDataDirectory, "credential-backups");

    internal const string StampFormat = "yyyyMMddHHmmss";

    /// <summary>Backups hold live tokens, so a removed account stays recoverable only this long.</summary>
    public static readonly TimeSpan Retention = TimeSpan.FromDays(7);

    /// <summary>Deletes backup folders under <paramref name="root"/> older than <see cref="Retention"/>.</summary>
    public static void Prune(string root, DateTime nowUtc)
    {
        if (!Directory.Exists(root)) return;
        foreach (var dir in Directory.GetDirectories(root))
        {
            if (!DateTime.TryParseExact(Path.GetFileName(dir), StampFormat, CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var createdUtc))
                continue;
            if (nowUtc - createdUtc < Retention) continue;
            try { Directory.Delete(dir, recursive: true); }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[CredentialBackups] Failed to prune {dir}: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Copies <paramref name="file"/> into a new owner-only backup under <paramref name="root"/>
    /// (optionally inside <paramref name="subdirectory"/>), then deletes the original.
    /// Returns the backup path; throws if either step fails.
    /// </summary>
    public static string BackupAndDelete(string file, string root, string? subdirectory = null)
    {
        var now = DateTime.UtcNow;
        Prune(root, now);
        var stampDir = Path.Combine(root, now.ToString(StampFormat, CultureInfo.InvariantCulture));
        var backupDir = subdirectory is null ? stampDir : Path.Combine(stampDir, subdirectory);
        CreateOwnerOnlyDirectory(root);
        CreateOwnerOnlyDirectory(stampDir);
        CreateOwnerOnlyDirectory(backupDir);

        var backupPath = UniquePath(backupDir, Path.GetFileName(file));
        File.Copy(file, backupPath, overwrite: false);
        RestrictToOwner(backupPath);
        File.Delete(file);
        return backupPath;
    }

    /// <summary>A path in <paramref name="dir"/> that doesn't exist yet, so a backup never replaces an earlier one.</summary>
    public static string UniquePath(string dir, string fileName)
    {
        var path = Path.Combine(dir, fileName);
        var stem = Path.GetFileNameWithoutExtension(fileName);
        var ext  = Path.GetExtension(fileName);
        for (var i = 2; File.Exists(path); i++)
            path = Path.Combine(dir, $"{stem}.{i}{ext}");
        return path;
    }

    /// <summary>Sets a file to 0600 on Unix; no-op on Windows (per-user profile ACLs apply).</summary>
    public static void RestrictToOwner(string file)
    {
        if (!OperatingSystem.IsWindows())
            File.SetUnixFileMode(file, UnixFileMode.UserRead | UnixFileMode.UserWrite);
    }

    private static void CreateOwnerOnlyDirectory(string path)
    {
        Directory.CreateDirectory(path);
        if (!OperatingSystem.IsWindows())
            File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
    }
}
