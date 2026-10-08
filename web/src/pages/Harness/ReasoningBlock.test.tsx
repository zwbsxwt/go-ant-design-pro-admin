import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReasoningBlock, { latestReasoningPreview } from './ReasoningBlock';

describe('Harness reasoning block', () => {
  it('shows the latest reasoning in a compact live preview', () => {
    expect(latestReasoningPreview(`${'早期内容'.repeat(50)}最新判断`)).toMatch(/^….*最新判断$/);
    render(<ReasoningBlock content="先检查数据，再比较估值。" running />);
    expect(screen.getByTestId('reasoning-live-preview')).toHaveTextContent('先检查数据，再比较估值。');
  });

  it('keeps full reasoning expandable while running and collapses it on completion', async () => {
    const { rerender } = render(<ReasoningBlock content="第一步分析。" running />);
    const reasoning = screen.getByRole('group', { name: '思考中' });
    fireEvent.click(screen.getByText('思考中'));
    expect(reasoning).toHaveAttribute('open');

    rerender(<ReasoningBlock content="第一步分析。第二步验证。" running />);
    expect(reasoning).toHaveAttribute('open');
    rerender(<ReasoningBlock content="第一步分析。第二步验证。" running={false} />);

    await waitFor(() => expect(screen.getByRole('group', { name: '已思考' })).not.toHaveAttribute('open'));
    expect(screen.queryByTestId('reasoning-live-preview')).not.toBeInTheDocument();
  });

  it('merges reasoning and tool calls into one expandable process block', () => {
    render(<ReasoningBlock content="先分析问题。" tools={[{
      callId: 'call-1', rootCallId: 'call-1', name: 'web_search',
      arguments: { query: 'A股市场' }, content: '搜索结果',
      source: 'standard', status: 'completed', isError: false,
    }]} />);

    const process = screen.getByRole('group', { name: '已思考' });
    expect(process).toContainElement(screen.getByLabelText('工具执行步骤'));
    fireEvent.click(screen.getByText('已思考'));
    expect(screen.getByText('已完成搜索')).toBeInTheDocument();
    expect(screen.getByText('A股市场')).toBeInTheDocument();
  });

  it('renders a process block when only tool calls are available', () => {
    render(<ReasoningBlock tools={[{
      callId: 'call-only', rootCallId: 'call-only', name: 'read_file',
      arguments: { path: 'report.md' }, source: 'standard', status: 'running',
    }]} running />);

    expect(screen.getByRole('group', { name: '思考中' })).toBeInTheDocument();
    expect(screen.getByText('正在调用')).toBeInTheDocument();
  });
});
