"""Translate SDK callbacks into the stable easy-money event contract."""

from dataclasses import dataclass
from typing import Any


@dataclass
class EventAdapter:
    session_id: str
    run_id: str
    seq: int = 0

    def make(self, event_type: str, **fields: Any) -> dict[str, Any]:
        self.seq += 1
        return {"sessionId": self.session_id, "runId": self.run_id, "seq": self.seq, "type": event_type, **fields}

