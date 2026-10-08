import asyncio
import json
from collections.abc import AsyncIterator
from pathlib import Path
from types import SimpleNamespace
import pytest

from config import Settings
from harness_client import DeepSeekHarnessAdapter, DeterministicAdapter
from session_manager import SessionManager, knowledge_citations, select_message_citations


def test_harness_profiles_use_neutral_context() -> None:
    profiles_dir = Path(__file__).resolve().parents[1] / "profiles"
    for name in ("standard.patch.yml", "ptc.patch.yml"):
        content = (profiles_dir / name).read_text(encoding="utf-8")
        assert "id: system-prompt" in content
        assert "persona: ''" in content
        assert "id: agent-instructions" in content
        assert "disabled: true" in content


def test_knowledge_profile_registers_mcp_and_disables_local_retrieval() -> None:
    profile = (Path(__file__).resolve().parents[1] / "profiles" / "knowledge.patch.yml").read_text(encoding="utf-8")
    assert "@deepseek-ai/dsh-mcp-client" in profile
    assert "serverName: knowledge" in profile
    for plugin_id in ("tool-fs", "tool-fs-search", "tool-pwsh", "tool-web", "tool-subagent"):
        assert f"- id: {plugin_id}\n  disabled: true" in profile


def test_knowledge_runtime_adds_mcp_patch(monkeypatch, tmp_path) -> None:
    captured = {}

    class FakeHarness:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setitem(__import__("sys").modules, "deepseek_harness", SimpleNamespace(DeepSeekHarness=FakeHarness))
    adapter = DeepSeekHarnessAdapter(Settings(dsh_home=str(tmp_path), model="deepseek-v4-pro", workspace=str(tmp_path), adapter="live"))

    adapter._create_client("standard", "deepseek-v4-pro", "high", {"kind": "knowledge"})

    assert captured["patches"][-1].endswith("knowledge.patch.yml")


class SlowAdapter:
    async def run(self, _session_id: str, _content: str, cancel: asyncio.Event, **_kwargs) -> AsyncIterator[dict]:
        await asyncio.sleep(0.02)
        if cancel.is_set():
            return
        yield {"type": "assistant_chunk", "content": "late"}


class ReasoningAdapter:
    async def run(self, _session_id: str, _content: str, cancel: asyncio.Event, **_kwargs) -> AsyncIterator[dict]:
        if cancel.is_set():
            return
        yield {"type": "assistant_reasoning_chunk", "content": "先分析问题。"}
        yield {"type": "assistant_reasoning_chunk", "content": "再给出结论。"}
        yield {"type": "assistant_chunk", "content": "最终答案"}
        yield {"type": "assistant_message", "content": "最终答案"}


class ToolAdapter:
    async def run(self, _session_id: str, _content: str, cancel: asyncio.Event, **_kwargs) -> AsyncIterator[dict]:
        if cancel.is_set():
            return
        yield {"type": "tool_call", "callId": "call-1", "rootCallId": "call-1", "parentCallId": None, "name": "web_search", "arguments": {"query": "A股机器人"}, "status": "running", "source": "standard"}
        yield {"type": "tool_result", "callId": "call-1", "rootCallId": "call-1", "parentCallId": None, "name": "tool", "content": "搜索结果", "isError": False, "status": "completed", "source": "standard"}
        yield {"type": "assistant_chunk", "content": "完成"}
        yield {"type": "assistant_message", "content": "完成"}


class KnowledgeToolAdapter:
    async def run(self, _session_id: str, _content: str, cancel: asyncio.Event, **_kwargs) -> AsyncIterator[dict]:
        if cancel.is_set():
            return
        result = {"data": [{"space_id": "space-a", "target_type": "markdown", "target_id": "node-1", "title": "测试研报", "path": "行业/测试研报.md", "chunk_index": 2, "citation_id": "kb:markdown:node-1:2"}]}
        yield {"type": "tool_call", "callId": "call-kb", "name": "mcp__knowledge__knowledge_search", "arguments": {"query": "测试"}, "status": "running", "source": "standard"}
        yield {"type": "tool_result", "callId": "call-kb", "name": "tool", "content": json.dumps(result, ensure_ascii=False), "isError": False, "status": "completed", "source": "standard"}
        yield {"type": "assistant_chunk", "content": "知识库答案"}
        yield {"type": "assistant_message", "content": "知识库答案"}


