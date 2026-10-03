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
const { docsFor, dict, LANGS, REPO_URL, RELEASES_URL, VERSION, docPath, localizedPath, url, abs } = server;

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
  const { html, head, lang } = server.render(route);
  write(
    out,
    template
      .replace('<html lang="en">', `<html lang="${lang}">`)
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
  ...LANGS.flatMap((lang) => [
    { loc: abs(localizedPath("/", lang)), mod: lastmod(`site/src/i18n/${lang}.ts`) },
    ...docsFor(lang).map((p) => ({ loc: abs(localizedPath(docPath(p.slug), lang)), mod: lastmod(p.path) })),
  ]),
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

const source = (p, lang) => `# ${p.title}\n\n> ${p.description}\n\n${p.body.trim().replace(/\]\(([a-z0-9-]+)\.md(#[a-z0-9-]+)?\)/g, (_, slug, hash = '') => `](${abs(localizedPath(docPath(slug).replace(/\/$/, '.md'), lang))}${hash})`)}\n`;

for (const lang of LANGS) {
  const DOCS = docsFor(lang);
  const t = dict(lang);
  const local = (p) => localizedPath(p, lang);
  const output = (p) => local(`/${p}`).replace(/^\//, '');
  const facts = `# Tunnel Agent\n\n> ${t.seo.description}\n\n${t.faq.items.map((item) => `## ${item.question}\n\n${item.answer}\n\n${t.faq.more}: ${abs(local(docPath(item.doc)))}`).join('\n\n')}\n`;
  for (const p of DOCS) write(local(docPath(p.slug)).replace(/^\//, "").replace(/\/$/, ".md"), source(p, lang));

  const groups = [...new Set(DOCS.map((p) => p.group))];
  write(
    output("llms.txt"),
    `# Tunnel Agent

> ${t.seo.description}

${lang === "es" ? `Tunnel Agent ${VERSION} es gratuito y de código abierto con licencia MIT. Hay versiones para Windows, macOS y Linux en GitHub Releases.` : `Tunnel Agent ${VERSION} is free and open source under the MIT license. Builds for Windows, macOS and Linux are on GitHub Releases.`}

${t.faq.items[1].answer}\n\n${t.faq.items[4].answer}\n\n${t.download.note}

## ${lang === "es" ? "Información del producto" : "Product overview"}

- [${lang === "es" ? "Página principal" : "Landing page"}](${abs(local('/'))})
- [${t.faq.eyebrow}](${abs(local('/overview.md'))})
- [${lang === "es" ? "Documentación completa" : "Full documentation"}](${abs(local('/llms-full.txt'))})

${groups
    .map(
      (g) =>
        `## ${g}\n\n${DOCS.filter((p) => p.group === g)
          .map((p) => `- [${p.title}](${abs(local(docPath(p.slug).replace(/\/$/, ".md")))}): ${p.description}`)
          .join("\n")}`,
    )
    .join("\n\n")}

## ${lang === "es" ? "Opcional" : "Optional"}

- [${lang === "es" ? "Código fuente" : "Source code"}](${REPO_URL})
- [Releases](${RELEASES_URL})
- [English](${abs('/llms.txt')})
- [Español](${abs('/es/llms.txt')})
`,
  );
  write(output("overview.md"), facts);
  write(output("llms-full.txt"), `${facts}\n---\n\n${DOCS.map((p) => source(p, lang)).join("\n---\n\n")}`);
}

fs.rmSync(path.join(site, "dist-ssr"), { recursive: true, force: true });
console.log(`prerendered ${routes.length + 1} pages, sitemap with ${entries.length} URLs`);
