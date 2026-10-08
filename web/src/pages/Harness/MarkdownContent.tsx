import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import { createHighlighterCore, type HighlighterCore } from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import styles from './style.less';

const SHIKI_THEME = 'github-light-default';
const supportedLanguages = new Set([
  'bash',
  'diff',
  'docker',
  'go',
  'javascript',
  'json',
  'jsx',
  'markdown',
  'powershell',
  'python',
  'sql',
  'text',
  'tsx',
  'typescript',
  'yaml',
]);

let highlighterPromise: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [import('@shikijs/themes/github-light-default')],
    langs: [
      import('@shikijs/langs/bash'),
      import('@shikijs/langs/diff'),
      import('@shikijs/langs/docker'),
      import('@shikijs/langs/go'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/markdown'),
      import('@shikijs/langs/powershell'),
      import('@shikijs/langs/python'),
      import('@shikijs/langs/sql'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/yaml'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (React.isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return '';
}

function normalizeLanguage(lang?: string): string {
  const value = (lang || 'text').trim().toLowerCase().split(/\s+/)[0] || 'text';
  const aliases: Record<string, string> = {
    dockerfile: 'docker',
    md: 'markdown',
    plaintext: 'text',
    ps1: 'powershell',
    py: 'python',
    shell: 'bash',
    shellscript: 'bash',
    sh: 'bash',
    js: 'javascript',
    ts: 'typescript',
    txt: 'text',
    yml: 'yaml',
  };
  const normalized = aliases[value] || value;
  return supportedLanguages.has(normalized) ? normalized : 'text';
}

export const MarkdownCode: React.FC<ComponentProps> = ({ children, block, lang, streamStatus }) => {
  const code = useMemo(() => nodeText(children).replace(/\n$/, ''), [children]);
  const language = normalizeLanguage(lang);
  const [highlighted, setHighlighted] = useState<string>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!block || streamStatus === 'loading' || !code) {
      setHighlighted(undefined);
      return undefined;
    }
    let active = true;
    void getHighlighter()
      .then((highlighter) => highlighter.codeToHtml(code, { lang: language, theme: SHIKI_THEME }))
      .then((html) => { if (active) setHighlighted(html); })
      .catch(() => { if (active) setHighlighted(undefined); });
    return () => { active = false; };
  }, [block, code, language, streamStatus]);

  if (!block) return <code className={styles.inlineCode}>{children}</code>;

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return <div className={styles.codeBlock} data-language={language}>
    <div className={styles.codeHeader}><span>{language}</span><button type="button" onClick={() => { void copy(); }} aria-label="复制代码">{copied ? <CheckOutlined /> : <CopyOutlined />}{copied ? '已复制' : '复制'}</button></div>
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates escaped, local highlighter HTML from the already extracted code text. */}
    {highlighted ? <div className={styles.highlightedCode} dangerouslySetInnerHTML={{ __html: highlighted }} /> : <pre className={styles.plainCode}><code>{code}</code></pre>}
  </div>;
};

const MarkdownTable: React.FC<ComponentProps> = ({ children }) => <div className={styles.tableScroll}><table>{children}</table></div>;

const markdownComponents = { code: MarkdownCode, table: MarkdownTable };

const MarkdownContent: React.FC<{ content: string; streaming?: boolean; compact?: boolean }> = ({ content, streaming = false, compact = false }) => (
  <XMarkdown
    content={content}
    components={markdownComponents}
    disableDefaultStyles
    escapeRawHtml={false}
    openLinksInNewTab
    streaming={{ hasNextChunk: streaming, enableAnimation: false }}
    rootClassName={`${styles.markdown} ${compact ? styles.markdownCompact : ''}`}
  />
);

export default MarkdownContent;
