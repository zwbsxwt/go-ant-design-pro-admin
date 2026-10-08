import { describe, expect, it } from 'vitest';
import { createAgentEventParser, parseAgentEventFrame } from './index';

describe('Harness SSE parser', () => {
  it('parses CRLF frames and data fields without a required space', () => {
    expect(parseAgentEventFrame('event: agent\r\ndata:{"sessionId":"s","runId":"r","seq":1,"type":"status","status":"running"}')).toMatchObject({
      sessionId: 's',
      runId: 'r',
      type: 'status',
      status: 'running',
    });
  });

  it('handles delimiters split across network chunks', () => {
    const events: ReturnType<typeof parseAgentEventFrame>[] = [];
    const parser = createAgentEventParser((event) => events.push(event));
    parser.push('event: agent\r\ndata: {"sessionId":"s","runId":"r","seq":1,"type":"assistant_chunk","content":"你"}\r');
    parser.push('\n\r\ndata: {"sessionId":"s","runId":"r","seq":2,"type":"done","reason":"completed"}\n\n');
    parser.finish();
    expect(events).toHaveLength(2);
    expect(events[0]?.content).toBe('你');
    expect(events[1]?.type).toBe('done');
  });

  it('ignores heartbeat comments without consuming an event', () => {
    const events: ReturnType<typeof parseAgentEventFrame>[] = [];
    const parser = createAgentEventParser((event) => events.push(event));
    parser.push(': heartbeat\n\n');
    parser.push('event: agent\ndata: {"sessionId":"s","runId":"r","seq":4,"type":"tool_call","callId":"c","name":"web_search"}\n\n');
    parser.finish();
    expect(events).toHaveLength(1);
    expect(events[0]?.callId).toBe('c');
  });
});
