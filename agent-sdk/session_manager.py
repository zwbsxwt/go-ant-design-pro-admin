"""Multi-session runtime state and ordered event delivery."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncIterator
from uuid import uuid4
from time import monotonic

from event_adapter import EventAdapter
from harness_client import HarnessAdapter


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def knowledge_citations(value: Any) -> list[dict[str, Any]]:
    """Normalize Knowledge MCP search rows into the frontend citation contract."""
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, ValueError):
            return []
    rows = value.get("data") if isinstance(value, dict) else None
    if not isinstance(rows, list):
        return []
    citations: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        citation_id = str(row.get("citation_id") or row.get("citationId") or "").strip()
        space_id = str(row.get("space_id") or row.get("spaceId") or "").strip()
        target_id = str(row.get("target_id") or row.get("targetId") or "").strip()
        target_type = str(row.get("target_type") or row.get("targetType") or "").strip()
        if not citation_id or not space_id or not target_id or target_type not in {"asset", "node", "markdown"}:
            continue
        citation = {
            "citationId": citation_id,
            "spaceId": space_id,
            "targetType": "asset" if target_type == "asset" else "node",
            "targetId": target_id,
            "title": str(row.get("title") or ""),
            "path": str(row.get("path") or ""),
        }
        chunk_index = row.get("chunk_index", row.get("chunkIndex"))
        if isinstance(chunk_index, int):
            citation["chunkIndex"] = chunk_index
        citations.append(citation)
    return citations


def select_message_citations(citations: list[dict[str, Any]], content: str) -> list[dict[str, Any]]:
    """Prefer citations explicitly named by the answer and avoid duplicate documents."""
    selected: list[dict[str, Any]] = []
    seen_targets: set[str] = set()
    for citation in citations:
        title = str(citation.get("title") or "").strip()
        title_stem = Path(title).stem if title else ""
        explicitly_used = str(citation.get("citationId") or "") in content or (title_stem and title_stem in content)
        if not explicitly_used:
            continue
        target_id = str(citation.get("targetId") or "")
        if target_id and target_id not in seen_targets:
            seen_targets.add(target_id)
            selected.append(citation)
    if selected:
        return selected
    for citation in citations:
        target_id = str(citation.get("targetId") or "")
        if target_id and target_id not in seen_targets:
            seen_targets.add(target_id)
            selected.append(citation)
    return selected


@dataclass
class Session:
    id: str
    owner_id: str
    title: str = "新建会话"
    status: str = "idle"
    messages: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    active_task: asyncio.Task | None = field(default=None, repr=False)
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event, repr=False)
    workspace_id: str | None = None
    mode: str = "standard"
    model: str = ""
    reasoning_effort: str = "high"
    run_summary: dict[str, Any] | None = None
    kind: str = "general"
    knowledge_space_id: str | None = None
    knowledge_folder_id: str | None = None


@dataclass
class Workspace:
    id: str
    owner_id: str
    name: str
    description: str = ""
    sort: int = 0
    created_at: str = field(default_factory=now)
    updated_at: str = field(default_factory=now)


class SessionManager:
    def __init__(self, adapter: HarnessAdapter, state_file: str) -> None:
        self.adapter = adapter
        self.state_path = Path(state_file)
        self.sessions: dict[str, Session] = {}
        self.workspaces: dict[str, Workspace] = {}
        self.subscribers: dict[str, set[asyncio.Queue]] = {}
        self._load()

    def _load(self) -> None:
        if not self.state_path.exists():
            return
        try:
            payload = json.loads(self.state_path.read_text(encoding="utf-8"))
            rows = payload if isinstance(payload, list) else payload.get("sessions", [])
            for raw in ([] if isinstance(payload, list) else payload.get("workspaces", [])):
                workspace = Workspace(id=raw["id"], owner_id=raw["owner_id"], name=raw["name"], description=raw.get("description", ""), sort=raw.get("sort", 0), created_at=raw.get("created_at", now()), updated_at=raw.get("updated_at", now()))
                self.workspaces[workspace.id] = workspace
            recovered = False
            for raw in rows:
                values = {k: raw[k] for k in ("id", "owner_id", "title", "status", "messages", "events")}
                values.update({k: raw.get(k) for k in ("workspace_id", "mode", "model", "reasoning_effort", "run_summary", "kind", "knowledge_space_id", "knowledge_folder_id") if k in raw})
                session = Session(**values)
                self.sessions[raw["id"]] = session
                if session.status in {"queued", "running", "cancelling"}:
                    recovered = True
                    run_id = next((str(event.get("runId")) for event in reversed(session.events) if event.get("runId")), str(uuid4()))
                    session.status = "failed"
                    session.run_summary = {**(session.run_summary or {}), "finishedAt": now(), "terminalReason": "error"}
                    self._event(session, run_id, "status", status="failed")
                    self._event(session, run_id, "error", message="Agent Runtime restarted before the run completed")
                    self._event(session, run_id, "done", reason="error", summary=session.run_summary)
            if recovered:
                self._save()
        except (OSError, ValueError, KeyError, TypeError):
            pass

    def _save(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"sessions": [{"id": s.id, "owner_id": s.owner_id, "title": s.title, "status": s.status, "messages": s.messages, "events": s.events[-500:], "workspace_id": s.workspace_id, "mode": s.mode, "model": s.model, "reasoning_effort": s.reasoning_effort, "run_summary": s.run_summary, "kind": s.kind, "knowledge_space_id": s.knowledge_space_id, "knowledge_folder_id": s.knowledge_folder_id} for s in self.sessions.values()], "workspaces": [vars(w) for w in self.workspaces.values()]}
        self.state_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _event(self, session: Session, run_id: str, event_type: str, **fields: Any) -> dict[str, Any]:
        event = EventAdapter(session.id, run_id, session.events[-1]["seq"] if session.events else 0).make(event_type, **fields)
        session.events.append(event)
        for queue in self.subscribers.get(session.id, set()):
            queue.put_nowait(event)
        return event

    def list(self, owner_id: str, *, kind: str | None = None, knowledge_space_id: str | None = None, include_scheduled: bool = False) -> list[Session]:
        effective_kind = kind or "general"
        matches = [s for s in self.sessions.values() if s.owner_id == owner_id and (include_scheduled or s.kind != "scheduled") and s.kind == effective_kind and (knowledge_space_id is None or s.knowledge_space_id == knowledge_space_id)]
        return list(reversed(matches))

    def get(self, owner_id: str, session_id: str) -> Session | None:
        session = self.sessions.get(session_id)
        return session if session and session.owner_id == owner_id else None

    def create(self, owner_id: str, *, session_id: str | None = None, kind: str = "general", knowledge_space_id: str | None = None, knowledge_folder_id: str | None = None) -> Session:
        if kind == "knowledge" and not knowledge_space_id:
            raise ValueError("knowledge space is required")
        session = Session(id=session_id or str(uuid4()), owner_id=owner_id, kind=kind, knowledge_space_id=knowledge_space_id, knowledge_folder_id=knowledge_folder_id)
        self.sessions[session.id] = session
        self._event(session, "", "session_created", status="idle")
        self._save()
        return session

    def rename(self, owner_id: str, session_id: str, title: str) -> Session | None:
        session = self.get(owner_id, session_id)
        if session is None:
            return None
        normalized = title.strip()
        if not normalized or len(normalized) > 80:
            raise ValueError("session title must contain 1 to 80 characters")
        session.title = normalized
        self._save()
        return session

    def list_workspaces(self, owner_id: str) -> list[Workspace]:
        return sorted((w for w in self.workspaces.values() if w.owner_id == owner_id), key=lambda w: (w.sort, w.name))

    def create_workspace(self, owner_id: str, name: str, description: str = "") -> Workspace:
        workspace = Workspace(id=str(uuid4()), owner_id=owner_id, name=name.strip(), description=description.strip())
        self.workspaces[workspace.id] = workspace
        self._save()
        return workspace

    def get_workspace(self, owner_id: str, workspace_id: str) -> Workspace | None:
        workspace = self.workspaces.get(workspace_id)
        return workspace if workspace and workspace.owner_id == owner_id else None

    def delete_workspace(self, owner_id: str, workspace_id: str) -> bool:
        if not self.get_workspace(owner_id, workspace_id):
            return False
        self.workspaces.pop(workspace_id, None)
        for session in self.list(owner_id):
            if session.workspace_id == workspace_id:
                session.workspace_id = None
        self._save()
        return True

    def assign_workspace(self, session: Session, workspace_id: str | None) -> Session:
        if session.messages:
            raise RuntimeError("session configuration is locked after the first message")
        session.workspace_id = workspace_id
        self._save()
        return session

    def update_preferences(self, session: Session, *, mode: str | None = None, model: str | None = None, reasoning_effort: str | None = None) -> Session:
        if session.messages and mode is not None and mode != session.mode:
            raise RuntimeError("session mode is locked after the first message")
        if mode is not None:
            session.mode = mode
        if model is not None:
            session.model = model
        if reasoning_effort is not None:
            session.reasoning_effort = reasoning_effort
        self._save()
        return session

    async def send(self, session: Session, content: str, *, mode: str | None = None, model: str | None = None, reasoning_effort: str | None = None, knowledge_context: dict[str, Any] | None = None, knowledge_delegation_token: str | None = None, runtime_context: dict[str, Any] | None = None) -> str:
        if session.active_task and not session.active_task.done():
            raise RuntimeError("session is already running")
        if session.messages and mode is not None and mode != session.mode:
            raise RuntimeError("session mode is locked after the first message")
        run_id = str(uuid4())
        session.cancel_event = asyncio.Event()
        if mode is not None: session.mode = mode
        if model is not None: session.model = model
        if reasoning_effort is not None: session.reasoning_effort = reasoning_effort
        session.status = "queued"
        if session.kind != "knowledge" and knowledge_context:
            raise RuntimeError("knowledge context requires a knowledge session")
        turn_scope = None
        if session.kind == "knowledge":
            context = knowledge_context or {}
            turn_scope = {
                "spaceId": session.knowledge_space_id,
                "folderId": context.get("folderId") or session.knowledge_folder_id,
                "targets": context.get("targets") or [],
                "createdAt": now(),
            }
        session.messages.append({"role": "user", "content": content, "createdAt": now(), **({"knowledgeContext": turn_scope} if turn_scope else {})})
        if session.title == "新建会话":
            session.title = content.strip().replace("\n", " ")[:32] or "新建会话"
        self._event(session, run_id, "user_message", content=content)
        self._event(session, run_id, "status", status="queued")
        session.active_task = asyncio.create_task(self._run(session, run_id, content, turn_scope, knowledge_delegation_token, runtime_context))
        self._save()
        return run_id

    async def _run(self, session: Session, run_id: str, content: str, turn_scope: dict[str, Any] | None = None, knowledge_delegation_token: str | None = None, runtime_context: dict[str, Any] | None = None) -> None:
        session.status = "running"
        self._event(session, run_id, "status", status="running")
        collected = ""
        reasoning_collected = ""
        started = now()
        started_clock = monotonic()
        terminal_reason = "completed"
        run_mode = session.mode
        run_model = session.model
        run_reasoning_effort = session.reasoning_effort
        selection_verified = False
        tool_steps: list[dict[str, Any]] = []
        tool_indexes: dict[str, int] = {}
        citations: list[dict[str, Any]] = []
        citation_ids: set[str] = set()
        history = session.messages[:-1]
        try:
            adapter_context = {"kind": session.kind, "ownerId": session.owner_id, "sessionId": session.id, "runId": run_id, "knowledge": turn_scope, "knowledgeDelegationToken": knowledge_delegation_token, **(runtime_context or {})}
            if session.kind == "scheduled":
                allowed = {"research.read", "knowledge.read", "market.read"}
                adapter_context["capabilities"] = [item for item in adapter_context.get("capabilities", []) if item in allowed]
            async for item in self.adapter.run(session.id, content, session.cancel_event, mode=run_mode, model=run_model, reasoning_effort=run_reasoning_effort, history=history, runtime_context=adapter_context):
                if item["type"] == "assistant_chunk":
                    collected += item["content"]
                elif item["type"] == "assistant_reasoning_chunk":
                    reasoning_collected += item["content"]
                elif item["type"] in {"tool_call", "tool_result"}:
                    call_id = str(item.get("callId") or "")
                    if call_id:
                        existing_index = tool_indexes.get(call_id)
                        if existing_index is None:
                            tool_indexes[call_id] = len(tool_steps)
                            tool_steps.append({
                                "callId": call_id,
                                "rootCallId": item.get("rootCallId") or call_id,
                                "parentCallId": item.get("parentCallId"),
                                "name": item.get("name") or "tool",
                                "arguments": item.get("arguments"),
                                "argumentsTruncated": bool(item.get("argumentsTruncated")),
                                "content": item.get("content", ""),
                                "contentTruncated": bool(item.get("contentTruncated")),
                                "isError": bool(item.get("isError")),
                                "error": item.get("error"),
                                "meta": item.get("meta"),
                                "turn": item.get("turn"),
                                "step": item.get("step"),
                                "source": item.get("source", "standard"),
                                "status": item.get("status", "running"),
                                "startedAt": item.get("startedAt"),
                                "finishedAt": item.get("finishedAt"),
                            })
                        else:
                            previous = tool_steps[existing_index]
                            tool_steps[existing_index] = {**previous, **{key: value for key, value in item.items() if key != "type" and value is not None}, "callId": call_id, "name": previous.get("name") if item.get("name") in {None, "tool"} else item.get("name")}
                    if item["type"] == "tool_result":
                        candidate = item.get("content")
                        if isinstance(candidate, str):
                            try: candidate = json.loads(candidate)
                            except (TypeError, ValueError): candidate = None
                        effective_name = str(item.get("name") or "")
                        if effective_name in {"", "tool"} and call_id in tool_indexes:
                            effective_name = str(tool_steps[tool_indexes[call_id]].get("name") or "")
                        if effective_name.startswith("mcp__knowledge__"):
                            for citation in knowledge_citations(candidate):
                                if citation["citationId"] not in citation_ids:
                                    citation_ids.add(citation["citationId"])
                                    citations.append(citation)
                        if isinstance(candidate, dict) and candidate.get("id") and candidate.get("preview"):
                            self._event(session, run_id, "scheduled_task_draft", draftId=candidate["id"], preview=candidate["preview"], nextRunAt=candidate.get("nextRunAt"), expiresAt=candidate.get("expiresAt"))
                run_model = item.get("model", run_model)
                run_reasoning_effort = item.get("reasoningEffort", run_reasoning_effort)
                selection_verified = item.get("selectionVerified", selection_verified)
                event_fields = {key: value for key, value in item.items() if key != "type"}
                if item["type"] == "assistant_message":
                    event_fields.update({"reasoning": reasoning_collected, "tools": tool_steps, "citations": select_message_citations(citations, collected), "mode": run_mode, "model": run_model, "reasoningEffort": run_reasoning_effort})
                self._event(session, run_id, item["type"], **event_fields)
            if session.cancel_event.is_set():
                session.status = "cancelled"
                terminal_reason = "cancelled"
                session.run_summary = {"startedAt": started, "finishedAt": now(), "durationMs": round((monotonic() - started_clock) * 1000), "steps": len(tool_steps), "inputTokens": None, "outputTokens": None, "terminalReason": terminal_reason, "mode": run_mode, "model": run_model or None, "reasoningEffort": run_reasoning_effort, "selectionVerified": selection_verified}
                self._event(session, run_id, "status", status="cancelled")
                self._event(session, run_id, "done", reason="cancelled", summary=session.run_summary)
            else:
                if collected or reasoning_collected or tool_steps:
                    session.messages.append({"role": "assistant", "content": collected, "reasoning": reasoning_collected, "tools": tool_steps, "citations": select_message_citations(citations, collected), "createdAt": now()})
                session.status = "idle"
                terminal_reason = "max_tokens" if any(e.get("reason") == "max_tokens" for e in session.events if e.get("runId") == run_id) else "completed"
                session.run_summary = {"startedAt": started, "finishedAt": now(), "durationMs": round((monotonic() - started_clock) * 1000), "steps": len(tool_steps), "inputTokens": None, "outputTokens": None, "terminalReason": terminal_reason, "mode": run_mode, "model": run_model or None, "reasoningEffort": run_reasoning_effort, "selectionVerified": selection_verified}
                self._event(session, run_id, "status", status="idle")
                self._event(session, run_id, "done", reason=terminal_reason, summary=session.run_summary, mode=run_mode, model=run_model, reasoningEffort=run_reasoning_effort)
        except Exception as exc:
            session.status = "failed"
            session.run_summary = {"startedAt": started, "finishedAt": now(), "durationMs": round((monotonic() - started_clock) * 1000), "steps": len(tool_steps), "inputTokens": None, "outputTokens": None, "terminalReason": "error", "mode": run_mode, "model": run_model or None, "reasoningEffort": run_reasoning_effort}
            self._event(session, run_id, "status", status="failed")
            self._event(session, run_id, "error", message=str(exc))
            self._event(session, run_id, "done", reason="error", summary=session.run_summary)
        finally:
            self._save()

    async def cancel(self, session: Session) -> bool:
        task = session.active_task
        if not task or task.done():
            return False
        session.status = "cancelling"
        session.cancel_event.set()
        return True

    async def delete(self, owner_id: str, session_id: str) -> bool:
        session = self.get(owner_id, session_id)
        if session is None:
            return True
        await self.cancel(session)
        close_session = getattr(self.adapter, "close_session", None)
        if close_session is not None:
            await close_session(session_id)
        self.sessions.pop(session_id, None)
        self._save()
        return True

    async def subscribe(self, session: Session, after_seq: int = 0) -> AsyncIterator[dict[str, Any] | None]:
        queue: asyncio.Queue = asyncio.Queue()
        self.subscribers.setdefault(session.id, set()).add(queue)
        try:
            for event in session.events:
                if event["seq"] > after_seq:
                    yield event
            while True:
                try:
                    yield await asyncio.wait_for(queue.get(), timeout=10)
                except TimeoutError:
                    yield None
        finally:
            self.subscribers.get(session.id, set()).discard(queue)