def test_knowledge_citations_normalize_markdown_to_node() -> None:
    values = knowledge_citations({"data": [{"space_id": "s", "target_type": "markdown", "target_id": "n", "citation_id": "kb:markdown:n:0", "chunk_index": 0}]})
    assert values == [{"citationId": "kb:markdown:n:0", "spaceId": "s", "targetType": "node", "targetId": "n", "title": "", "path": "", "chunkIndex": 0}]


def test_message_citations_prefer_named_documents_and_deduplicate_chunks() -> None:
    citations = [
        {"citationId": "kb:asset:a:0", "targetId": "a", "title": "QMT 手册.pdf"},
        {"citationId": "kb:asset:a:1", "targetId": "a", "title": "QMT 手册.pdf"},
        {"citationId": "kb:node:b:0", "targetId": "b", "title": "新能源研报.md"},
    ]
    selected = select_message_citations(citations, "根据新能源研报，产业链景气度改善。")
    assert [item["targetId"] for item in selected] == ["b"]


def test_knowledge_tool_results_persist_clickable_citations(tmp_path) -> None:
    manager = SessionManager(KnowledgeToolAdapter(), str(tmp_path / "sessions.json"))
    session = manager.create("u1", kind="knowledge", knowledge_space_id="space-a")

    async def ask():
        await manager.send(session, "测试")
        await session.active_task

    asyncio.run(ask())
    assert session.messages[-1]["citations"][0]["citationId"] == "kb:markdown:node-1:2"
    assistant_events = [event for event in session.events if event["type"] == "assistant_message"]
    assert assistant_events[-1]["citations"][0]["targetType"] == "node"


def test_multiple_sessions_and_ordered_completion(tmp_path):
    manager = SessionManager(DeterministicAdapter(), str(tmp_path / "sessions.json"))
    first = manager.create("u1")
    second = manager.create("u1")
    assert first.id != second.id
    assert manager.list("u1")[:2] == [second, first]
    async def run_message():
        await manager.send(first, "你好")
        await first.active_task

    asyncio.run(run_message())
    types = [event["type"] for event in first.events]
    assert types.count("assistant_reasoning_chunk") == 2
    assert "assistant_chunk" in types and types[-1] == "done"
    assert first.events[-1]["reason"] == "completed"
    assert all(first.events[i]["seq"] < first.events[i + 1]["seq"] for i in range(len(first.events) - 1))


def test_owner_isolation_and_utf8_persistence(tmp_path):
    path = tmp_path / "sessions.json"
    manager = SessionManager(DeterministicAdapter(), str(path))
    session = manager.create("甲")
    assert manager.get("乙", session.id) is None
    assert "甲" in path.read_text(encoding="utf-8")
    json.loads(path.read_text(encoding="utf-8"))


def test_knowledge_sessions_are_isolated_by_kind_and_space(tmp_path):
    path = tmp_path / "sessions.json"
    manager = SessionManager(DeterministicAdapter(), str(path))
    general = manager.create("u1")
    first = manager.create("u1", kind="knowledge", knowledge_space_id="space-a")
    second = manager.create("u1", kind="knowledge", knowledge_space_id="space-b")

    assert manager.list("u1") == [general]
    assert manager.list("u1", kind="general") == [general]
    assert manager.list("u1", kind="knowledge", knowledge_space_id="space-a") == [first]
    assert second not in manager.list("u1", kind="knowledge", knowledge_space_id="space-a")

    async def ask():
        await manager.send(first, "只分析当前资料", knowledge_context={
            "folderId": "folder-1",
            "targets": [{"targetType": "asset", "targetId": "asset-1"}],
        })
        await first.active_task

    asyncio.run(ask())
    scope = first.messages[0]["knowledgeContext"]
    assert scope["spaceId"] == "space-a"
    assert scope["folderId"] == "folder-1"
    assert scope["targets"][0]["targetId"] == "asset-1"

    restored = SessionManager(DeterministicAdapter(), str(path))
    assert restored.get("u1", first.id).kind == "knowledge"
    assert restored.get("u1", first.id).knowledge_space_id == "space-a"


def test_session_title_can_be_renamed_and_persisted(tmp_path):
    path = tmp_path / "sessions.json"
    manager = SessionManager(DeterministicAdapter(), str(path))
    session = manager.create("u1")

    renamed = manager.rename("u1", session.id, "  自定义研究标题  ")
    assert renamed is not None
    assert renamed.title == "自定义研究标题"
    assert manager.rename("u2", session.id, "越权标题") is None

    restored = SessionManager(DeterministicAdapter(), str(path))
    assert restored.get("u1", session.id).title == "自定义研究标题"


