"""Harness SDK adapter boundary.

The deterministic implementation keeps local development and tests independent of
model credentials. The live adapter is intentionally loaded only when selected.
"""

import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from config import Settings
from mcp.registry import MCPRegistry


@dataclass
class AdapterResult:
    text: str
    reason: str = "completed"


class HarnessAdapter:
    async def run(self, session_id: str, content: str, cancel: asyncio.Event, *, mode: str = "standard", model: str = "", reasoning_effort: str = "high", history: list[dict[str, Any]] | None = None, runtime_context: dict[str, Any] | None = None) -> AsyncIterator[dict[str, Any]]:
        raise NotImplementedError

    async def optimize_instructions(self, content: str, *, mode: str = "standard", model: str = "", reasoning_effort: str = "high") -> str:
        prompt = (
            "请把下面的定时研究任务说明整理成清晰、可执行、适合无人值守运行的任务提示词。"
            "保留用户真实目标，不要凭空添加具体股票结论、交易动作或不存在的数据源。"
            "输出只包含优化后的任务说明，不要解释修改过程，不要使用代码块。\n\n"
            f"原始任务说明：\n{content.strip()}"
        )
        cancel = asyncio.Event()
        session_id = f"instruction-optimizer-{uuid4()}"
        chunks: list[str] = []
        try:
            async for event in self.run(session_id, prompt, cancel, mode=mode, model=model, reasoning_effort=reasoning_effort):
                if event.get("type") == "assistant_message" and event.get("content"):
                    return str(event["content"]).strip()
                if event.get("type") == "assistant_chunk" and event.get("content"):
                    chunks.append(str(event["content"]))
            return "".join(chunks).strip()
        finally:
            close_session = getattr(self, "close_session", None)
            if close_session is not None:
                await close_session(session_id)


