import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Download links must point at a published release. CI passes the latest tag
// in TA_VERSION; local builds fall back to the version in the app's csproj.
function version(): string {
  const fromEnv = process.env.TA_VERSION?.replace(/^v/, "").trim();
  if (fromEnv) return fromEnv;
  const csproj = fs.readFileSync(path.resolve(__dirname, "../src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj"), "utf8");
  const v = /<Version>([^<]+)<\/Version>/.exec(csproj)?.[1];
  if (!v) throw new Error("<Version> not found in TunnelAgent.Avalonia.csproj");
  return v;
}

// SITE_BASE is the path the site is served from ("/tunnel-agent/" on a GitHub
// Pages project site, "/" on a custom domain); SITE_URL is its origin.
const base = process.env.SITE_BASE ?? "/";
const siteUrl = (process.env.SITE_URL ?? "https://tunnel-agent.beyondhumane.com").replace(/\/$/, "");

export default defineConfig({
  base,
  define: {
    __TA_VERSION__: JSON.stringify(version()),
    __SITE_URL__: JSON.stringify(siteUrl),
  },
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: [".."] } },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
