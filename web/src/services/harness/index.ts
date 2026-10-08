import { request } from '@umijs/max';
import { authHeaders } from '@/utils/authRequest';

export type ToolStep = { callId: string; rootCallId?: string; parentCallId?: string | null; name: string; arguments?: unknown; argumentsTruncated?: boolean; content?: string; contentTruncated?: boolean; isError?: boolean; error?: unknown; meta?: unknown; turn?: number | null; step?: number | null; source?: 'standard' | 'ptc'; status: 'running' | 'completed' | 'failed'; startedAt?: string; finishedAt?: string };
export type HarnessCitation = { citationId: string; spaceId: string; targetType: 'asset' | 'node'; targetId: string; title?: string; path?: string; chunkIndex?: number };
export type KnowledgeContext = { folderId?: string; targets?: { targetType: 'asset' | 'node'; targetId: string }[] };
export type HarnessMessage = { id?: string; role: 'user' | 'assistant'; content: string; reasoning?: string; tools?: ToolStep[]; citations?: HarnessCitation[]; createdAt?: string };
export type ReasoningEffort = 'off' | 'low' | 'high' | 'max';
export type RunSummary = { startedAt?: string; finishedAt?: string; durationMs?: number | null; steps?: number | null; inputTokens?: number | null; outputTokens?: number | null; terminalReason?: string; mode?: string; model?: string | null; reasoningEffort?: ReasoningEffort; selectionVerified?: boolean };
export type HarnessSession = { id: string; title: string; status: string; messages: HarnessMessage[]; lastSeq?: number; workspaceId?: string | null; mode?: 'standard' | 'ptc'; model?: string | null; reasoningEffort?: ReasoningEffort; runSummary?: RunSummary | null; kind?: 'general' | 'knowledge'; knowledgeSpaceId?: string | null; knowledgeFolderId?: string | null };
export type Workspace = { id: string; name: string; description?: string; sort: number; sessionCount: number; createdAt?: string; updatedAt?: string };
export type AgentEvent = { sessionId: string; runId: string; seq: number; type: string; content?: string; reasoning?: string; tools?: ToolStep[]; citations?: HarnessCitation[]; status?: string; reason?: string; message?: string; summary?: RunSummary; mode?: string; model?: string; reasoningEffort?: ReasoningEffort; callId?: string; rootCallId?: string; parentCallId?: string | null; name?: string; arguments?: unknown; argumentsTruncated?: boolean; contentTruncated?: boolean; isError?: boolean; error?: unknown; meta?: unknown; turn?: number | null; step?: number | null; source?: 'standard' | 'ptc'; startedAt?: string; finishedAt?: string; draftId?: string; preview?: ScheduledTaskInput; nextRunAt?: string; expiresAt?: string };
export type Capabilities = { modes: { id: 'standard' | 'ptc'; enabled: boolean; reason?: string }[]; models: { id: string; label: string }[]; reasoningEfforts?: ReasoningEffort[]; defaultModel?: string; defaultReasoningEffort?: ReasoningEffort };
export type ScheduleRule = { kind: 'once' | 'daily' | 'weekly' | 'monthly'; runAt?: string; localTime?: string; weekdays?: number[]; dayOfMonth?: number };
export type ScheduledTaskInput = { name: string; instructions: string; schedule: ScheduleRule; timezone: string; workspaceId?: string | null; mode: 'standard' | 'ptc'; model: string; reasoningEffort: ReasoningEffort; version?: number };
export type ScheduledTask = ScheduledTaskInput & { id: string; sessionId: string; ownerUserId: string; status: 'active' | 'paused' | 'completed' | 'deleted'; nextRunAt?: string; lastRunAt?: string; lastRunStatus?: string; consecutiveFailures: number; pauseReason?: string; version: number; createdAt: string; updatedAt: string };
export type ScheduledTaskRun = { id: string; taskId: string; scheduledFor: string; triggerType: 'schedule' | 'manual'; status: string; attempt: number; turnId?: string; report?: string; errorCode?: string; errorMessage?: string; createdAt: string; startedAt?: string; completedAt?: string };

