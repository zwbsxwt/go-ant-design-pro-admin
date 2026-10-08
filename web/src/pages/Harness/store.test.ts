import { describe, expect, it } from 'vitest';
import { reduceAgentEvent } from './store';

describe('Harness event store', () => {
  it('accumulates chunks only for their session and handles terminal states', () => {
    const initial = [{ id: 'a', title: 'A', status: 'running', messages: [] }, { id: 'b', title: 'B', status: 'idle', messages: [] }];
    const withChunk = reduceAgentEvent(initial, { sessionId: 'a', runId: 'r', seq: 1, type: 'assistant_chunk', content: '你好' });
    expect(withChunk[0].messages[0].content).toBe('你好');
    expect(withChunk[1].messages).toHaveLength(0);
    expect(reduceAgentEvent(withChunk, { sessionId: 'a', runId: 'r', seq: 2, type: 'done', reason: 'completed' })[0].status).toBe('idle');
  });

  it('ignores replayed SSE events', () => {
    const initial = [{ id: 'a', title: 'A', status: 'running', messages: [] }];
    const event = { sessionId: 'a', runId: 'r', seq: 3, type: 'assistant_chunk', content: '一次' };
    const once = reduceAgentEvent(initial, event);
    const replayed = reduceAgentEvent(once, event);
    expect(replayed[0].messages).toEqual([{ role: 'assistant', content: '一次' }]);
  });

  it('pairs standard and PTC tool lifecycle events by call id', () => {
    const initial = [{ id: 'a', title: 'A', status: 'running', messages: [] }];
    const called = reduceAgentEvent(initial, { sessionId: 'a', runId: 'r', seq: 1, type: 'tool_call', callId: 'root', name: 'web_search', arguments: { query: '机器人板块' }, status: 'running', source: 'standard' });
    const nested = reduceAgentEvent(called, { sessionId: 'a', runId: 'r', seq: 2, type: 'tool_call', callId: 'child', rootCallId: 'root', parentCallId: 'root', name: 'read_url', arguments: { url: 'https://example.com' }, status: 'running', source: 'ptc' });
    const completed = reduceAgentEvent(nested, { sessionId: 'a', runId: 'r', seq: 3, type: 'tool_result', callId: 'root', name: 'tool', content: '搜索结果', isError: false, status: 'completed', source: 'standard' });
    expect(completed[0].messages[0].tools).toMatchObject([
      { callId: 'root', name: 'web_search', arguments: { query: '机器人板块' }, content: '搜索结果', status: 'completed' },
      { callId: 'child', parentCallId: 'root', name: 'read_url', status: 'running', source: 'ptc' },
    ]);
  });

  it('keeps an error terminal state failed', () => {
    const initial = [{ id: 'a', title: 'A', status: 'running', messages: [] }];
    const failed = reduceAgentEvent(initial, { sessionId: 'a', runId: 'r', seq: 1, type: 'done', reason: 'error' });
    expect(failed[0].status).toBe('failed');
  });
});