def test_cancel_is_explicit_and_does_not_emit_completed(tmp_path):
    manager = SessionManager(SlowAdapter(), str(tmp_path / "sessions.json"))
    session = manager.create("u1")

    async def run_and_cancel():
        await manager.send(session, "stop")
        await manager.cancel(session)
        await session.active_task

    asyncio.run(run_and_cancel())
    assert session.events[-1]["type"] == "done"
    assert session.events[-1]["reason"] == "cancelled"
    assert not any(event.get("reason") == "completed" for event in session.events)

    async def cancel_again():
        return await manager.cancel(session)

    assert asyncio.run(cancel_again()) is False


def test_workspace_assignment_and_summary(tmp_path):
    manager = SessionManager(DeterministicAdapter(), str(tmp_path / "sessions.json"))
    workspace = manager.create_workspace("u1", "研究")
    session = manager.create("u1")
    session.workspace_id = workspace.id

    async def run_message():
        await manager.send(session, "中文", mode="standard", model="test-model")
        await session.active_task

    asyncio.run(run_message())
    assert session.run_summary["terminalReason"] == "completed"
    assert session.run_summary["durationMs"] >= 0
    manager._save()
    restored = SessionManager(DeterministicAdapter(), str(tmp_path / "sessions.json"))
    assert restored.list_workspaces("u1")[0].name == "研究"
    assert restored.get("u1", session.id).workspace_id == workspace.id
    assert restored.get("u1", session.id).title == "中文"


def test_scheduled_sessions_are_hidden_from_default_list(tmp_path):
    manager = SessionManager(DeterministicAdapter(), str(tmp_path / "sessions.json"))
    scheduled = manager.create("u1", session_id="task-session", kind="scheduled")
    manager.create("u1")
    assert scheduled.id == "task-session"
    assert len(manager.list("u1")) == 1
    assert manager.list("u1", kind="scheduled", include_scheduled=True)[0].id == "task-session"


def test_reasoning_is_streamed_and_persisted_separately(tmp_path):
    path = tmp_path / "sessions.json"
    manager = SessionManager(ReasoningAdapter(), str(path))
    session = manager.create("u1")

    async def run_message():
        await manager.send(session, "分析")
        await session.active_task

    asyncio.run(run_message())

    reasoning_events = [event for event in session.events if event["type"] == "assistant_reasoning_chunk"]
    assert [event["content"] for event in reasoning_events] == ["先分析问题。", "再给出结论。"]
    assert session.messages[-1]["content"] == "最终答案"
    assert session.messages[-1]["reasoning"] == "先分析问题。再给出结论。"

    restored = SessionManager(ReasoningAdapter(), str(path))
    assert restored.get("u1", session.id).messages[-1]["reasoning"] == "先分析问题。再给出结论。"


def test_ptc_and_model_preferences_are_attached_to_run(tmp_path):
    manager = SessionManager(DeterministicAdapter(), str(tmp_path / "sessions.json"))
    session = manager.create("u1")

    async def run_message():
        await manager.send(session, "PTC 测试", mode="ptc", model="deepseek-v4-pro", reasoning_effort="high")
        await session.active_task

    asyncio.run(run_message())
    assert session.mode == "ptc"
    assert session.model == "deepseek-v4-pro"
    assert session.reasoning_effort == "high"
    assert session.run_summary["mode"] == "ptc"
    assert session.run_summary["model"] == "deepseek-v4-pro"
    assert session.run_summary["reasoningEffort"] == "high"


def test_session_structure_is_locked_but_model_can_change_after_first_message(tmp_path):
    manager = SessionManager(DeterministicAdapter(), str(tmp_path / "sessions.json"))
    workspace = manager.create_workspace("u1", "研究")
    session = manager.create("u1")
    manager.assign_workspace(session, workspace.id)
    manager.update_preferences(session, mode="standard", model="model-a", reasoning_effort="low")

    async def run_first_message():
        await manager.send(session, "开始研究")
        await session.active_task

    asyncio.run(run_first_message())
    with pytest.raises(RuntimeError, match="locked"):
        manager.assign_workspace(session, None)
    with pytest.raises(RuntimeError, match="locked"):
        manager.update_preferences(session, mode="ptc")
    manager.update_preferences(session, model="model-b", reasoning_effort="max")
    assert session.model == "model-b"
    assert session.reasoning_effort == "max"


