import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ToolProcess from './ToolProcess';

describe('Harness tool process', () => {
  it('shows a search query and expands normalized input and result', () => {
    render(<ToolProcess running tools={[{
      callId: 'call-1', rootCallId: 'call-1', name: 'web_search',
      arguments: { query: 'A股机器人板块' }, content: '三条搜索结果',
      source: 'standard', status: 'completed', isError: false,
    }]} />);
    expect(screen.getByText('已完成搜索')).toBeInTheDocument();
    expect(screen.getByText('A股机器人板块')).toBeInTheDocument();
    fireEvent.click(screen.getByText('已完成搜索'));
    expect(screen.getByText(/"query": "A股机器人板块"/)).toBeInTheDocument();
    expect(screen.getByText('三条搜索结果')).toBeInTheDocument();
  });

  it('marks a nested PTC tool as running', () => {
    render(<ToolProcess running tools={[{
      callId: 'child', rootCallId: 'root', parentCallId: 'root', name: 'read_url',
      arguments: { url: 'https://example.com' }, source: 'ptc', status: 'running',
    }]} />);
    expect(screen.getByText('正在调用')).toBeInTheDocument();
    expect(screen.getByText('PTC')).toBeInTheDocument();
  });
});
