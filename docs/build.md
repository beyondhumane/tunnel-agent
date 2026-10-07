# Build & Publish Guide

## Development

Normal day-to-day run:

```pwsh
dotnet run --project src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj
```

Build without running (catches compile errors):

```pwsh
dotnet build TunnelAgent.slnx
```

---

## Publishing Options

### Option 1 — Self-contained, single file (portable / no runtime required) ✅ Used for portable release & Scoop zip

Bundles the entire .NET 10 runtime inside the exe. No prerequisites for the user.  
No trimming — avoids Avalonia reflection binding issues.

```pwsh
dotnet publish src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj -c Release -r win-x64 --self-contained true `
  -p:PublishSingleFile=true `
  -p:EnableCompressionInSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:DebugType=None -p:DebugSymbols=false
```

| | |
|---|---|
| Output | `artifacts/portable/TunnelAgent.exe` |
| Size | ~110 MB uncompressed / ~45 MB with `EnableCompressionInSingleFile` |
| Files | 1 |
| Requires | Nothing |

> ⚠️ `EnableCompressionInSingleFile=true` is **only** valid with `--self-contained true`.  
> ⚠️ `PublishTrimmed=true` is omitted intentionally — trimming breaks Avalonia reflection bindings.

The release workflow (`.github/workflows/release.yml`) uses this option for the
updater-free `TunnelAgent-<version>-win-<arch>-scoop.zip` consumed by Scoop,
published to `artifacts/publish-scoop`. This keeps the Scoop zip a single
compressed exe (no loose DLLs) instead of the multi-file Velopack output.

---

### Option 2 — Self-contained, multiple files (installer) ✅ Used for Velopack installer

No trimming, no single file. All DLLs explicit. Required by Velopack — it needs the folder structure to generate delta packages.

```pwsh
dotnet publish src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj -c Release -r win-x64 --self-contained true `
  -p:PublishSingleFile=false `
  -p:DebugType=None -p:DebugSymbols=false
```

| | |
|---|---|
| Output | `artifacts/publish/` folder |
| Size | ~135 MB total |
| Files | ~30 files |
| Requires | Nothing |

---

### Option 3 — Framework-dependent, single file ❌ Does not work

`EnableCompressionInSingleFile=true` requires `--self-contained true` — fails with `NETSDK1176`.  
Without compression the exe is ~51 MB but requires .NET 10 installed on the target machine.  
Not used.

---

## Why are there always 3 native DLLs?

Without `IncludeNativeLibrariesForSelfExtract=true`, these always appear alongside the exe:

| File | Purpose | Size |
|---|---|---|
| `libSkiaSharp.dll` | 2D graphics (Avalonia renderer) | ~9 MB |
| `av_libglesv2.dll` | OpenGL ES (GPU acceleration) | ~4 MB |
| `libHarfBuzzSharp.dll` | Text shaping | ~1.5 MB |

These are **unmanaged C++ libraries** — they cannot be packed into a managed `.exe` by `PublishSingleFile` unless you use `IncludeNativeLibrariesForSelfExtract=true`, which bundles them and extracts them to a temp folder at startup.

---

## Why is the exe so large?

The main contributors:

| Component | Size |
|---|---|
| .NET 10 runtime (self-contained only) | ~80 MB |
| `libSkiaSharp.dll` | ~9 MB |
| `IconPacks.Avalonia.SimpleIcons.dll` | ~5 MB |
| `IconPacks.Avalonia.Lucide.dll` | ~4.5 MB |
| `av_libglesv2.dll` | ~4 MB |
| App code (`TunnelAgent.dll`) | ~3 MB |

The icon packs embed **all** icons even if only a few are used. If size becomes critical, switching to SVG files or a subset icon pack would help.

---

## Runtime identifiers

| RID | Target |
|---|---|
| `win-x64` | Windows 64-bit (most common) |
| `win-arm64` | Windows on ARM (Surface Pro X, Snapdragon) |
| `osx-arm64` | macOS Apple Silicon (M1/M2/M3/M4) |
| `osx-x64` | macOS Intel |
| `linux-x64` | Linux 64-bit |

---

## Dropping debug symbols

The `.pdb` file is only needed for crash stack traces. Safe to exclude from distribution:

```pwsh
dotnet publish ... -p:DebugType=None -p:DebugSymbols=false
```

---

## Argument reference

