"""Run one real Harness SDK turn using environment-only credentials."""

import asyncio
import os
from uuid import uuid4

from config import Settings
from harness_client import create_adapter


async def main() -> None:
    adapter = create_adapter(Settings.from_env())
    events = []
    async for event in adapter.run(
        f"easy-money-live-smoke-{uuid4()}",
        "请只回复：真实 Harness SDK 已接通",
        asyncio.Event(),
        mode=os.getenv("HARNESS_SMOKE_MODE", "standard"),
        model=os.getenv("DSH_MODEL", ""),
    ):
        events.append(event)
    chunks = "".join(event.get("content", "") for event in events if event.get("type") == "assistant_chunk")
    print(chunks or "NO_CHUNKS")


if __name__ == "__main__":
    asyncio.run(main())
