"""Configuration for the internal Harness Agent Runtime."""

from dataclasses import dataclass
import os
from pathlib import Path


def load_local_env() -> None:
    env_file = Path(__file__).resolve().parent / ".env.local"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


@dataclass(frozen=True)
class Settings:
    host: str = "127.0.0.1"
    port: int = 19100
    dsh_home: str = ""
    profile: str = "sdk"
    model: str = ""
    models: tuple[str, ...] = ()
    workspace: str = ""
    harness_web_url: str = "http://127.0.0.1:3080/"
    adapter: str = "deterministic"
    state_file: str = "agent-sdk-data/sessions.json"

    @classmethod
    def from_env(cls) -> "Settings":
        load_local_env()
        model = os.getenv("DSH_MODEL", "")
        configured_models = tuple(item.strip() for item in os.getenv("DSH_MODELS", "").split(",") if item.strip())
        return cls(
            host=os.getenv("AGENT_SDK_HOST", cls.host),
            port=int(os.getenv("AGENT_SDK_PORT", str(cls.port))),
            dsh_home=os.getenv("DSH_HOME", ""),
            profile=os.getenv("DSH_PROFILE", cls.profile),
            model=model,
            models=configured_models or tuple(dict.fromkeys(item for item in (model, "deepseek-v4-pro", "deepseek-v4-flash") if item)),
            workspace=os.getenv("DSH_WORKSPACE", ""),
            harness_web_url=os.getenv("HARNESS_WEB_URL", cls.harness_web_url),
            adapter=os.getenv("HARNESS_ADAPTER", cls.adapter),
            state_file=os.getenv("AGENT_SDK_STATE_FILE", cls.state_file),
        )

    def validate_live_sdk(self) -> None:
        missing = [name for name, value in (("DSH_HOME", self.dsh_home), ("DSH_MODEL", self.model)) if not value]
        if missing:
            raise RuntimeError("live Harness SDK requires: " + ", ".join(missing))
