import os

from mcp.config import MCPConfig
from mcp.registry import MCPRegistry


def test_knowledge_server_is_optional(monkeypatch):
    monkeypatch.setenv("HARNESS_MCP_ENABLED", "knowledge")
    registry = MCPRegistry(MCPConfig.from_env())
    assert registry.health()["healthy"] is True
    assert registry.servers()["knowledge"]["transport"] == "stdio"


def test_unknown_server_is_reported(monkeypatch):
    monkeypatch.setenv("HARNESS_MCP_ENABLED", "missing")
    assert MCPRegistry(MCPConfig.from_env()).health()["healthy"] is False


def test_knowledge_runtime_environment_keeps_scope_out_of_tool_arguments(monkeypatch):
    monkeypatch.setenv("HARNESS_MCP_ENABLED", "knowledge")
    registry = MCPRegistry(MCPConfig.from_env())
    env = registry.runtime_environment({
        "knowledgeDelegationToken": "secret-token",
        "knowledge": {
            "spaceId": "space-a",
            "folderId": "folder-a",
            "targets": [{"targetId": "asset-a"}],
        },
    })
    assert env["KNOWLEDGE_MCP_SPACE_ID"] == "space-a"
    assert env["KNOWLEDGE_MCP_TARGET_IDS"] == "asset-a"
    assert env["KNOWLEDGE_MCP_SERVER_PATH"].replace("\\", "/").endswith("mcp/knowledge-server/server.py")
    assert env["KNOWLEDGE_MCP_CWD"]
    assert env["KNOWLEDGE_PLATFORM_URL"] == "http://127.0.0.1:18000"
    assert "secret-token" not in str(registry.servers())
