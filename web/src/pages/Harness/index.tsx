import { Sender } from '@ant-design/x';
import { BarChartOutlined, CalendarOutlined, CloseOutlined, DeleteOutlined, EditOutlined, FolderAddOutlined, FolderOpenOutlined, FolderOutlined, InboxOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import { App, Button, Card, Empty, Input, Modal, Popover, Select, Space, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HarnessMessageStream from '@/components/Harness/MessageStream';
import ModelReasoningPicker from '@/components/Harness/ModelReasoningPicker';
import { assignWorkspace, cancelMessage, createSession, createWorkspace, deleteSession, deleteWorkspace, getCapabilities, getSession, listSessions, listWorkspaces, openEvents, renameSession, sendMessage, updatePreferences, type AgentEvent, type Capabilities, type HarnessSession, type ReasoningEffort, type Workspace } from '@/services/harness';
import styles from './style.less';
import { reduceAgentEvent } from './store';

const statusLabel: Record<string, string> = { idle: '就绪', queued: '排队中', running: '运行中', cancelling: '停止中', cancelled: '已停止', failed: '失败' };
const reasoningLabel: Record<ReasoningEffort, string> = { off: 'Off', low: 'Low', high: 'High', max: 'Max' };
const DRAFT_SESSION_ID = '__harness_draft__';
type SelectedWorkspace = string | 'uncategorized';

type ConversationTurn = { start: number; user: string; assistant: string };

const TurnPreviewRail: React.FC<{
  turns: ConversationTurn[];
  onJump: (index: number) => void;
}> = ({ turns, onJump }) => (
  <aside className={styles.previewRail} aria-label="会话快速预览">
    <div className={styles.rail}>
      {turns.map((turn, index) => {
        const label = turn.user || turn.assistant || '空消息';
        const preview = (
          <div className={styles.turnPreviewCard} data-testid={`turn-preview-${turn.start}`}>
            <div className={styles.turnPreviewQuestion}>{turn.user || '本轮无用户消息'}</div>
            <div className={styles.turnPreviewAnswer}>{turn.assistant || '等待助手回复'}</div>
          </div>
        );
        return (
          <Popover key={turn.start} content={preview} trigger={['hover', 'focus']} placement="right" arrow={false} overlayClassName={styles.turnPreviewPopover}>
            <button type="button" className={styles.railItem} onClick={() => onJump(turn.start)} aria-label={`预览第 ${index + 1} 轮：${label}`}>
              <span />
            </button>
          </Popover>
        );
      })}
    </div>
  </aside>
);

const Harness: React.FC = () => {
  const access = useAccess() as any;
  const { message } = App.useApp();
  const [sessions, setSessions] = useState<HarnessSession[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<string>();
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [runningSessionId, setRunningSessionId] = useState<string>();
  const [mode, setMode] = useState<'standard' | 'ptc'>('standard');
  const [model, setModel] = useState('');
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('high');
  const [capabilities, setCapabilities] = useState<Capabilities>({ modes: [{ id: 'standard', enabled: true }], models: [], reasoningEfforts: ['off', 'low', 'high', 'max'], defaultReasoningEffort: 'high' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [renamingSession, setRenamingSession] = useState<HarnessSession>();
  const [renameTitle, setRenameTitle] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<SelectedWorkspace>('uncategorized');
  const [draftWorkspace, setDraftWorkspace] = useState<SelectedWorkspace>('uncategorized');
  const stopStream = useRef<(() => void) | undefined>(undefined);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isDraft = selected === DRAFT_SESSION_ID;
  const current = useMemo<HarnessSession | undefined>(() => {
    if (selected === DRAFT_SESSION_ID) {
      return { id: DRAFT_SESSION_ID, title: '新对话', status: 'idle', messages: [], workspaceId: draftWorkspace === 'uncategorized' ? null : draftWorkspace, mode, model, reasoningEffort };
    }
    return sessions.find((item) => item.id === selected);
  }, [draftWorkspace, mode, model, reasoningEffort, selected, sessions]);
  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sessions;
    return sessions.filter((item) => item.title.toLowerCase().includes(keyword) || item.messages.some((msg) => msg.content.toLowerCase().includes(keyword)));
  }, [search, sessions]);
  const groupedSessions = useMemo(() => {
    const groups = workspaces.map((workspace) => ({ id: workspace.id, name: workspace.name, description: workspace.description, sessions: filteredSessions.filter((session) => session.workspaceId === workspace.id) }));
    return [...groups, { id: 'uncategorized', name: '未分类', description: '', sessions: filteredSessions.filter((session) => !session.workspaceId) }];
  }, [filteredSessions, workspaces]);
  const currentWorkspace = current?.workspaceId || null;
  const configurationOpen = Boolean(current && current.messages.length === 0);
  const currentWorkspaceName = workspaces.find((item) => item.id === currentWorkspace)?.name || '未分类';

  const refresh = useCallback(async () => {
    const [sessionResult, workspaceResult, capabilityResult] = await Promise.all([listSessions({ kind: 'general' }), listWorkspaces(), getCapabilities()]);
    setSessions(sessionResult.data || []); setWorkspaces(workspaceResult.data || []); setCapabilities(capabilityResult);
    const first = sessionResult.data?.[0];
    if (first) { setSelected((value) => value || first.id); setSelectedWorkspace((value) => value === 'uncategorized' ? first.workspaceId || 'uncategorized' : value); }
  }, []);
  useEffect(() => { refresh().catch(() => message.error('无法加载 Harness 工作台')); }, [refresh, message]);
  useEffect(() => () => stopStream.current?.(), []);
  useEffect(() => {
    if (!runningSessionId) return undefined;
    let active = true;
    const reconcile = async () => {
      try {
        const snapshot = await getSession(runningSessionId);
        if (!active) return;
        setSessions((items) => items.map((item) => item.id === snapshot.id ? snapshot : item));
        if (!['queued', 'running', 'cancelling'].includes(snapshot.status)) {
          stopStream.current?.();
          stopStream.current = undefined;
          setRunning(false);
          setRunningSessionId(undefined);
        }
      } catch {
        // The SSE stream remains authoritative while reconciliation is transiently unavailable.
      }
    };
    const timer = window.setInterval(() => { void reconcile(); }, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [runningSessionId]);
  useEffect(() => { if (current) { setMode(current.mode || 'standard'); setModel(current.model || capabilities.defaultModel || capabilities.models[0]?.id || ''); setReasoningEffort(current.reasoningEffort || capabilities.defaultReasoningEffort || 'high'); } }, [current?.id, capabilities.defaultModel, capabilities.defaultReasoningEffort, capabilities.models]);

  const applyEvent = (event: AgentEvent) => { if (event.type === 'done' || event.type === 'error') { setRunning(false); setRunningSessionId(undefined); } if (event.type === 'done') { stopStream.current?.(); stopStream.current = undefined; } setSessions((items) => reduceAgentEvent(items, event)); };
  const create = async (workspaceId: SelectedWorkspace = selectedWorkspace) => {
    if (running) { message.warning('当前会话运行结束后再新建对话'); return; }
    if (isDraft) { setDraftWorkspace(workspaceId); setSelectedWorkspace(workspaceId); return; }
    setDraftWorkspace(workspaceId); setSelectedWorkspace(workspaceId); setSelected(DRAFT_SESSION_ID); setInput(''); setMode('standard'); setModel(capabilities.defaultModel || capabilities.models[0]?.id || ''); setReasoningEffort(capabilities.defaultReasoningEffort || 'high');
  };
  const send = async () => {
    if (!current || !input.trim() || !access.canSendHarnessMessage || running) return;
    const content = input.trim();
    const selectedMode = mode;
    const selectedModel = model;
    const selectedReasoningEffort = reasoningEffort;
    setInput(''); setRunning(true);
    let target = current;
    let materializedId: string | undefined;
    try {
      if (isDraft) {
        target = await createSession();
        materializedId = target.id;
        if (draftWorkspace !== 'uncategorized') target = await assignWorkspace(target.id, draftWorkspace);
        target = { ...target, mode: selectedMode, model: selectedModel, reasoningEffort: selectedReasoningEffort };
        setSelectedWorkspace(draftWorkspace);
      }
      setRunningSessionId(target.id);
      const optimistic = { ...target, title: target.title === '新建会话' ? content.replace(/\s+/g, ' ').slice(0, 32) : target.title, status: 'queued', messages: [...target.messages, { role: 'user' as const, content }] };
      setSessions((items) => isDraft ? [optimistic, ...items] : items.map((item) => item.id === target.id ? optimistic : item));
      if (isDraft) setSelected(target.id);
      await updatePreferences(target.id, selectedMode, selectedModel, selectedReasoningEffort);
      const result = await sendMessage(target.id, content, selectedMode, selectedModel, selectedReasoningEffort);
      const attachStream = (afterSeq: number) => {
        stopStream.current?.();
        stopStream.current = openEvents(target.id, (event) => { if (event.runId === result.runId) applyEvent(event); }, async () => {
          try {
            const snapshot = await getSession(target.id);
            setSessions((items) => items.map((item) => item.id === snapshot.id ? snapshot : item));
            if (['queued', 'running', 'cancelling'].includes(snapshot.status)) attachStream(snapshot.lastSeq || afterSeq);
            else { setRunning(false); setRunningSessionId(undefined); }
          } catch {
            setRunning(false); setRunningSessionId(undefined); message.error('事件连接已断开，请检查 Agent SDK 服务');
          }
        }, afterSeq);
      };
      attachStream(target.lastSeq || 0);
    } catch (error: any) { if (materializedId) { await deleteSession(materializedId).catch(() => undefined); setSessions((items) => items.filter((item) => item.id !== materializedId)); setSelected(DRAFT_SESSION_ID); } setInput(content); setRunning(false); setRunningSessionId(undefined); message.error(error?.response?.data?.message || error?.message || '发送失败'); }
  };
  const cancel = async () => { if (current && !isDraft) await cancelMessage(current.id); };
  const remove = async (id: string) => { if (id !== DRAFT_SESSION_ID) await deleteSession(id); setSessions((items) => items.filter((item) => item.id !== id)); if (selected === id) setSelected(undefined); };
  const rename = async (id: string, title: string) => { const normalized = title.trim(); if (!normalized) return; try { const updated = await renameSession(id, normalized); setSessions((items) => items.map((item) => item.id === id ? { ...item, title: updated.title } : item)); } catch (error: any) { message.error(error?.message || '会话重命名失败'); } };
  const saveRename = async () => { if (!renamingSession || !renameTitle.trim()) return; await rename(renamingSession.id, renameTitle); setRenamingSession(undefined); setRenameTitle(''); };
  const saveWorkspace = async () => { if (!workspaceName.trim()) return; try { const item = await createWorkspace(workspaceName.trim(), workspaceDescription.trim()); setWorkspaces((items) => [...items, item]); setSelectedWorkspace(item.id); setWorkspaceName(''); setWorkspaceDescription(''); setWorkspaceModalOpen(false); } catch (error: any) { message.error(error?.message || '目录创建失败'); } };
  const changeWorkspace = async (workspaceId: string | null) => { if (!current || !configurationOpen) return; if (isDraft) { const selectedDraftWorkspace = workspaceId || 'uncategorized'; setDraftWorkspace(selectedDraftWorkspace); setSelectedWorkspace(selectedDraftWorkspace); return; } const item = await assignWorkspace(current.id, workspaceId); setSessions((items) => items.map((session) => session.id === item.id ? { ...session, workspaceId: item.workspaceId } : session)); setSelectedWorkspace(workspaceId || 'uncategorized'); setWorkspaces((items) => items.map((workspace) => ({ ...workspace, sessionCount: sessions.filter((s) => s.workspaceId === workspace.id && s.id !== current.id).length + (workspace.id === workspaceId ? 1 : 0) }))); };
  const changeMode = async (value: 'standard' | 'ptc') => { if (!current || !configurationOpen) return; setMode(value); if (isDraft) return; try { await updatePreferences(current.id, value, model, reasoningEffort); } catch (error: any) { message.error(error?.message || '模式切换失败'); } };
  const changeModel = async (value: string) => { if (!current || running) return; setModel(value); if (isDraft) return; try { await updatePreferences(current.id, mode, value, reasoningEffort); setSessions((items) => items.map((item) => item.id === current.id ? { ...item, model: value } : item)); } catch (error: any) { setModel(current.model || ''); message.error(error?.message || '模型切换失败'); } };
  const changeReasoningEffort = async (value: ReasoningEffort) => { if (!current || running) return; setReasoningEffort(value); if (isDraft) return; try { await updatePreferences(current.id, mode, model, value); setSessions((items) => items.map((item) => item.id === current.id ? { ...item, reasoningEffort: value } : item)); } catch (error: any) { setReasoningEffort(current.reasoningEffort || 'high'); message.error(error?.message || '推理等级切换失败'); } };
  const turns = useMemo(() => { const result: ConversationTurn[] = []; (current?.messages || []).forEach((item, index) => { if (item.role === 'user') result.push({ start: index, user: item.content, assistant: '' }); else if (result.length) result[result.length - 1].assistant += item.content; else result.push({ start: index, user: '', assistant: item.content }); }); return result; }, [current?.messages]);
  const jumpTo = (index: number) => messageRefs.current[`${current?.id}-${index}`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const runSummary = current?.runSummary && <div className={styles.summary}><div>状态 <b>{current.runSummary.terminalReason || 'unknown'}</b></div><div>模式 <b>{current.runSummary.mode || current.mode || 'standard'}</b></div><div>模型 <b>{current.runSummary.model || current.model || 'unknown'}</b></div><div>推理 <b>{reasoningLabel[current.runSummary.reasoningEffort || current.reasoningEffort || 'off']}</b></div><div>耗时 <b>{current.runSummary.durationMs ?? '-'} ms</b></div><div>步骤 <b>{current.runSummary.steps ?? '-'}</b></div><div>用量 <b>{current.runSummary.inputTokens ?? '-'} / {current.runSummary.outputTokens ?? '-'}</b></div></div>;

  return <div className={styles.workbench}>
    <aside className={styles.leftPane} aria-label="工作区与会话">
      <div className={styles.newSession}><Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => create()}>开启新会话</Button></div>
      <div className={styles.workspaceToolbar}><Typography.Text>工作区</Typography.Text><div className={styles.workspaceActions}><Tooltip title={searchOpen ? '关闭搜索' : '搜索'}><Button aria-label={searchOpen ? '关闭搜索' : '搜索会话'} type="text" size="small" icon={searchOpen ? <CloseOutlined /> : <SearchOutlined />} onClick={() => { setSearchOpen((value) => !value); if (searchOpen) setSearch(''); }} /></Tooltip><Tooltip title="新建工作区"><Button aria-label="新建工作区" type="text" size="small" icon={<FolderAddOutlined />} onClick={() => setWorkspaceModalOpen(true)} /></Tooltip></div></div>
      {searchOpen && <div className={styles.searchBox}><Input size="small" autoFocus allowClear prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索会话和消息" /></div>}
      <div className={styles.sessionList}>{sessions.length === 0 && workspaces.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无会话" /> : groupedSessions.map((group) => { const groupId = group.id as SelectedWorkspace; const folderSelected = selectedWorkspace === groupId; return <section key={group.id} className={styles.sessionGroup}><div className={`${styles.groupHeader} ${folderSelected ? styles.groupActive : ''}`} title={group.description}><button type="button" className={styles.folderButton} onClick={() => setSelectedWorkspace(groupId)}>{group.id === 'uncategorized' ? <InboxOutlined /> : folderSelected ? <FolderOpenOutlined /> : <FolderOutlined />}<span>{group.name}</span></button><Typography.Text type="secondary">{group.sessions.length}</Typography.Text><Tooltip title="在此新建会话"><Button type="text" size="small" icon={<PlusOutlined />} onClick={() => create(groupId)} /></Tooltip>{group.id !== 'uncategorized' && <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => deleteWorkspace(group.id).then(() => { if (selectedWorkspace === group.id) setSelectedWorkspace('uncategorized'); return refresh(); })} />}</div><div className={styles.groupSessions}>{group.sessions.map((item) => <div key={item.id} className={`${styles.sessionItem} ${item.id === selected ? styles.active : ''}`} onClick={() => { setSelected(item.id); setSelectedWorkspace(item.workspaceId || 'uncategorized'); }}><div className={styles.sessionTitleRow}><Typography.Text className={styles.sessionTitle} ellipsis={{ tooltip: item.title }}>{item.title}</Typography.Text><Tooltip title="重命名会话"><Button className={styles.renameButton} type="text" size="small" icon={<EditOutlined />} onClick={(event) => { event.stopPropagation(); setRenamingSession(item); setRenameTitle(item.title); }} /></Tooltip></div><div className={styles.sessionMeta}><span>{statusLabel[item.status] || item.status}</span><Button type="text" size="small" icon={<DeleteOutlined />} onClick={(event) => { event.stopPropagation(); remove(item.id); }} /></div></div>)}</div></section>; })}</div>
    </aside>
    <main className={styles.centerPane}>{current ? <><header className={styles.chatHeader}><div><Typography.Title level={5}>{current.title}</Typography.Title><Typography.Text type="secondary">{statusLabel[current.status] || current.status}</Typography.Text></div><div className={styles.headerConfiguration}>{runSummary && <Popover content={runSummary} trigger="click" placement="bottomRight" arrow={false} overlayClassName={styles.summaryPopover}><Button type="text" size="small" icon={<BarChartOutlined />} aria-label="运行摘要" /></Popover>}{configurationOpen ? <><Select size="small" value={currentWorkspace || undefined} allowClear placeholder="未分类" options={workspaces.map((item) => ({ label: item.name, value: item.id }))} onChange={changeWorkspace} disabled={running} /><Select size="small" value={mode} options={capabilities.modes.map((item) => ({ label: item.id === 'standard' ? '标准模式' : 'PTC 模式', value: item.id, disabled: !item.enabled }))} onChange={changeMode} disabled={running} /></> : <><span className={styles.configLabel}>{currentWorkspaceName}</span><span className={styles.configLabel}>{mode === 'ptc' ? 'PTC 模式' : '标准模式'}</span></>}</div></header>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable transcript must remain keyboard-focusable */}
      <section className={`${styles.messages} ${current.messages.length ? '' : styles.emptyMessages}`} aria-label="会话消息" tabIndex={0}><HarnessMessageStream messages={current.messages} running={running && runningSessionId === current.id} sessionId={current.id} onMessageRef={(key, node) => { messageRefs.current[key] = node; }} /></section>
      <div className={styles.composer}><Sender value={input} onChange={setInput} onSubmit={send} onCancel={() => { void cancel(); }} loading={running && runningSessionId === current.id} disabled={!access.canSendHarnessMessage || running} placeholder="输入消息，支持 Markdown" autoSize={{ minRows: 2, maxRows: 10 }} suffix={false} footer={(actions) => <div className={styles.composerFooter}><Button className={styles.composerPlus} type="text" shape="circle" icon={<PlusOutlined />} disabled aria-label="扩展能力暂未开放" /><div className={styles.composerRight}><ModelReasoningPicker capabilities={capabilities} model={model} reasoningEffort={reasoningEffort} locked={running} onModelChange={(value) => { void changeModel(value); }} onReasoningChange={(value) => { void changeReasoningEffort(value); }} /><div className={styles.composerActions}>{actions}</div></div></div>} /></div></> : <div className={styles.emptyConversation}><Empty description="请选择或新建会话" /></div>}
      <TurnPreviewRail turns={turns} onJump={jumpTo} />
    </main>
    <Modal title="新建目录" open={workspaceModalOpen} okText="创建" cancelText="取消" onOk={saveWorkspace} onCancel={() => setWorkspaceModalOpen(false)} okButtonProps={{ disabled: !workspaceName.trim() }}><Space direction="vertical" size={12} className={styles.modalFields}><Input autoFocus value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="目录名称" maxLength={40} /><Input.TextArea value={workspaceDescription} onChange={(event) => setWorkspaceDescription(event.target.value)} placeholder="简单描述（可选）" maxLength={120} rows={3} /></Space></Modal>
    <Modal title="重命名会话" open={Boolean(renamingSession)} okText="保存" cancelText="取消" onOk={saveRename} onCancel={() => { setRenamingSession(undefined); setRenameTitle(''); }} okButtonProps={{ disabled: !renameTitle.trim() }}><Input autoFocus value={renameTitle} onChange={(event) => setRenameTitle(event.target.value)} onPressEnter={() => { void saveRename(); }} placeholder="会话标题" maxLength={80} /></Modal>
  </div>;
};
export default Harness;