def test_live_adapter_reuses_one_runtime_for_follow_up_turns(monkeypatch, tmp_path):
    clients = []

    class FakeHarness:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
            self.calls = []
            self.closed = False
            clients.append(self)

        def run(self, content, *, session_id, on_notification):
            self.calls.append((content, session_id))
            return SimpleNamespace(final_response=f"回复：{content}", finish_reason="completed", events=[])

        def close(self):
            self.closed = True

    monkeypatch.setitem(__import__("sys").modules, "deepseek_harness", SimpleNamespace(DeepSeekHarness=FakeHarness))
    adapter = DeepSeekHarnessAdapter(Settings(dsh_home=str(tmp_path / "dsh"), model="test-model", adapter="live"))

    async def run_twice():
        first = [item async for item in adapter.run("easy-session", "hi", asyncio.Event(), model="test-model", reasoning_effort="max")]
        second = [item async for item in adapter.run("easy-session", "继续", asyncio.Event(), model="test-model", reasoning_effort="max")]
        await adapter.close()
        return first, second

    first, second = asyncio.run(run_twice())
    assert len(clients) == 1
    assert clients[0].calls[0][1] == clients[0].calls[1][1]
    assert clients[0].calls[0][1] != "easy-session"
    assert clients[0].kwargs["reasoning_effort"] == "max"
    assert first[-1]["content"] == "回复：hi"
    assert second[-1]["content"] == "回复：继续"
    assert clients[0].closed is True


def test_live_adapter_restarts_with_new_model_and_rehydrates_history(monkeypatch, tmp_path):
    clients = []

    class FakeHarness:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
            self.calls = []
            self.closed = False
            clients.append(self)

        def run(self, content, *, session_id, on_notification):
            self.calls.append((content, session_id))
            config = {"model": self.kwargs["model"], "reasoningEffort": self.kwargs.get("reasoning_effort")}
            return SimpleNamespace(final_response="已切换", finish_reason="completed", events=[{"type": "turn/start", "data": {"header": {"config": config}}}])

        def close(self):
            self.closed = True

    monkeypatch.setitem(__import__("sys").modules, "deepseek_harness", SimpleNamespace(DeepSeekHarness=FakeHarness))
    adapter = DeepSeekHarnessAdapter(Settings(dsh_home=str(tmp_path / "dsh"), model="model-a", adapter="live"))

    async def run_switch():
        await adapter.run("switch-session", "第一轮", asyncio.Event(), model="model-a", reasoning_effort="high").__anext__()
        history = [{"role": "user", "content": "第一轮"}, {"role": "assistant", "content": "第一轮回复"}]
        changed = [item async for item in adapter.run("switch-session", "第二轮", asyncio.Event(), model="model-b", reasoning_effort="low", history=history)]
        await adapter.close()
        return changed

    changed = asyncio.run(run_switch())
    assert len(clients) == 2
    assert clients[0].closed is True
    assert clients[1].kwargs["model"] == "model-b"
    assert clients[1].kwargs["reasoning_effort"] == "low"
    assert "第一轮回复" in clients[1].calls[0][0]
    assert "第二轮" in clients[1].calls[0][0]
    assert changed[-1]["model"] == "model-b"
    assert changed[-1]["reasoningEffort"] == "low"
    assert changed[-1]["selectionVerified"] is True


def test_live_adapter_emits_reasoning_delta_without_mixing_it_into_answer(monkeypatch, tmp_path):
    class FakeHarness:
        def __init__(self, **_kwargs):
            pass

        def run(self, _content, *, session_id, on_notification):
            assert session_id
            for chunk_type, text in (("reasoning-delta", "内部分析"), ("text-delta", "公开回答")):
                on_notification(SimpleNamespace(method="session.event", payload={"event": {"type": "assistant/chunk", "data": {"chunk": {"type": chunk_type, "text": text}}}}))
            return SimpleNamespace(final_response="公开回答", finish_reason="completed", events=[])

        def close(self):
            pass

    monkeypatch.setitem(__import__("sys").modules, "deepseek_harness", SimpleNamespace(DeepSeekHarness=FakeHarness))
    adapter = DeepSeekHarnessAdapter(Settings(dsh_home=str(tmp_path / "dsh"), model="test-model", adapter="live"))

    async def run_once():
        items = [item async for item in adapter.run("reasoning-session", "请分析", asyncio.Event(), model="test-model", reasoning_effort="high")]
        await adapter.close()
        return items

    items = asyncio.run(run_once())
    assert items[0] == {"type": "assistant_reasoning_chunk", "content": "内部分析"}
    assert items[1] == {"type": "assistant_chunk", "content": "公开回答"}
    assert items[-1]["type"] == "assistant_message"
    assert items[-1]["content"] == "公开回答"


