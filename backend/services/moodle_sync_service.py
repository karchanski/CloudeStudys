from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class SyncLogEntry:
    started_at: datetime
    finished_at: datetime | None = None
    status: str = "running"
    synced: int = 0
    message: str = "Sync started"


@dataclass
class MoodleSyncState:
    logs: list[SyncLogEntry] = field(default_factory=list)

    def start(self) -> SyncLogEntry:
        entry = SyncLogEntry(started_at=datetime.now(timezone.utc))
        self.logs.insert(0, entry)
        self.logs = self.logs[:20]
        return entry

    def finish(self, entry: SyncLogEntry, *, status: str, synced: int, message: str) -> None:
        entry.finished_at = datetime.now(timezone.utc)
        entry.status = status
        entry.synced = synced
        entry.message = message


state = MoodleSyncState()
