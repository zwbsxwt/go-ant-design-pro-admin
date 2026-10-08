"""MCP registration configuration. QMT is intentionally not enabled here."""

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class MCPConfig:
    enabled: tuple[str, ...] = ()
    knowledge_command: str = "python"
    knowledge_args: tuple[str, ...] = ("../mcp/knowledge-server/server.py",)
    automation_command: str = "python"
    automation_args: tuple[str, ...] = ("../mcp/automation-server/server.py",)

    @classmethod
    def from_env(cls) -> "MCPConfig":
        enabled = tuple(x.strip() for x in os.getenv("HARNESS_MCP_ENABLED", "example,automation").split(",") if x.strip())
        command = os.getenv("KNOWLEDGE_MCP_COMMAND", "python").strip() or "python"
        args = tuple(x.strip() for x in os.getenv("KNOWLEDGE_MCP_ARGS", "../mcp/knowledge-server/server.py").split(",") if x.strip())
        automation_command = os.getenv("AUTOMATION_MCP_COMMAND", "python").strip() or "python"
        automation_args = tuple(x.strip() for x in os.getenv("AUTOMATION_MCP_ARGS", "../mcp/automation-server/server.py").split(",") if x.strip())
        return cls(enabled, command, args, automation_command, automation_args)
