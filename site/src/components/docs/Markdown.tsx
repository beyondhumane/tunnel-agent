import { Check, Copy, Info, TriangleAlert } from 'lucide-react';
import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { headingSlug } from '@/lib/docs';
import { useI18n } from '@/lib/i18n';

/** Doc-to-doc links are written as `agents.md#section` in the sources. */
function DocLink({ target, children }: { target: string; children: ReactNode }) {
  const { url } = useI18n();
  const doc = /^([a-z0-9-]+)\.md(#[a-z0-9-]+)?$/.exec(target);
  const href = doc ? url(`/docs/${doc[1]}/${doc[2] ?? ''}`) : target;
  return <a href={href} {...(/^https?:/.test(href) ? { target: '_blank', rel: 'noreferrer' } : {})}>{children}</a>;
}

function inline(tokens: Token[] = []): ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.type) {
      case 'strong':
        return <strong key={i}>{inline((t as Tokens.Strong).tokens)}</strong>;
      case 'em':
        return <em key={i}>{inline((t as Tokens.Em).tokens)}</em>;
      case 'codespan':
        return <code key={i}>{decode((t as Tokens.Codespan).text)}</code>;
      case 'link': {
        const l = t as Tokens.Link;
        return (
          <DocLink key={i} target={l.href}>
            {inline(l.tokens)}
          </DocLink>
        );
      }
      case 'br':
        return <br key={i} />;
      case 'text':
        return 'tokens' in t && t.tokens ? <span key={i}>{inline(t.tokens)}</span> : decode((t as Tokens.Text).text);
      case 'escape':
        return (t as Tokens.Escape).text;
      default:
        // Raw HTML in the sources is shown as text, never injected.
        return t.raw;
    }
  });
}

const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();
  return (
    <pre data-lang={lang || undefined}>
      <button
        type="button"
        className="copy"
        aria-label={t.docs.copy}
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <code>{code}</code>
    </pre>
  );
}

function Heading({ depth, id, children }: { depth: number; id: string; children: ReactNode }) {
  const { t } = useI18n();
  const H = depth <= 2 ? 'h2' : 'h3';
  return (
    <H id={id}>
      {children}
      <a href={`#${id}`} className="anchor" aria-label={t.docs.anchor}>
        #
      </a>
    </H>
  );
}

function block(t: Token, key: number): ReactNode {
  switch (t.type) {
    case 'heading': {
      const h = t as Tokens.Heading;
      return (
        <Heading key={key} depth={h.depth} id={headingSlug(h.text)}>
          {inline(h.tokens)}
        </Heading>
      );
    }
    case 'paragraph':
      return <p key={key}>{inline((t as Tokens.Paragraph).tokens)}</p>;
    case 'text': {
      const tx = t as Tokens.Text;
      return <span key={key}>{tx.tokens ? inline(tx.tokens) : decode(tx.text)}</span>;
    }
    case 'code': {
      const c = t as Tokens.Code;
      return <CodeBlock key={key} code={c.text} lang={c.lang} />;
    }
    case 'table': {
      const tb = t as Tokens.Table;
      return (
        <div key={key} className="table-wrap">
          <table>
            <thead>
              <tr>
                {tb.header.map((c, i) => (
                  <th key={i}>{inline(c.tokens)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tb.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{inline(c.tokens)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'list': {
      const l = t as Tokens.List;
      const items = l.items.map((item, i) => <li key={i}>{item.tokens.map(block)}</li>);
      return l.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>;
    }
    case 'blockquote': {
      const text = (t as Tokens.Blockquote).text;
      const m = /^\[!(NOTE|TIP|WARNING)\]\s*\n?/.exec(text);
      const kind = m?.[1] === 'WARNING' ? 'warning' : 'note';
      const body = marked.lexer(m ? text.slice(m[0].length) : text);
      const Icon = kind === 'warning' ? TriangleAlert : Info;
      return (
        <blockquote key={key} className={kind}>
          {m && (
            <p className="callout-title">
              <Icon className="size-4" /> <CalloutTitle kind={m[1]} />
            </p>
          )}
          {body.map(block)}
        </blockquote>
      );
    }
    case 'hr':
      return <hr key={key} />;
    default:
      return null;
  }
}

function CalloutTitle({ kind }: { kind: string }) {
  const { t } = useI18n();
  return kind === 'TIP' ? t.docs.tip : kind === 'WARNING' ? t.docs.warning : t.docs.note;
}

export function Markdown({ source }: { source: string }) {
  return <>{marked.lexer(source).map(block)}</>;
}

export function outline(source: string): { id: string; text: string; depth: number }[] {
  return marked
    .lexer(source)
    .filter((t): t is Tokens.Heading => t.type === 'heading' && t.depth >= 2 && t.depth <= 3)
    .map((h) => ({ id: headingSlug(h.text), text: h.text.replace(/`/g, ''), depth: h.depth }));
}