| Argument | What it does |
|---|---|
| `publish` | Compiles and prepares output for deployment. Unlike `build`, it resolves all dependencies and produces a distributable folder. |
| `-c Release` | Build configuration. `Release` enables optimizations and disables debug info. `Debug` is the default for `dotnet run`. |
| `-r win-x64` | Runtime identifier — the target OS and CPU architecture. Tells the compiler which native binaries to include. See the RID table above. |
| `--self-contained false` | Do **not** bundle the .NET runtime. The user's machine must have .NET 10 installed. Makes the output much smaller. |
| `--self-contained true` | Bundle the entire .NET runtime inside the output. The user needs nothing installed. Makes output ~80 MB larger. |
| `-p:PublishSingleFile=true` | Pack all managed DLLs into a single executable. Without this you get a folder full of `.dll` files. |
| `-p:IncludeNativeLibrariesForSelfExtract=true` | Also embed unmanaged native DLLs (Skia, HarfBuzz, ANGLE) inside the exe. They extract to a temp folder at first run. Without this they sit alongside the exe as separate files. |
| `-p:PublishTrimmed=true` | Remove unused .NET framework code via static analysis. Reduces self-contained size by ~50%. **Not used** — breaks Avalonia reflection bindings. |
| `-p:PublishReadyToRun=true` | Pre-JIT the managed code to native during publish. Faster cold startup at the cost of slightly larger output. Only useful with `--self-contained true`. |
| `-p:EnableCompressionInSingleFile=true` | Compress bundled DLLs inside the exe. **Only valid with `--self-contained true`** — fails with `NETSDK1176` otherwise. |
| `-p:DebugType=None` | Do not produce a `.pdb` debug symbols file. Fine for distribution. |
| `-p:DebugSymbols=false` | Companion to `DebugType=None`. Together they ensure no symbol files are emitted. |

---

## Nix

The repository is a flake (`flake.nix`); the package itself lives in `packaging/nix/package.nix`.

| Output | What it is |
|---|---|
| `packages.<system>.default` / `tunnel-agent` | Framework-dependent build against nixpkgs' .NET 10 runtime, wrapped so Avalonia finds its native libraries |
| `apps.<system>.default` | `nix run` entry point (`bin/tunnel-agent`) |
| `devShells.<system>.default` | .NET 10 SDK, Node.js, `nixfmt`, and `LD_LIBRARY_PATH` set for `dotnet run` on Linux |
| `formatter.<system>` | `nixfmt` |

Systems: `x86_64-linux`, `aarch64-linux`, `aarch64-darwin` (nixpkgs unstable dropped `x86_64-darwin`). Only `x86_64-linux` is built in CI.

```bash
nix build                 # result/bin/tunnel-agent
nix run                   # build and start
nix develop               # then: dotnet run --project src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj
nix fmt flake.nix packaging/nix/package.nix
```

What the package does differently from the release builds:

- The version comes from `<Version>` in `TunnelAgent.Avalonia.csproj`, so `scripts/bump-version.sh` covers it.
- The test project runs in the check phase with a throwaway `$HOME`.
- Velopack sees no installed package, so the app never downloads updates (**Check** just reports that it is up to date); users update through Nix.
- The wrapper sets `TUNNEL_AGENT_EXECUTABLE` to itself, and launch at login writes that path instead of the unwrapped apphost (which can't find the .NET runtime or native libraries on its own). After an upgrade, toggle launch at login once so it points at the new store path.
- `xdg-open` and Node.js (for 9Router) are appended to `PATH` as fallbacks.
- `bin/tunnel-agent` records the caller's `LD_LIBRARY_PATH` in `TUNNEL_AGENT_HOST_LD_LIBRARY_PATH` before the inner wrapper adds the Nix libraries, and the app restores it at startup for the processes it starts. Otherwise host programs such as `kde-open5` would load Nix's libX11 and fail with `GLIBC_2.38 not found`. Run `bin/tunnel-agent`, not `bin/TunnelAgent`.
- Engine binaries are still downloaded at runtime into `~/.local/share/TunnelAgent/engine/`. On NixOS, a dynamically linked engine binary needs [nix-ld](https://github.com/nix-community/nix-ld) to start.

### Updating `deps.json`

`packaging/nix/deps.json` pins every NuGet package (including the runtime-specific ones for every system). Regenerate it after changing any `PackageReference`:

```bash
nix build .#tunnel-agent.fetch-deps -o fetch-deps
./fetch-deps packaging/nix/deps.json
rm fetch-deps
```

The Nix workflow (`.github/workflows/nix.yml`) does this on every pull request that touches a `.csproj`, the solution, or the Nix files, then builds the flake. On pushes to `main` it also commits the regenerated file as `chore(nix): update deps.json [skip ci]`, so Dependabot PRs don't need a manual update.
