import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

test('sitemap dates follow localized and shared landing sources, not unrelated content or shallow boundaries', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tunnel-agent-sitemap-'));
  const root = path.join(tmp, 'repo');
  const write = (rel, body) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  };
  const git = (args, env = {}) => execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, GIT_AUTHOR_NAME: 'Sitemap Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Sitemap Test', GIT_COMMITTER_EMAIL: 'test@example.com', ...env },
  });
  const commit = (rel, day) => {
    write(rel, `${day}\n`);
    git(['add', rel]);
    const date = `2025-01-${day}T12:00:00Z`;
    git(['commit', '-m', `test: change ${rel}`], { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
  };
  const renderer = fileURLToPath(new URL('./prerender.mjs', import.meta.url));
  const prepare = (dir) => {
    fs.mkdirSync(path.join(dir, 'site/dist-ssr'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'site/dist'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'site/dist/index.html'), '<html lang="en"><head><!--app-head--></head><body><div id="root"><!--app-html--></div></body></html>');
    fs.writeFileSync(path.join(dir, 'site/dist-ssr/entry-server.js'), `
      exports.LANGS = ['en', 'es'];
      exports.docsFor = () => [];
      exports.dict = () => ({ seo: { description: 'Test' }, faq: { items: Array.from({length: 5}, () => ({ question: 'Question', answer: 'Answer', doc: 'introduction' })), more: 'More', eyebrow: 'FAQ' }, download: { note: 'Test' } });
      exports.docPath = (slug) => '/docs/' + slug + '/';
      exports.localizedPath = (p, lang) => lang === 'es' ? '/es' + p : p;
      exports.url = (p) => p;
      exports.abs = (p) => 'https://example.com' + p;
      exports.paths = () => ['/', '/es/'];
      exports.render = (p) => ({html: 'Test', head: '', lang: p.startsWith('/es/') ? 'es' : 'en'});
    `);
  };
  const dates = (dir = root) => {
    prepare(dir);
    execFileSync(process.execPath, [path.join(dir, 'site/scripts/prerender.mjs')], { stdio: 'pipe' });
    return [...fs.readFileSync(path.join(dir, 'site/dist/sitemap.xml'), 'utf8').matchAll(/<url><loc>[^<]+<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)].map((m) => m[1]);
  };
  try {
    fs.mkdirSync(root);
    git(['init']);
    write('site/scripts/prerender.mjs', fs.readFileSync(renderer, 'utf8'));
    git(['add', 'site/scripts/prerender.mjs']);
    git(['commit', '-m', 'test: add renderer'], { GIT_AUTHOR_DATE: '2025-01-01T12:00:00Z', GIT_COMMITTER_DATE: '2025-01-01T12:00:00Z' });
    commit('site/src/i18n/en.ts', '02');
    commit('site/src/i18n/es.ts', '03');
    assert.deepEqual(dates(), ['2025-01-02', '2025-01-03']);
    commit('site/src/components/landing/Landing.tsx', '04');
    assert.deepEqual(dates(), ['2025-01-04', '2025-01-04']);
    commit('site/src/lib/site.ts', '05');
    assert.deepEqual(dates(), ['2025-01-05', '2025-01-05']);
    commit('site/src/lib/seo.ts', '06');
    assert.deepEqual(dates(), ['2025-01-06', '2025-01-06']);
    commit('site/src/i18n/es.ts', '07');
    assert.deepEqual(dates(), ['2025-01-06', '2025-01-07']);
    commit('src/TunnelAgent.Avalonia/TunnelAgent.Avalonia.csproj', '08');
    assert.deepEqual(dates(), ['2025-01-08', '2025-01-08']);
    commit('site/content/docs/introduction.md', '09');
    assert.deepEqual(dates(), ['2025-01-08', '2025-01-08']);
    const shallow = path.join(tmp, 'shallow');
    git(['clone', '--depth=1', pathToFileURL(root).href, shallow]);
    assert.deepEqual(dates(shallow), [undefined, undefined]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