def test_live_adapter_normalizes_standard_and_ptc_tool_events(monkeypatch, tmp_path):
    class FakeHarness:
        def __init__(self, **_kwargs):
            pass

        def run(self, _content, *, session_id, on_notification):
            assert session_id
            events = [
                {"type": "tool/call", "time": 1_700_000_000_000, "data": {"turn": 1, "step": 1, "callId": "root", "name": "web_search", "arguments": '{"query":"A股机器人"}'}},
                {"type": "tool/code-dispatch-start", "data": {"rootCallId": "root", "parentCallId": "root", "subCallId": "child", "name": "read_url", "arguments": {"url": "https://example.com"}}},
                {"type": "tool/code-dispatch", "data": {"rootCallId": "root", "parentCallId": "root", "subCallId": "child", "name": "read_url", "arguments": {"url": "https://example.com"}, "content": [{"type": "text", "text": "子调用结果"}], "isError": False}},
                {"type": "tool/result", "data": {"turn": 1, "step": 1, "message": {"source": {"callId": "root"}, "content": [{"type": "tool-result", "toolCallId": "root", "content": [{"type": "text", "text": "搜索结果"}], "isError": False}]}}},
            ]
            for event in events:
                on_notification(SimpleNamespace(method="session.event", payload={"event": event}))
            return SimpleNamespace(final_response="已完成", finish_reason="completed", events=[])

        def close(self):
            pass

    monkeypatch.setitem(__import__("sys").modules, "deepseek_harness", SimpleNamespace(DeepSeekHarness=FakeHarness))
    adapter = DeepSeekHarnessAdapter(Settings(dsh_home=str(tmp_path / "dsh"), model="test-model", adapter="live"))

    async def run_once():
        items = [item async for item in adapter.run("tool-session", "请搜索", asyncio.Event(), model="test-model")]
        await adapter.close()
        return items

    items = asyncio.run(run_once())
    calls = [item for item in items if item["type"] == "tool_call"]
    results = [item for item in items if item["type"] == "tool_result"]
    assert calls[0]["name"] == "web_search"
    assert calls[0]["arguments"] == {"query": "A股机器人"}
    assert calls[1]["source"] == "ptc"
    assert calls[1]["parentCallId"] == "root"
    assert results[0]["content"] == "子调用结果"
    assert results[1]["callId"] == "root"
    assert results[1]["content"] == "搜索结果"


def test_session_manager_persists_paired_tool_steps(tmp_path):
    manager = SessionManager(ToolAdapter(), str(tmp_path / "state.json"))
    session = manager.create("owner")

    async def run_once():
        await manager.send(session, "请搜索")
        await session.active_task

    asyncio.run(run_once())
    assistant = session.messages[-1]
    assert len(assistant["tools"]) == 1
    assert assistant["tools"][0]["callId"] == "call-1"
    assert assistant["tools"][0]["name"] == "web_search"
    assert assistant["tools"][0]["content"] == "搜索结果"
    assert assistant["tools"][0]["status"] == "completed"
    assert session.run_summary["steps"] == 1
    restored = SessionManager(ToolAdapter(), str(tmp_path / "state.json")).get("owner", session.id)
    assert restored is not None
    assert restored.messages[-1]["tools"][0]["arguments"]["query"] == "A股机器人"


def test_runtime_restart_marks_abandoned_run_failed(tmp_path):
    path = tmp_path / "state.json"
    path.write_text(json.dumps({"sessions": [{
        "id": "stuck", "owner_id": "owner", "title": "中断会话", "status": "running",
        "messages": [{"role": "user", "content": "分析"}],
        "events": [{"sessionId": "stuck", "runId": "run-1", "seq": 7, "type": "status", "status": "running"}],
    }], "workspaces": []}, ensure_ascii=False), encoding="utf-8")
    session = SessionManager(ToolAdapter(), str(path)).get("owner", "stuck")
    assert session is not None
    assert session.status == "failed"
    assert [event["type"] for event in session.events[-3:]] == ["status", "error", "done"]
    assert session.events[-1]["reason"] == "error"
