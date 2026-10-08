"""Internal HTTP entry point for the Harness Agent Runtime."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from config import Settings
from harness_client import create_adapter
from mcp.config import MCPConfig
from mcp.registry import MCPRegistry
from session_manager import SessionManager

registry = MCPRegistry(MCPConfig.from_env())
settings = Settings.from_env()
manager = SessionManager(create_adapter(settings, registry), settings.state_file)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        yield
    finally:
        close = getattr(manager.adapter, "close", None)
        if close is not None:
            await close()


app = FastAPI(title="go-ant-design-pro-admin Harness Agent Runtime", lifespan=lifespan)


class MessageRequest(BaseModel):
    content: str
    mode: str | None = None
    model: str | None = None
    reasoningEffort: str | None = None
    knowledgeContext: dict | None = None
    knowledgeDelegationToken: str | None = None
    runtimeContext: dict | None = None

class CreateSessionRequest(BaseModel):
    sessionId: str | None = None
    kind: str = "general"
    knowledgeSpaceId: str | None = None
    knowledgeFolderId: str | None = None

class PreferenceRequest(BaseModel):
    mode: str | None = None
    model: str | None = None
    reasoningEffort: str | None = None

class TitleRequest(BaseModel):
    title: str

class WorkspaceRequest(BaseModel):
    name: str
    description: str = ""

class WorkspaceAssignment(BaseModel):
    workspaceId: str | None = None

class OptimizeInstructionsRequest(BaseModel):
    instructions: str
    mode: str = "standard"
    model: str = ""
    reasoningEffort: str = "high"


def view(session):
    return {"id": session.id, "ownerId": session.owner_id, "title": session.title, "status": session.status, "messages": session.messages, "lastSeq": session.events[-1]["seq"] if session.events else 0, "workspaceId": session.workspace_id, "mode": session.mode, "model": session.model or None, "reasoningEffort": session.reasoning_effort, "runSummary": session.run_summary, "kind": session.kind, "knowledgeSpaceId": session.knowledge_space_id, "knowledgeFolderId": session.knowledge_folder_id}

def workspace_view(workspace):
    return {"id": workspace.id, "name": workspace.name, "description": workspace.description, "sort": workspace.sort, "sessionCount": sum(1 for s in manager.sessions.values() if s.owner_id == workspace.owner_id and s.workspace_id == workspace.id), "createdAt": workspace.created_at, "updatedAt": workspace.updated_at}


@app.get("/health")
async def health():
    return {"status": "ok", "adapter": settings.adapter, "harnessWebUrl": settings.harness_web_url, "mcp": registry.health()}


@app.get("/sessions")
async def sessions(owner_id: str, kind: str | None = None, knowledgeSpaceId: str | None = None, surface: str | None = None):
    del surface
    effective_kind = kind or "general"
    return {"data": [view(s) for s in manager.list(owner_id, kind=effective_kind, knowledge_space_id=knowledgeSpaceId, include_scheduled=effective_kind == "scheduled")]}


@app.post("/sessions")
async def create_session(request: CreateSessionRequest, owner_id: str):
    if request.kind not in {"general", "knowledge", "scheduled"}:
        raise HTTPException(400, "unsupported session kind")
    if request.kind == "knowledge" and not request.knowledgeSpaceId:
        raise HTTPException(400, "knowledgeSpaceId is required")
    existing = manager.get(owner_id, request.sessionId) if request.sessionId else None
    if existing:
        return view(existing)
    return view(manager.create(owner_id, session_id=request.sessionId, kind=request.kind, knowledge_space_id=request.knowledgeSpaceId, knowledge_folder_id=request.knowledgeFolderId))


@app.get("/sessions/{session_id}")
async def get_session(session_id: str, owner_id: str):
    session = manager.get(owner_id, session_id)
    if not session:
        raise HTTPException(404, "session not found")
    return view(session)


@app.patch("/sessions/{session_id}/title")
async def rename_session(session_id: str, request: TitleRequest, owner_id: str):
    try:
        session = manager.rename(owner_id, session_id, request.title)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    if not session:
        raise HTTPException(404, "session not found")
    return view(session)


@app.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, request: MessageRequest, owner_id: str):
    session = manager.get(owner_id, session_id)
    if not session:
        raise HTTPException(404, "session not found")
    try:
        if request.mode is not None and request.mode not in {"standard", "ptc"}:
            raise RuntimeError("unsupported mode")
        if request.reasoningEffort is not None and request.reasoningEffort not in {"off", "low", "high", "max"}:
            raise RuntimeError("unsupported reasoning effort")
        run_id = await manager.send(session, request.content, mode=request.mode, model=request.model, reasoning_effort=request.reasoningEffort, knowledge_context=request.knowledgeContext, knowledge_delegation_token=request.knowledgeDelegationToken, runtime_context=request.runtimeContext)
    except RuntimeError as exc:
        raise HTTPException(409, str(exc)) from exc
    return {"sessionId": session_id, "runId": run_id}


@app.get("/capabilities")
async def capabilities():
    models = settings.models or ((settings.model,) if settings.model else ("deterministic", "deepseek-v4-pro", "deepseek-v4-flash"))
    return {"modes": [{"id": "standard", "enabled": True}, {"id": "ptc", "enabled": True}], "models": [{"id": item, "label": item} for item in models], "reasoningEfforts": ["off", "low", "high", "max"], "defaultModel": settings.model or models[0], "defaultReasoningEffort": "high"}

@app.get("/workspaces")
async def workspaces(owner_id: str):
    return {"data": [workspace_view(w) for w in manager.list_workspaces(owner_id)]}

@app.post("/scheduled-task-instructions/optimize")
async def optimize_scheduled_task_instructions(request: OptimizeInstructionsRequest):
    instructions = request.instructions.strip()
    if not instructions:
        raise HTTPException(400, "instructions are required")
    if len(instructions) > 12000:
        raise HTTPException(400, "instructions are too long")
    if request.mode not in {"standard", "ptc"} or request.reasoningEffort not in {"off", "low", "high", "max"}:
        raise HTTPException(400, "unsupported optimization options")
    try:
        optimized = await manager.adapter.optimize_instructions(instructions, mode=request.mode, model=request.model, reasoning_effort=request.reasoningEffort)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    if not optimized:
        raise HTTPException(502, "optimizer returned an empty result")
    return {"optimizedInstructions": optimized}

@app.post("/workspaces")
async def create_workspace(request: WorkspaceRequest, owner_id: str):
    if not request.name.strip(): raise HTTPException(400, "workspace name is required")
    return workspace_view(manager.create_workspace(owner_id, request.name, request.description))

@app.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, owner_id: str):
    return {"deleted": manager.delete_workspace(owner_id, workspace_id)}

@app.patch("/sessions/{session_id}/workspace")
async def assign_workspace(session_id: str, request: WorkspaceAssignment, owner_id: str):
    session = manager.get(owner_id, session_id)
    if not session: raise HTTPException(404, "session not found")
    if request.workspaceId is not None and not manager.get_workspace(owner_id, request.workspaceId): raise HTTPException(404, "workspace not found")
    try:
        return view(manager.assign_workspace(session, request.workspaceId))
    except RuntimeError as exc:
        raise HTTPException(409, str(exc)) from exc


@app.patch("/sessions/{session_id}/preferences")
async def preferences(session_id: str, request: PreferenceRequest, owner_id: str):
    session = manager.get(owner_id, session_id)
    if not session: raise HTTPException(404, "session not found")
    if session.active_task and not session.active_task.done(): raise HTTPException(409, "session is running")
    if request.mode is not None and request.mode not in {"standard", "ptc"}: raise HTTPException(400, "unsupported mode")
    if request.reasoningEffort is not None and request.reasoningEffort not in {"off", "low", "high", "max"}: raise HTTPException(400, "unsupported reasoning effort")
    try:
        return view(manager.update_preferences(session, mode=request.mode, model=request.model, reasoning_effort=request.reasoningEffort))
    except RuntimeError as exc:
        raise HTTPException(409, str(exc)) from exc


@app.post("/sessions/{session_id}/cancel")
async def cancel(session_id: str, owner_id: str):
    session = manager.get(owner_id, session_id)
    if not session:
        raise HTTPException(404, "session not found")
    return {"cancelled": await manager.cancel(session)}


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, owner_id: str):
    return {"deleted": await manager.delete(owner_id, session_id)}


@app.get("/sessions/{session_id}/events")
async def events(session_id: str, owner_id: str, after_seq: int = 0):
    session = manager.get(owner_id, session_id)
    if not session:
        raise HTTPException(404, "session not found")

    async def stream():
        async for event in manager.subscribe(session, after_seq):
            if event is None:
                yield ": heartbeat\n\n"
                continue
            yield f"event: agent\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream; charset=utf-8")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
