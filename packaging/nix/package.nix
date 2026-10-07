{
  lib,
  stdenv,
  buildDotnetModule,
  dotnetCorePackages,
  copyDesktopItems,
  makeDesktopItem,
  fontconfig,
  libGL,
  libICE,
  libSM,
  libX11,
  libXcursor,
  libXext,
  libXi,
  libXrandr,
  nodejs,
  xdg-utils,
}:

let
  csproj = builtins.readFile ../../src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj;
  # Avalonia and SkiaSharp dlopen these at runtime.
  runtimeLibs = lib.optionals stdenv.hostPlatform.isLinux [
    fontconfig
    libGL
    libICE
    libSM
    libX11
    libXcursor
    libXext
    libXi
    libXrandr
  ];
in
buildDotnetModule (finalAttrs: {
  pname = "tunnel-agent";
  # scripts/bump-version.sh keeps the csproj as the single source of truth.
  version = builtins.head (builtins.match ".*<Version>([^<]+)</Version>.*" csproj);

  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.intersection (lib.fileset.gitTracked ../..) (
      lib.fileset.unions [
        ../../TunnelAgent.slnx
        ../../src
        ../../tests
      ]
    );
  };

  dotnet-sdk = dotnetCorePackages.sdk_10_0;
  dotnet-runtime = dotnetCorePackages.runtime_10_0;

  projectFile = "src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj";
  testProjectFile = "tests/TunnelAgent.Tests/TunnelAgent.Tests.csproj";
  # Regenerate with: nix build .#tunnel-agent.fetch-deps && ./result packaging/nix/deps.json
  nugetDeps = ./deps.json;
  doCheck = true;
  # Settings resolve under $HOME/.config, and .NET only returns XDG folders
  # that already exist, so the sandbox needs a real home.
  preCheck = ''
    export HOME=$(mktemp -d)
    mkdir -p $HOME/.config $HOME/.local/share
  '';

  executables = [ "TunnelAgent" ];

  nativeBuildInputs = lib.optionals stdenv.hostPlatform.isLinux [ copyDesktopItems ];

  runtimeDeps = runtimeLibs;

  # Fallbacks only: folders open through xdg-open and 9Router needs Node.js,
  # but a node already on the user's PATH wins.
  # Login items should start the wrapper, not the bare apphost it execs.
  preInstall = ''
    makeWrapperArgs+=(--set-default TUNNEL_AGENT_EXECUTABLE $out/bin/tunnel-agent)
    makeWrapperArgs+=(--suffix PATH : ${
      lib.makeBinPath ([ nodejs ] ++ lib.optionals stdenv.hostPlatform.isLinux [ xdg-utils ])
    })
  '';

  desktopItems = [
    (makeDesktopItem {
      name = "tunnel-agent";
      desktopName = "Tunnel Agent";
      comment = finalAttrs.meta.description;
      exec = "tunnel-agent";
      icon = "tunnel-agent";
      categories = [
        "Utility"
        "Development"
      ];
      terminal = false;
    })
  ];

  postInstall = lib.optionalString stdenv.hostPlatform.isLinux ''
    install -Dm644 src/TunnelAgent.Avalonia/Assets/logo-256.png \
      $out/share/icons/hicolor/256x256/apps/tunnel-agent.png
  '';

  # The wrapper in $out/bin is only created during preFixup.
  postFixup = ''
    ln -s TunnelAgent $out/bin/tunnel-agent
  '';

  passthru = { inherit runtimeLibs; };

  meta = {
    description = "Desktop UI for CLIProxyAPI, Perplexity WebUI Scraper, and 9Router";
    homepage = "https://github.com/beyondhumane/tunnel-agent";
    license = lib.licenses.mit;
    mainProgram = "tunnel-agent";
    platforms = lib.platforms.linux ++ lib.platforms.darwin;
  };
})