export const listSessions = (params?: { kind?: 'general' | 'knowledge'; knowledgeSpaceId?: string }) => request<{ data: HarnessSession[] }>('/api/harness/sessions', { params });
export const createSession = (data?: { kind?: 'general' | 'knowledge'; knowledgeSpaceId?: string; knowledgeFolderId?: string }) => request<HarnessSession>('/api/harness/sessions', { method: 'POST', data: data || {} });
export const getSession = (id: string, params?: { surface?: 'general' | 'knowledge' }) => request<HarnessSession>(`/api/harness/sessions/${id}`, { params });
export const renameSession = (id: string, title: string, params?: { surface?: 'general' | 'knowledge' }) => request<HarnessSession>(`/api/harness/sessions/${id}/title`, { method: 'PATCH', params, data: { title } });
export const sendMessage = (id: string, content: string, mode?: string, model?: string, reasoningEffort?: ReasoningEffort, knowledgeContext?: KnowledgeContext, surface?: 'general' | 'knowledge') => request<{ sessionId: string; runId: string }>(`/api/harness/sessions/${id}/messages`, { method: 'POST', params: surface ? { surface } : undefined, data: { content, mode, model, reasoningEffort, knowledgeContext } });
export const cancelMessage = (id: string, params?: { surface?: 'general' | 'knowledge' }) => request<{ cancelled: boolean }>(`/api/harness/sessions/${id}/cancel`, { method: 'POST', params });
export const deleteSession = (id: string, params?: { surface?: 'general' | 'knowledge' }) => request<{ deleted: boolean }>(`/api/harness/sessions/${id}`, { method: 'DELETE', params });
export const getCapabilities = (params?: { surface?: 'general' | 'knowledge' }) => request<Capabilities>('/api/harness/capabilities', { params });
export const listWorkspaces = () => request<{ data: Workspace[] }>('/api/harness/workspaces');
export const createWorkspace = (name: string, description = '') => request<Workspace>('/api/harness/workspaces', { method: 'POST', data: { name, description } });
export const deleteWorkspace = (id: string) => request<{ deleted: boolean }>(`/api/harness/workspaces/${id}`, { method: 'DELETE' });
export const assignWorkspace = (sessionId: string, workspaceId: string | null) => request<HarnessSession>(`/api/harness/sessions/${sessionId}/workspace`, { method: 'PATCH', data: { workspaceId } });
export const updatePreferences = (id: string, mode: string, model: string, reasoningEffort: ReasoningEffort, params?: { surface?: 'general' | 'knowledge' }) => request<HarnessSession>(`/api/harness/sessions/${id}/preferences`, { method: 'PATCH', params, data: { mode, model, reasoningEffort } });
export const listScheduledTasks = () => request<{ data: ScheduledTask[] }>('/api/harness/scheduled-tasks');
export const createScheduledTask = (data: ScheduledTaskInput) => request<ScheduledTask>('/api/harness/scheduled-tasks', { method: 'POST', data });
export const updateScheduledTask = (id: string, data: ScheduledTaskInput) => request<ScheduledTask>(`/api/harness/scheduled-tasks/${id}`, { method: 'PATCH', data });
export const pauseScheduledTask = (id: string) => request<ScheduledTask>(`/api/harness/scheduled-tasks/${id}/pause`, { method: 'POST' });
export const resumeScheduledTask = (id: string) => request<ScheduledTask>(`/api/harness/scheduled-tasks/${id}/resume`, { method: 'POST' });
export const runScheduledTaskNow = (id: string) => request<ScheduledTaskRun>(`/api/harness/scheduled-tasks/${id}/run-now`, { method: 'POST' });
export const deleteScheduledTask = (id: string) => request<ScheduledTask>(`/api/harness/scheduled-tasks/${id}`, { method: 'DELETE' });
export const listScheduledTaskRuns = (id: string) => request<{ data: ScheduledTaskRun[] }>(`/api/harness/scheduled-tasks/${id}/runs`);
export const confirmScheduledTaskDraft = (id: string) => request<ScheduledTask>(`/api/harness/scheduled-task-drafts/${id}/confirm`, { method: 'POST' });
export const optimizeScheduledTaskInstructions = (data: Pick<ScheduledTaskInput, 'instructions' | 'mode' | 'model' | 'reasoningEffort'>) => request<{ optimizedInstructions: string }>('/api/harness/scheduled-task-instructions/optimize', { method: 'POST', data });

export function parseAgentEventFrame(frame: string): AgentEvent | undefined {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''))
    .join('\n');
  if (!data) return undefined;
  return JSON.parse(data) as AgentEvent;
}

export function createAgentEventParser(onEvent: (event: AgentEvent) => void) {
  let buffer = '';

  const drain = (flush = false) => {
    while (true) {
      const delimiter = buffer.match(/\r?\n\r?\n/);
      if (!delimiter || delimiter.index === undefined) break;
      const frame = buffer.slice(0, delimiter.index);
      buffer = buffer.slice(delimiter.index + delimiter[0].length);
      const event = parseAgentEventFrame(frame);
      if (event) onEvent(event);
    }
    if (flush && buffer.trim()) {
      const event = parseAgentEventFrame(buffer);
      buffer = '';
      if (event) onEvent(event);
    }
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      drain();
    },
    finish() {
      drain(true);
    },
  };
}

export function openEvents(id: string, onEvent: (event: AgentEvent) => void, onError?: (error: unknown) => void, afterSeq = 0, params?: { surface?: 'general' | 'knowledge' }) {
  let stopped = false;
  let cursor = afterSeq;
  let controller: AbortController | undefined;
  const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const connect = async () => {
    let failures = 0;
    while (!stopped) {
      controller = new AbortController();
      try {
        const query = new URLSearchParams({ afterSeq: String(cursor) });
        if (params?.surface) query.set('surface', params.surface);
        const response = await fetch(`/api/harness/sessions/${id}/events?${query.toString()}`, { headers: authHeaders(), signal: controller.signal });
        if (!response.ok || !response.body) throw new Error(`SSE ${response.status}`);
        failures = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const parser = createAgentEventParser((event) => {
          cursor = Math.max(cursor, event.seq);
          onEvent(event);
        });
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.push(decoder.decode(value, { stream: true }));
        }
        parser.push(decoder.decode());
        parser.finish();
      } catch (error) {
        if (stopped || controller.signal.aborted) return;
        failures += 1;
        if (failures >= 5) {
          onError?.(error);
          return;
        }
      }
      if (!stopped) await delay(Math.min(500 * 2 ** failures, 4000));
    }
  };
  void connect();
  return () => { stopped = true; controller?.abort(); };
}
