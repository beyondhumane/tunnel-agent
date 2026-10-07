{
  description = "Tunnel Agent, a desktop UI for local AI proxy engines";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f system nixpkgs.legacyPackages.${system});
    in
    {
      packages = forAllSystems (
        system: pkgs: {
          default = self.packages.${system}.tunnel-agent;
          tunnel-agent = pkgs.callPackage ./packaging/nix/package.nix { };
        }
      );

      apps = forAllSystems (
        system: pkgs: {
          default = {
            type = "app";
            program = "${self.packages.${system}.tunnel-agent}/bin/tunnel-agent";
            meta.description = "Tunnel Agent desktop window";
          };
        }
      );

      devShells = forAllSystems (
        system: pkgs:
        let
          tunnel-agent = self.packages.${system}.tunnel-agent;
        in
        {
          default = pkgs.mkShell {
            packages = [
              (with pkgs.dotnetCorePackages; combinePackages [ sdk_10_0 ])
              pkgs.nodejs
              pkgs.nixfmt
            ];
            DOTNET_CLI_TELEMETRY_OPTOUT = "1";
            # `dotnet run` needs the same native libraries the package wraps in.
            LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath tunnel-agent.runtimeLibs;
          };
        }
      );

      formatter = forAllSystems (system: pkgs: pkgs.nixfmt);
    };
}
