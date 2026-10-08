import type { AgentEvent, HarnessMessage, HarnessSession, ToolStep } from '@/services/harness';

function assistantMessage(messages: HarnessMessage[]): HarnessMessage {
  const last = messages[messages.length - 1];
  if (last?.role === 'assistant') return last;
  const created: HarnessMessage = { role: 'assistant', content: '' };
  messages.push(created);
  return created;
}

function mergeTool(message: HarnessMessage, event: AgentEvent) {
  if (!event.callId) return;
  const tools = [...(message.tools || [])];
  const index = tools.findIndex((item) => item.callId === event.callId);
  const previous = index >= 0 ? tools[index] : undefined;
  const tool: ToolStep = {
    callId: event.callId,
    rootCallId: event.rootCallId || previous?.rootCallId || event.callId,
    parentCallId: event.parentCallId ?? previous?.parentCallId,
    name: event.name && event.name !== 'tool' ? event.name : previous?.name || 'tool',
    arguments: event.arguments ?? previous?.arguments,
    argumentsTruncated: event.argumentsTruncated ?? previous?.argumentsTruncated,
    content: event.content ?? previous?.content,
    contentTruncated: event.contentTruncated ?? previous?.contentTruncated,
    isError: event.isError ?? previous?.isError,
    error: event.error ?? previous?.error,
    meta: event.meta ?? previous?.meta,
    turn: event.turn ?? previous?.turn,
    step: event.step ?? previous?.step,
    source: event.source || previous?.source || 'standard',
    status: event.type === 'tool_result' ? (event.isError ? 'failed' : 'completed') : previous?.status || 'running',
    startedAt: event.startedAt || previous?.startedAt,
    finishedAt: event.finishedAt || previous?.finishedAt,
  };
  if (index >= 0) tools[index] = tool;
  else tools.push(tool);
  message.tools = tools;
}

export function reduceAgentEvent(sessions: HarnessSession[], event: AgentEvent): HarnessSession[] {
  return sessions.map((session) => {
    if (session.id !== event.sessionId) return session;
    const next = { ...session, messages: session.messages.map((message) => ({ ...message, tools: message.tools?.map((tool) => ({ ...tool })), citations: message.citations?.map((citation) => ({ ...citation })) })) };
    const lastSeq = (next as HarnessSession & { lastSeq?: number }).lastSeq || 0;
    if (event.seq <= lastSeq) return session;
    (next as HarnessSession & { lastSeq?: number }).lastSeq = event.seq;
    if (event.type === 'status') next.status = event.status || next.status;
    if (event.type === 'assistant_chunk') {
      const last = assistantMessage(next.messages);
      last.content += event.content || '';
    }
    if (event.type === 'assistant_reasoning_chunk') {
      const last = assistantMessage(next.messages);
      last.reasoning = `${last.reasoning || ''}${event.content || ''}`;
    }
    if (event.type === 'tool_call' || event.type === 'tool_result') mergeTool(assistantMessage(next.messages), event);
    if (event.type === 'assistant_message') {
      const last = next.messages[next.messages.length - 1];
      if (last?.role === 'assistant') {
        last.content = event.content || last.content;
        last.reasoning = event.reasoning || last.reasoning;
        if (event.tools) last.tools = event.tools;
        if (event.citations) last.citations = event.citations;
      } else next.messages.push({ role: 'assistant', content: event.content || '', reasoning: event.reasoning, tools: event.tools, citations: event.citations });
    }
    if (event.type === 'done') next.status = event.reason === 'cancelled' ? 'cancelled' : event.reason === 'error' ? 'failed' : 'idle';
    if (event.type === 'done' && event.summary) next.runSummary = event.summary;
    if (event.type === 'error') next.status = 'failed';
    return next;
  });
}
