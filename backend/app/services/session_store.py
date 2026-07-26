"""进程内会话缓存（Demo 够用）。"""
from __future__ import annotations

from typing import Any

_SESSIONS: dict[str, dict[str, Any]] = {}


def save(session: dict[str, Any]) -> str:
    case_id = session["case_id"]
    _SESSIONS[case_id] = session
    return case_id


def get(case_id: str) -> dict[str, Any] | None:
    return _SESSIONS.get(case_id)
