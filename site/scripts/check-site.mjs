import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(site, 'dist');
const read = (rel) => fs.readFileSync(path.join(dist, rel), 'utf8');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
const links = (html) => [...html.matchAll(/<link\b[^>]*>/g)].map((m) => attributes(m[0]));
const canonical = (html) => links(html).filter((l) => l.rel === 'canonical');
const home = read('index.html');
const root = new URL(canonical(home)[0].href);
const base = root.pathname;
const fileFor = (url) => {
  assert.equal(url.origin, root.origin);
  assert.ok(url.pathname.startsWith(base), url.href);
  const rel = decodeURIComponent(url.pathname.slice(base.length));
  return path.join(dist, rel, url.pathname.endsWith('/') ? 'index.html' : '');
};
const slugs = fs.readdirSync(path.join(site, 'content/docs')).filter((p) => p.endsWith('.md')).map((p) => p.replace(/\.md$/, ''));
const locations = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
assert.equal(new Set(locations).size, locations.length);
assert.equal(locations.length, (slugs.length + 1) * 2);
const titles = new Set();
let checkedLinks = 0;

for (const lang of ['en', 'es']) {
  const prefix = lang === 'es' ? 'es/' : '';
  for (const slug of slugs) {
    if (lang === 'es') assert.ok(fs.existsSync(path.join(site, 'content/docs/es', `${slug}.md`)), `Missing translation: ${slug}`);
  }
  for (const rel of ['', ...slugs.map((slug) => `docs/${slug}/`)]) {
    const html = read(`${prefix}${rel}index.html`);
    const expected = new URL(`${prefix}${rel}`, root).href;
    assert.ok(locations.includes(expected), expected);
    assert.ok(html.includes(`<html lang="${lang}">`), expected);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, expected);
    assert.equal(canonical(html).length, 1, expected);
    assert.equal(canonical(html)[0].href, expected);
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    assert.ok(title && !titles.has(title), `Missing/duplicate title: ${expected}`);
    titles.add(title);
    const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => attributes(m[0]));
    assert.ok(meta.some((m) => m.name === 'description' && m.content), expected);
    assert.ok(!meta.some((m) => m.name === 'robots' && m.content.includes('noindex')), expected);
    assert.equal(meta.find((m) => m.property === 'og:url')?.content, expected);
    const alternates = links(html).filter((l) => l.rel === 'alternate');
    assert.equal(alternates.length, 3, expected);
    for (const [language, p] of [['en', ''], ['es', 'es/'], ['x-default', '']]) {
      assert.equal(alternates.find((a) => a.hreflang === language)?.href, new URL(`${p}${rel}`, root).href, expected);
    }
    const json = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
    assert.ok(json, expected);
    const graph = JSON.parse(json)['@graph'];
    if (!rel) {
      assert.equal(graph.find((g) => g['@type'] === 'SoftwareApplication').offers.price, '0');
      const faq = graph.find((g) => g['@type'] === 'FAQPage');
      assert.equal(faq.inLanguage, lang);
      assert.equal(faq.mainEntity.length, 7);
      for (const item of faq.mainEntity) {
        assert.ok(decode(html).includes(item.name), item.name);
        assert.ok(decode(html).includes(item.acceptedAnswer.text), item.name);
      }
      const downloads = new Set([...html.matchAll(/href="(https:\/\/github.com\/beyondhumane\/tunnel-agent\/releases\/download\/[^" ]+)"/g)].map((m) => m[1]));
      assert.equal(downloads.size, 12, expected);
      assert.ok(!html.includes('undefined'), expected);
    } else {
      const article = graph.find((g) => g['@type'] === 'TechArticle');
      assert.equal(article.inLanguage, lang);
      assert.equal(article.url, expected);
      assert.equal(article.headline, decode(title).split(' · ')[0]);
    }
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]*)"/g)) {
      const target = new URL(decode(match[1]), expected);
      if (target.origin !== root.origin) continue;
      const file = fileFor(target);
      assert.ok(fs.existsSync(file), `Broken link: ${expected} -> ${target.href}`);
      if (target.hash && file.endsWith('.html')) {
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(read(path.relative(dist, file)).includes(`id="${id}"`), `Missing anchor: ${target.href}`);
      }
      checkedLinks++;
    }
  }
  const alias = read(`${prefix}docs/index.html`);
  assert.equal(canonical(alias)[0].href, new URL(`${prefix}docs/introduction/`, root).href);
  for (const file of ['llms.txt', 'llms-full.txt', 'overview.md', ...slugs.map((slug) => `docs/${slug}.md`)]) {
    const body = read(`${prefix}${file}`);
    assert.ok(body.length > 100, file);
    for (const match of body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
      const target = new URL(match[1]);
      if (target.origin === root.origin) assert.ok(fs.existsSync(fileFor(target)), `Broken machine-readable link: ${target.href}`);
    }
  }
}
assert.ok(read('robots.txt').includes(`Sitemap: ${new URL('sitemap.xml', root).href}`));
assert.ok(/name="robots" content="noindex"/.test(read('404.html')));
assert.equal(canonical(read('404.html')).length, 0);
console.log(`Static SEO checks passed: ${locations.length} canonical pages, both docs aliases, ${checkedLinks} internal links, JSON-LD and EN/ES knowledge files.`);
