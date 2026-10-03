export type DocPage = {
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  body: string;
  /** Source path relative to the repository root. */
  path: string;
};

const FILES = import.meta.glob<string>('../../content/docs/*.md', { query: '?raw', import: 'default', eager: true });

function parse(file: string, raw: string): DocPage {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  const meta: Record<string, string> = {};
  for (const line of (m?.[1] ?? '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const rest = raw.slice(m ? m[0].length : 0).trimStart();
  const h1 = /^# (.+)\n/.exec(rest);
  return {
    slug: file.split('/').pop()!.replace(/\.md$/, ''),
    title: h1?.[1] ?? '',
    description: meta.description ?? '',
    group: meta.group ?? '',
    order: Number(meta.order ?? 0),
    body: h1 ? rest.slice(h1[0].length) : rest,
    path: `site/content/docs/${file.split('/').pop()}`,
  };
}

export const DOCS: DocPage[] = Object.entries(FILES)
  .map(([f, raw]) => parse(f, raw))
  .sort((a, b) => a.order - b.order);

export const DOC_GROUPS = [...new Set(DOCS.map((p) => p.group))];

export const headingSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>|`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