class DeterministicAdapter(HarnessAdapter):
    async def optimize_instructions(self, content: str, *, mode: str = "standard", model: str = "", reasoning_effort: str = "high") -> str:
        del mode, model, reasoning_effort
        text = " ".join(content.split())
        return f"请围绕以下研究目标执行分析：{text}。输出关键事实、分析结论、风险提示和后续需要关注的事项，并明确区分数据事实与推断。"

    async def run(self, _session_id: str, content: str, cancel: asyncio.Event, *, mode: str = "standard", model: str = "", reasoning_effort: str = "high", history: list[dict[str, Any]] | None = None, runtime_context: dict[str, Any] | None = None) -> AsyncIterator[dict[str, Any]]:
        answer = f"已收到：{content}"
        for reasoning in ("正在理解问题。", "正在整理回答。"):
            if cancel.is_set():
                return
            await asyncio.sleep(0.12)
            yield {"type": "assistant_reasoning_chunk", "content": reasoning}
        for chunk in (answer[: max(1, len(answer) // 2)], answer[max(1, len(answer) // 2) :]):
            if cancel.is_set():
                return
            await asyncio.sleep(0.08)
            yield {"type": "assistant_chunk", "content": chunk}
        yield {"type": "assistant_message", "content": answer, "mode": mode, "model": model or "deterministic", "reasoningEffort": reasoning_effort}


class DeepSeekHarnessAdapter(HarnessAdapter):
    ARGUMENT_LIMIT = 16 * 1024
    RESULT_LIMIT = 64 * 1024

    def __init__(self, settings: Settings, registry: MCPRegistry | None = None) -> None:
        settings.validate_live_sdk()
        self.settings = settings
        self.registry = registry
        self._sessions: dict[str, tuple[str, str, str, str, Any]] = {}

    def _create_client(self, mode: str, model: str, reasoning_effort: str, runtime_context: dict[str, Any] | None = None) -> Any:
        from deepseek_harness import DeepSeekHarness

        profile_dir = Path(__file__).resolve().parent / "profiles"
        patches = [profile_dir / ("ptc.patch.yml" if mode == "ptc" else "standard.patch.yml")]
        if runtime_context and runtime_context.get("kind") == "knowledge":
            patches.append(profile_dir / "knowledge.patch.yml")
        return DeepSeekHarness(
            dsh_home=self.settings.dsh_home,
            profile=self.settings.profile,
            model=model or self.settings.model,
            reasoning_effort=None if reasoning_effort == "off" else reasoning_effort,
            cwd=self.settings.workspace or None,
            env=self.registry.runtime_environment(runtime_context) if self.registry else {},
            patches=tuple(str(path) for path in patches),
        )

    async def _client_for(self, session_id: str, mode: str, model: str, reasoning_effort: str, runtime_context: dict[str, Any] | None = None) -> tuple[Any, str, bool]:
        selected_model = model or self.settings.model
        existing = self._sessions.get(session_id)
        force_isolated_runtime = bool(runtime_context and runtime_context.get("kind") == "knowledge")
        if existing and not force_isolated_runtime and existing[0] == mode and existing[1] == selected_model and existing[2] == reasoning_effort:
            return existing[4], existing[3], False
        if existing:
            await asyncio.to_thread(existing[4].close)
        client = self._create_client(mode, selected_model, reasoning_effort, runtime_context)
        upstream_session_id = f"easy-money-{uuid4()}"
        self._sessions[session_id] = (mode, selected_model, reasoning_effort, upstream_session_id, client)
        return client, upstream_session_id, True

    @staticmethod
    def _rehydrated_prompt(history: list[dict[str, Any]], content: str) -> str:
        transcript = [{"role": item.get("role"), "content": item.get("content", "")} for item in history]
        return "以下是当前会话在切换模型或推理等级前的历史记录。请保持上下文连续，并回答最后的新消息。\n" + json.dumps({"history": transcript, "newMessage": content}, ensure_ascii=False)

    @staticmethod
    def _actual_selection(result: Any, fallback_model: str, fallback_reasoning: str) -> tuple[str, str, bool]:
        for event in reversed(getattr(result, "events", []) or []):
            data = event.get("data", {}) if isinstance(event, dict) else {}
            header = data.get("header", {}) if isinstance(data, dict) else {}
            config = header.get("config", {}) if isinstance(header, dict) else {}
            if isinstance(config, dict) and config.get("model"):
                return str(config["model"]), str(config.get("reasoningEffort") or "off"), True
        return fallback_model, fallback_reasoning, False

    @staticmethod
    def _event_time(event: dict[str, Any]) -> str:
        value = event.get("time")
        if isinstance(value, (int, float)):
            seconds = value / 1000 if value > 10_000_000_000 else value
            try:
                return datetime.fromtimestamp(seconds, timezone.utc).isoformat()
            except (OverflowError, OSError, ValueError):
                pass
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _json_size(value: Any) -> int:
        return len(json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str).encode("utf-8"))

    @classmethod
    def _bounded_arguments(cls, value: Any) -> tuple[Any, bool]:
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except (json.JSONDecodeError, TypeError):
                parsed = value
        else:
            parsed = value
        if cls._json_size(parsed) <= cls.ARGUMENT_LIMIT:
            return parsed, False
        encoded = json.dumps(parsed, ensure_ascii=False, default=str)
        suffix = "\n…（参数过长，已截断）"
        budget = max(0, cls.ARGUMENT_LIMIT - len(suffix.encode("utf-8")))
        raw = encoded.encode("utf-8")[:budget]
        return raw.decode("utf-8", errors="ignore") + suffix, True

    @staticmethod
    def _content_text(value: Any) -> str:
        if isinstance(value, str):
            return value
        if isinstance(value, list):
            return "\n".join(filter(None, (DeepSeekHarnessAdapter._content_text(item) for item in value)))
        if not isinstance(value, dict):
            return "" if value is None else str(value)
        if isinstance(value.get("text"), str):
            return value["text"]
        if "content" in value:
            return DeepSeekHarnessAdapter._content_text(value["content"])
        return ""

    @classmethod
    def _bounded_content(cls, value: Any) -> tuple[str, bool]:
        content = cls._content_text(value)
        encoded = content.encode("utf-8")
        if len(encoded) <= cls.RESULT_LIMIT:
            return content, False
        suffix = "\n…（结果过长，已截断）"
        budget = max(0, cls.RESULT_LIMIT - len(suffix.encode("utf-8")))
        return encoded[:budget].decode("utf-8", errors="ignore") + suffix, True

    @classmethod
    def _tool_event(cls, event: dict[str, Any]) -> dict[str, Any] | None:
        event_type = event.get("type")
        data = event.get("data", {})
        if not isinstance(data, dict):
            return None
        event_time = cls._event_time(event)
        if event_type in {"tool/call", "tool/code-dispatch-start"}:
            ptc = event_type == "tool/code-dispatch-start"
            call_id = data.get("subCallId") if ptc else data.get("callId")
            if not call_id:
                return None
            arguments, truncated = cls._bounded_arguments(data.get("arguments"))
            return {
                "type": "tool_call",
                "callId": str(call_id),
                "rootCallId": str(data.get("rootCallId") or call_id),
                "parentCallId": str(data["parentCallId"]) if data.get("parentCallId") else None,
                "name": str(data.get("name") or "tool"),
                "arguments": arguments,
                "argumentsTruncated": truncated,
                "turn": data.get("turn"),
                "step": data.get("step"),
                "source": "ptc" if ptc else "standard",
                "status": "running",
                "startedAt": event_time,
            }
        if event_type not in {"tool/result", "tool/code-dispatch"}:
            return None
        ptc = event_type == "tool/code-dispatch"
        result_block: dict[str, Any] = {}
        message = data.get("message", {})
        if isinstance(message, dict):
            blocks = message.get("content", [])
            if isinstance(blocks, list):
                result_block = next((item for item in blocks if isinstance(item, dict) and item.get("type") == "tool-result"), {})
        call_id = data.get("subCallId") if ptc else result_block.get("toolCallId")
        if not call_id and isinstance(message, dict):
            source = message.get("source", {})
            if isinstance(source, dict):
                call_id = source.get("callId")
        if not call_id:
            return None
        result_value = data.get("content") if ptc else result_block.get("content", [])
        content, truncated = cls._bounded_content(result_value)
        is_error = bool(data.get("isError") if ptc else result_block.get("isError")) or bool(data.get("error"))
        return {
            "type": "tool_result",
            "callId": str(call_id),
            "rootCallId": str(data.get("rootCallId") or call_id),
            "parentCallId": str(data["parentCallId"]) if data.get("parentCallId") else None,
            "name": str(data.get("name") or result_block.get("toolName") or "tool"),
            "content": content,
            "contentTruncated": truncated,
            "isError": is_error,
            "error": data.get("error"),
            "meta": data.get("meta"),
            "turn": data.get("turn"),
            "step": data.get("step"),
            "source": "ptc" if ptc else "standard",
            "status": "failed" if is_error else "completed",
            "finishedAt": event_time,
        }

    async def close_session(self, session_id: str) -> None:
        existing = self._sessions.pop(session_id, None)
        if existing:
            await asyncio.to_thread(existing[4].close)

    async def close(self) -> None:
        sessions = list(self._sessions.values())
        self._sessions.clear()
        await asyncio.gather(*(asyncio.to_thread(item[4].close) for item in sessions))

    async def run(self, session_id: str, content: str, cancel: asyncio.Event, *, mode: str = "standard", model: str = "", reasoning_effort: str = "high", history: list[dict[str, Any]] | None = None, runtime_context: dict[str, Any] | None = None) -> AsyncIterator[dict[str, Any]]:
        try:
            client, upstream_session_id, created = await self._client_for(session_id, mode, model, reasoning_effort, runtime_context)
        except ImportError as exc:
            raise RuntimeError("deepseek-harness SDK is not installed") from exc
        loop = asyncio.get_running_loop()
        chunks: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

        def on_notification(notification: Any) -> None:
            if getattr(notification, "method", "") != "session.event":
                return
            payload = getattr(notification, "payload", {})
            event = payload.get("event", {}) if isinstance(payload, dict) else {}
            if event.get("type") == "assistant/chunk":
                chunk = event.get("data", {}).get("chunk", {})
                chunk_type = chunk.get("type")
                text = chunk.get("text")
                if chunk_type == "text-delta" and text:
                    loop.call_soon_threadsafe(chunks.put_nowait, {"type": "assistant_chunk", "content": text})
                elif chunk_type == "reasoning-delta" and text:
                    loop.call_soon_threadsafe(chunks.put_nowait, {"type": "assistant_reasoning_chunk", "content": text})
                return
            normalized = self._tool_event(event)
            if normalized is not None:
                loop.call_soon_threadsafe(chunks.put_nowait, normalized)

        prompt = self._rehydrated_prompt(history, content) if created and history else content
        run_task = asyncio.create_task(asyncio.to_thread(client.run, prompt, session_id=upstream_session_id, on_notification=on_notification))
        cancel_task = asyncio.create_task(cancel.wait())
        text_streamed = False
        try:
            while not run_task.done():
                chunk_task = asyncio.create_task(chunks.get())
                done, pending = await asyncio.wait(
                    {run_task, cancel_task, chunk_task},
                    return_when=asyncio.FIRST_COMPLETED,
                )
                if cancel_task in done:
                    chunk_task.cancel()
                    await self.close_session(session_id)
                    return
                if chunk_task in done:
                    item = chunk_task.result()
                    text_streamed = text_streamed or item["type"] == "assistant_chunk"
                    yield item
                else:
                    chunk_task.cancel()
                for task in pending:
                    if task is not run_task and task is not cancel_task:
                        task.cancel()
            result = await run_task
            while not chunks.empty():
                item = chunks.get_nowait()
                text_streamed = text_streamed or item["type"] == "assistant_chunk"
                yield item
        finally:
            cancel_task.cancel()
        if cancel.is_set():
            return
        text = getattr(result, "final_response", None) or ""
        actual_model, actual_reasoning, selection_verified = self._actual_selection(result, model or self.settings.model, reasoning_effort)
        if getattr(result, "finish_reason", None) == "error":
            message = "Harness run failed"
            for event in reversed(getattr(result, "events", []) or []):
                reason = event.get("data", {}).get("reason", {}) if isinstance(event, dict) else {}
                error = reason.get("error", {}) if isinstance(reason, dict) else {}
                if error.get("message"):
                    message = error["message"]
                    break
            raise RuntimeError(message)
        if not text_streamed and text:
            yield {"type": "assistant_chunk", "content": text}
        if getattr(result, "finish_reason", None) == "max-tokens":
            yield {"type": "assistant_message", "content": text, "reason": "max_tokens", "model": actual_model, "reasoningEffort": actual_reasoning, "selectionVerified": selection_verified}
            return
        yield {"type": "assistant_message", "content": text, "model": actual_model, "reasoningEffort": actual_reasoning, "selectionVerified": selection_verified}


def create_adapter(settings: Settings, registry: MCPRegistry | None = None) -> HarnessAdapter:
    if settings.adapter.lower() in {"live", "harness", "deepseek"}:
        return DeepSeekHarnessAdapter(settings, registry)
    return DeterministicAdapter()
