from dataclasses import dataclass
import os
from pathlib import Path
from typing import Any
from .config import MCPConfig


@dataclass
class MCPRegistry:
    config: MCPConfig

    def health(self) -> dict:
        known = {"example", "knowledge", "automation"}
        errors = [f"unknown MCP server: {name}" for name in self.config.enabled if name not in known]
        return {"enabled": list(self.config.enabled), "healthy": not errors, "errors": errors, "servers": self.servers()}

    def servers(self) -> dict:
        result = {}
        if "knowledge" in self.config.enabled:
            result["knowledge"] = {"transport": "stdio", "command": self.config.knowledge_command, "args": list(self.config.knowledge_args)}
        if "automation" in self.config.enabled:
            result["automation"] = {"transport": "stdio", "command": self.config.automation_command, "args": list(self.config.automation_args)}
        return result

    def runtime_environment(self, runtime_context: dict[str, Any] | None) -> dict[str, str]:
        if not runtime_context:
            return {}
        result = {}
        if "automation" in self.config.enabled:
            result.update({"HARNESS_CONTEXT_OWNER_ID": str(runtime_context.get("ownerId") or ""), "HARNESS_CONTEXT_SESSION_ID": str(runtime_context.get("sessionId") or ""), "HARNESS_CONTEXT_RUN_ID": str(runtime_context.get("runId") or ""), "HARNESS_INTERNAL_SECRET": os.getenv("HARNESS_INTERNAL_SECRET", ""), "AUTOMATION_PLATFORM_URL": os.getenv("AUTOMATION_PLATFORM_URL", "http://127.0.0.1:18000")})
        if "knowledge" not in self.config.enabled:
            return result
        knowledge = runtime_context.get("knowledge") or {}
        token = str(runtime_context.get("knowledgeDelegationToken") or "").strip()
        space_id = str(knowledge.get("spaceId") or "").strip()
        if not token or not space_id:
            return result
        targets = knowledge.get("targets") or []
        target_ids = [str(item.get("targetId")) for item in targets if isinstance(item, dict) and item.get("targetId")]
        repo_root = Path(__file__).resolve().parents[2]
        result.update({
            "KNOWLEDGE_MCP_COMMAND": self.config.knowledge_command,
            "KNOWLEDGE_MCP_SERVER_PATH": str((repo_root / "mcp" / "knowledge-server" / "server.py").resolve()),
            "KNOWLEDGE_MCP_CWD": str(repo_root),
            "KNOWLEDGE_PLATFORM_URL": os.getenv("KNOWLEDGE_PLATFORM_URL", "http://127.0.0.1:18000"),
            "KNOWLEDGE_MCP_TIMEOUT": os.getenv("KNOWLEDGE_MCP_TIMEOUT", "30"),
            "KNOWLEDGE_MCP_DELEGATION_TOKEN": token,
            "KNOWLEDGE_MCP_SPACE_ID": space_id,
            "KNOWLEDGE_MCP_FOLDER_ID": str(knowledge.get("folderId") or ""),
            "KNOWLEDGE_MCP_TARGET_IDS": ",".join(target_ids),
        })
        return result
