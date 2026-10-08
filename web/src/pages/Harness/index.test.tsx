import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Harness from './index';

const serviceMocks = vi.hoisted(() => ({
  listSessions: vi.fn(),
  listWorkspaces: vi.fn(),
  getCapabilities: vi.fn(),
  createSession: vi.fn(),
  assignWorkspace: vi.fn(),
  updatePreferences: vi.fn(),
  sendMessage: vi.fn(),
  openEvents: vi.fn(),
  cancelMessage: vi.fn(),
  createWorkspace: vi.fn(),
  deleteSession: vi.fn(),
  deleteWorkspace: vi.fn(),
  renameSession: vi.fn(),
}));

vi.mock('@umijs/max', () => ({ useAccess: () => ({ canSendHarnessMessage: true }) }));
vi.mock('@ant-design/x-markdown', () => ({ default: ({ content }: { content: string }) => <span>{content}</span> }));
vi.mock('@ant-design/x', () => ({
  Bubble: ({ content }: { content: React.ReactNode }) => <div>{content}</div>,
  Sender: ({ value, onChange, onSubmit, disabled, footer }: any) => (
    <div>
      <textarea aria-label="Harness 输入" value={value} onChange={(event) => onChange(event.target.value)} />
      {footer(<button type="button" disabled={disabled} onClick={onSubmit}>发送</button>)}
    </div>
  ),
}));
vi.mock('@/services/harness', () => serviceMocks);

