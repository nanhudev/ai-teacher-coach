"""Privacy-aware product analytics store.

SQLite is the local fallback. Set TELEMETRY_DB_PATH to a persistent mounted path
in CloudRun; the API contract stays unchanged when replaced by CloudBase DB.
"""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(os.getenv("TELEMETRY_DB_PATH", "/tmp/aiteacher-telemetry.sqlite3"))
RETENTION_DAYS = max(7, min(365, int(os.getenv("TELEMETRY_RETENTION_DAYS", "90"))))


def _db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        create table if not exists events(
          id integer primary key autoincrement,
          ts integer not null,
          user_id text not null,
          session_id text not null,
          name text not null,
          path text,
          course_type text,
          duration_ms integer,
          ok integer,
          error_code text,
          content_preview text,
          payload text
        );
        create index if not exists idx_events_ts on events(ts);
        create index if not exists idx_events_user on events(user_id);
        """
    )
    cutoff = int(time.time()) - RETENTION_DAYS * 86400
    conn.execute("delete from events where ts < ?", (cutoff,))
    conn.commit()
    return conn


def safe_user_id(raw: str) -> str:
    salt = os.getenv("TELEMETRY_HASH_SALT", "aiteacher")
    return hashlib.sha256(f"{salt}:{raw}".encode()).hexdigest()[:24]


def record(data: dict[str, Any]) -> None:
    preview = str(data.get("content_preview") or "")[:240]
    payload = data.get("payload") if isinstance(data.get("payload"), dict) else {}
    with _db() as conn:
        conn.execute(
            """insert into events
            (ts,user_id,session_id,name,path,course_type,duration_ms,ok,error_code,content_preview,payload)
            values(?,?,?,?,?,?,?,?,?,?,?)""",
            (
                int(time.time()), safe_user_id(str(data["user_id"])),
                str(data.get("session_id") or "")[:80], str(data["name"])[:80],
                str(data.get("path") or "")[:160], str(data.get("course_type") or "")[:80],
                data.get("duration_ms"), 1 if data.get("ok", True) else 0,
                str(data.get("error_code") or "")[:120], preview,
                json.dumps(payload, ensure_ascii=False)[:4000],
            ),
        )


def metrics(days: int = 30, include_content: bool = False) -> dict[str, Any]:
    since = int(time.time()) - max(1, min(days, 365)) * 86400
    with _db() as conn:
        totals = conn.execute(
            """select count(*) events, count(distinct user_id) users,
            count(distinct session_id) sessions,
            sum(case when ok=0 then 1 else 0 end) errors
            from events where ts>=?""", (since,)
        ).fetchone()
        daily = conn.execute(
            """select date(ts,'unixepoch') day, count(distinct user_id) users,
            count(*) events from events where ts>=? group by day order by day""", (since,)
        ).fetchall()
        problems = conn.execute(
            """select error_code, count(*) count from events
            where ts>=? and ok=0 group by error_code order by count desc limit 12""", (since,)
        ).fetchall()
        courses = conn.execute(
            """select course_type, count(*) count from events
            where ts>=? and course_type!='' group by course_type order by count desc limit 12""", (since,)
        ).fetchall()
        detail = []
        if include_content:
            detail = conn.execute(
                """select ts,name,path,course_type,ok,error_code,content_preview
                from events where ts>=? order by ts desc limit 100""", (since,)
            ).fetchall()
    users = int(totals["users"] or 0)
    sessions = int(totals["sessions"] or 0)
    return {
        "period_days": days,
        "summary": {
            "users": users, "sessions": sessions, "events": int(totals["events"] or 0),
            "errors": int(totals["errors"] or 0),
            "sessions_per_user": round(sessions / users, 2) if users else 0,
        },
        "daily": [dict(x) for x in daily],
        "problems": [dict(x) for x in problems],
        "course_types": [dict(x) for x in courses],
        "details": [dict(x) for x in detail],
        "retention_note": f"事件保存 {RETENTION_DAYS} 天；用户标识已哈希。",
    }


def delete_user(raw_user_id: str) -> int:
    with _db() as conn:
        cur = conn.execute("delete from events where user_id=?", (safe_user_id(raw_user_id),))
        return cur.rowcount
