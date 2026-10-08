import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownCode } from './MarkdownContent';

const codeToHtml = vi.hoisted(() => vi.fn());
const createHighlighterCore = vi.hoisted(() => vi.fn(async () => ({ codeToHtml })));

vi.mock('@shikijs/core', () => ({ createHighlighterCore }));
vi.mock('@shikijs/engine-javascript', () => ({ createJavaScriptRegexEngine: vi.fn(() => ({ kind: 'javascript' })) }));

describe('Harness Markdown code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    codeToHtml.mockResolvedValue('<pre class="shiki"><code><span>const answer = 42;</span></code></pre>');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('highlights a completed fenced block and copies its source', async () => {
    render(<MarkdownCode block lang="ts" streamStatus="done" domNode={{} as never}>{'const answer = 42;\n'}</MarkdownCode>);

    await waitFor(() => expect(codeToHtml).toHaveBeenCalledWith('const answer = 42;', { lang: 'typescript', theme: 'github-light-default' }));
    expect(await screen.findByText('const answer = 42;')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '复制代码' }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const answer = 42;'));
  });

  it('keeps streaming fenced code as plain text until the block settles', () => {
    render(<MarkdownCode block lang="python" streamStatus="loading" domNode={{} as never}>print('hi')</MarkdownCode>);
    expect(screen.getByText("print('hi')")).toBeInTheDocument();
    expect(codeToHtml).not.toHaveBeenCalled();
  });

  it('normalizes supported language aliases before highlighting', async () => {
    render(<MarkdownCode block lang="ps1" streamStatus="done" domNode={{} as never}>{'Get-Process'}</MarkdownCode>);
    await waitFor(() => expect(codeToHtml).toHaveBeenCalledWith('Get-Process', { lang: 'powershell', theme: 'github-light-default' }));
  });

  it('safely renders unknown fenced languages as text', async () => {
    render(<MarkdownCode block lang="unknown-stock-dsl" streamStatus="done" domNode={{} as never}>{'BUY 600000'}</MarkdownCode>);
    await waitFor(() => expect(codeToHtml).toHaveBeenCalledWith('BUY 600000', { lang: 'text', theme: 'github-light-default' }));
  });
});
