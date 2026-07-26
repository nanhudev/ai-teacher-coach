from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.agents import review_agent
from app.services.document_parser import extract_from_bytes

router = APIRouter(prefix="/review", tags=["review"])


class ReviewTextRequest(BaseModel):
    lesson_text: str = ""
    ppt_text: str = ""
    topic_hint: str = ""
    source_files: list[str] = Field(default_factory=list)


@router.post("/analyze")
async def analyze_uploads(
    topic_hint: str = Form(""),
    lesson_text: str = Form(""),
    ppt_text: str = Form(""),
    files: list[UploadFile] | None = File(None),
):
    """上传教案/课件 → 解析 → DeepSeek（或本地规则）诊断报告。"""
    extracted: list[dict[str, Any]] = []
    lesson_parts: list[str] = []
    ppt_parts: list[str] = []
    names: list[str] = []

    if lesson_text.strip():
        lesson_parts.append(lesson_text.strip())
        names.append("pasted-lesson.txt")
    if ppt_text.strip():
        ppt_parts.append(ppt_text.strip())
        names.append("pasted-ppt.txt")

    for f in files or []:
        raw = await f.read()
        if not raw:
            continue
        if len(raw) > 12_000_000:
            raise HTTPException(400, f"{f.filename} 过大（限 12MB）")
        info = extract_from_bytes(f.filename or "upload.bin", raw)
        extracted.append(info)
        names.append(info.get("filename") or f.filename or "file")
        kind = info.get("kind")
        text = info.get("text") or ""
        if kind == "ppt":
            ppt_parts.append(text)
        else:
            lesson_parts.append(text)

    try:
        report = review_agent.review_course(
            lesson_text="\n\n".join(lesson_parts),
            ppt_text="\n\n".join(ppt_parts),
            topic_hint=topic_hint,
            source_files=names,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    report["parsed_files"] = [
        {
            "filename": x.get("filename"),
            "kind": x.get("kind"),
            "chars": x.get("chars"),
            "slide_count": x.get("slide_count"),
        }
        for x in extracted
    ]
    return report


@router.post("/analyze-text")
def analyze_text(body: ReviewTextRequest):
    try:
        return review_agent.review_course(
            lesson_text=body.lesson_text,
            ppt_text=body.ppt_text,
            topic_hint=body.topic_hint,
            source_files=body.source_files or ["text"],
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
