// Turns the client build into static pages: one HTML file per route with its
// own head, plus sitemap, robots and llms.txt.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(site, "..");
const dist = path.join(site, "dist");
const server = await import(pathToFileURL(path.join(site, "dist-ssr", "entry-server.js")).href);
const { DOCS, SEO, REPO_URL, RELEASES_URL, VERSION, docPath, url, abs } = server;

const write = (rel, body) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
};

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
for (const marker of ["<!--app-head-->", '<div id="root"><!--app-html--></div>']) {
  if (!template.includes(marker)) throw new Error(`index.html lost its ${marker} marker`);
}

function page(route, out) {
  const { html, head } = server.render(route);
  write(
    out,
    template
      .replace("<!--app-head-->", head)
      .replace('<div id="root"><!--app-html--></div>', `<div id="root" data-path="${url(route)}">${html}</div>`),
  );
}

const routes = server.paths();
for (const p of routes) page(p, `${p.replace(/^\//, "")}index.html`);
page("/404/", "404.html");

const lastmod = (rel) => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", rel], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const entries = [
  { loc: abs("/"), mod: lastmod("site") },
  ...DOCS.map((p) => ({ loc: abs(docPath(p.slug)), mod: lastmod(p.path) })),
];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${e.loc}</loc>${e.mod ? `<lastmod>${e.mod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`,
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`);

const source = (p) => `# ${p.title}\n\n> ${p.description}\n\n${p.body.trim()}\n`;
for (const p of DOCS) write(docPath(p.slug).replace(/^\//, "").replace(/\/$/, ".md"), source(p));

const groups = [...new Set(DOCS.map((p) => p.group))];
write(
  "llms.txt",
  `# Tunnel Agent

> ${SEO.description}

Tunnel Agent ${VERSION} is free and open source under the MIT license. Builds for Windows, macOS and Linux are on GitHub Releases.

${groups
  .map(
    (g) =>
      `## ${g}\n\n${DOCS.filter((p) => p.group === g)
        .map((p) => `- [${p.title}](${abs(docPath(p.slug).replace(/\/$/, ".md"))}): ${p.description}`)
        .join("\n")}`,
  )
  .join("\n\n")}

## Optional

- [Source code](${REPO_URL})
- [Releases](${RELEASES_URL})
`,
);
write("llms-full.txt", `# Tunnel Agent documentation\n\n${DOCS.map(source).join("\n---\n\n")}`);

fs.rmSync(path.join(site, "dist-ssr"), { recursive: true, force: true });
console.log(`prerendered ${routes.length + 1} pages, sitemap with ${entries.length} URLs`);