describe('Harness draft conversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    serviceMocks.listSessions.mockResolvedValue({ data: [] });
    serviceMocks.listWorkspaces.mockResolvedValue({ data: [] });
    serviceMocks.getCapabilities.mockResolvedValue({ modes: [{ id: 'standard', enabled: true }], models: [{ id: 'test-model', label: 'test-model' }, { id: 'test-model-2', label: 'test-model-2' }], reasoningEfforts: ['off', 'low', 'high', 'max'], defaultModel: 'test-model', defaultReasoningEffort: 'high' });
    serviceMocks.createSession.mockResolvedValue({ id: 'session-1', title: '新建会话', status: 'idle', messages: [], mode: 'standard', model: 'test-model', reasoningEffort: 'high' });
    serviceMocks.updatePreferences.mockResolvedValue({});
    serviceMocks.sendMessage.mockResolvedValueOnce({ sessionId: 'session-1', runId: 'run-1' }).mockResolvedValueOnce({ sessionId: 'session-1', runId: 'run-2' });
  });

  it('uses the compact workspace toolbar and expands search beside directory actions', async () => {
    render(<App><Harness /></App>);

    await waitFor(() => expect(serviceMocks.listSessions).toHaveBeenCalledTimes(1));
    expect(serviceMocks.listSessions).toHaveBeenCalledWith({ kind: 'general' });
    expect(screen.queryByRole('heading', { name: '对话' })).not.toBeInTheDocument();
    expect(screen.queryByText('对话')).not.toBeInTheDocument();

    const searchButton = screen.getByRole('button', { name: '搜索会话' });
    const addWorkspaceButton = screen.getByRole('button', { name: '新建工作区' });
    expect(searchButton.compareDocumentPosition(addWorkspaceButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(searchButton);
    expect(screen.getByPlaceholderText('搜索会话和消息')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭搜索' })).toBeInTheDocument();
  });

  it('shows only the hovered turn in a frameless floating preview rail and keeps click-to-jump', async () => {
    serviceMocks.listSessions.mockResolvedValue({
      data: [{
        id: 'session-preview',
        title: '股票研究',
        status: 'idle',
        mode: 'standard',
        model: 'test-model',
        reasoningEffort: 'high',
        messages: [
          { role: 'user', content: '第一轮用户问题' },
          { role: 'assistant', content: '第一轮助手回答' },
          { role: 'user', content: '第二轮用户问题' },
          { role: 'assistant', content: '第二轮助手回答' },
        ],
      }],
    });

    render(<App><Harness /></App>);

    const marks = await screen.findAllByRole('button', { name: /^预览第/ });
    expect(marks).toHaveLength(2);
    expect(screen.queryByText('会话预览')).not.toBeInTheDocument();
    expect(screen.getByLabelText('工作区与会话')).not.toContainElement(screen.getByLabelText('会话消息'));
    expect(screen.getByLabelText('会话消息')).toHaveAttribute('tabindex', '0');

    fireEvent.mouseEnter(marks[0]);
    const firstPreview = await screen.findByTestId('turn-preview-0');
    expect(firstPreview).toHaveTextContent('第一轮用户问题');
    expect(firstPreview).toHaveTextContent('第一轮助手回答');
    expect(screen.queryByTestId('turn-preview-2')).not.toBeInTheDocument();

    fireEvent.click(marks[0]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('keeps the first message and stream alive when a draft becomes a real session', async () => {
    const streams: Array<(event: any) => void> = [];
    serviceMocks.openEvents.mockImplementation((_id, onEvent) => { streams.push(onEvent); return vi.fn(); });
    render(<App><Harness /></App>);

    await waitFor(() => expect(serviceMocks.listSessions).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /开启新会话/ }));
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '扩展能力暂未开放' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /模型 test-model，推理等级 High/ })).toBeEnabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Harness 输入' }), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => expect(serviceMocks.openEvents).toHaveBeenCalledTimes(1));
    expect(serviceMocks.updatePreferences).toHaveBeenCalledWith('session-1', 'standard', 'test-model', 'high');
    expect(serviceMocks.sendMessage).toHaveBeenCalledWith('session-1', 'hi', 'standard', 'test-model', 'high');
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /模型 test-model，推理等级 High/ })).toBeDisabled();
    expect(screen.getAllByText('hi').length).toBeGreaterThan(0);
    expect(serviceMocks.listSessions).toHaveBeenCalledTimes(1);

    act(() => { streams[0]({ sessionId: 'session-1', runId: 'run-1', seq: 1, type: 'assistant_reasoning_chunk', content: '先理解问题，再组织答案。' }); });
    expect(screen.getByRole('group', { name: '思考中' })).not.toHaveAttribute('open');
    expect(screen.getByTestId('reasoning-live-preview')).toHaveTextContent('先理解问题，再组织答案。');

    act(() => {
      streams[0]({ sessionId: 'session-1', runId: 'run-1', seq: 2, type: 'assistant_chunk', content: '第一轮回复' });
      streams[0]({ sessionId: 'session-1', runId: 'run-1', seq: 3, type: 'done', reason: 'completed' });
    });
    expect(await screen.findByText('第一轮回复')).toBeInTheDocument();
    const reasoning = screen.getByRole('group', { name: '已思考' });
    expect(reasoning).not.toHaveAttribute('open');
    expect(screen.queryByTestId('reasoning-live-preview')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('已思考'));
    expect(reasoning).toHaveAttribute('open');
    expect(screen.getByText('先理解问题，再组织答案。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /模型 test-model，推理等级 High/ })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /模型 test-model，推理等级 High/ }));
    fireEvent.click(await screen.findByRole('button', { name: /模型 test-model right/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'test-model-2' }));
    await waitFor(() => expect(serviceMocks.updatePreferences).toHaveBeenCalledWith('session-1', 'standard', 'test-model-2', 'high'));
    fireEvent.click(screen.getByRole('button', { name: /模型 test-model-2，推理等级 High/ }));
    fireEvent.click((await screen.findAllByRole('button', { name: /推理等级.*High/ }))[1]);
    fireEvent.click(await screen.findByRole('button', { name: '推理 Low' }));
    await waitFor(() => expect(serviceMocks.updatePreferences).toHaveBeenCalledWith('session-1', 'standard', 'test-model-2', 'low'));

    fireEvent.change(screen.getByRole('textbox', { name: 'Harness 输入' }), { target: { value: '继续' } });
    fireEvent.click(screen.getByRole('button', { name: '发送' }));
    await waitFor(() => expect(serviceMocks.sendMessage).toHaveBeenCalledTimes(2));
    expect(serviceMocks.sendMessage).toHaveBeenLastCalledWith('session-1', '继续', 'standard', 'test-model-2', 'low');
    await waitFor(() => expect(serviceMocks.openEvents).toHaveBeenCalledTimes(2));
    act(() => {
      streams[1]({ sessionId: 'session-1', runId: 'run-2', seq: 4, type: 'assistant_chunk', content: '第二轮回复' });
      streams[1]({ sessionId: 'session-1', runId: 'run-2', seq: 5, type: 'done', reason: 'completed' });
    });
    expect(await screen.findByText('第二轮回复')).toBeInTheDocument();
    expect(serviceMocks.listSessions).toHaveBeenCalledTimes(1);
  });
});
