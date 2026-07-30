import os
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services import telemetry_service

router = APIRouter()


class EventBody(BaseModel):
    user_id: str = Field(..., min_length=6, max_length=160)
    session_id: str = Field(..., min_length=4, max_length=100)
    name: str = Field(..., min_length=1, max_length=80)
    path: str = ""
    course_type: str = ""
    duration_ms: int | None = None
    ok: bool = True
    error_code: str = ""
    content_preview: str = ""
    payload: dict[str, Any] = {}
    consent: bool = False


def _is_admin(token: str | None) -> bool:
    expected = os.getenv("AITEACHER_ADMIN_TOKEN", "")
    return bool(expected and token and token == expected)


@router.post("/telemetry/events")
def add_event(body: EventBody):
    if not body.consent:
        return {"ok": True, "stored": False}
    telemetry_service.record(body.model_dump())
    return {"ok": True, "stored": True}


@router.get("/telemetry/metrics")
def get_metrics(days: int = 30, x_admin_token: str | None = Header(default=None)):
    # Aggregates are safe for the dashboard shell; content requires admin auth.
    return telemetry_service.metrics(days=days, include_content=_is_admin(x_admin_token))


@router.delete("/telemetry/users/{user_id}")
def erase_user(user_id: str, x_user_id: str | None = Header(default=None)):
    if x_user_id != user_id:
        raise HTTPException(403, "identity mismatch")
    return {"ok": True, "deleted": telemetry_service.delete_user(user_id)}
