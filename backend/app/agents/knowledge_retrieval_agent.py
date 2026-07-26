"""Knowledge Retrieval Agent — 聚合多源语文资料并分桶。"""
from __future__ import annotations

from typing import Any

from app.services.search_service import search_chinese_topic


def retrieve_chinese_knowledge(
    *,
    subject: str = "高中语文",
    grade: str = "高中",
    topic: str,
    allow_internet: bool = False,
) -> dict[str, Any]:
    chunks = search_chinese_topic(topic, allow_internet=allow_internet)
    originals = [c for c in chunks if c.get("kind") == "original_text"]
    annotations = [c for c in chunks if c.get("kind") == "annotation"]
    backgrounds = [c for c in chunks if c.get("kind") == "author_background"]
    teaching = [c for c in chunks if c.get("kind") in ("teaching_resource", "method")]
    exams = [c for c in chunks if c.get("kind") == "exam_point"]

    has_curated = any(c.get("source") == "curated" for c in chunks)
    text_source = "权威公开资料" if has_curated else ("互联网资料" if chunks else "无命中")

    # 简易审核：无原文则 verified=false
    verified = len(originals) >= 1 and all(c.get("confidence", 0) >= 0.8 for c in originals)
    confidence = 0.88 if verified else (0.55 if chunks else 0.3)

    return {
        "query": {"subject": subject, "grade": grade, "topic": topic},
        "text_source": text_source,
        "original_text": originals,
        "annotations": annotations,
        "author_background": backgrounds,
        "teaching_resources": teaching,
        "exam_points": exams,
        "chunks": chunks,
        "verification": {
            "verified": verified,
            "confidence": confidence,
            "issues": [] if verified else ["缺少高置信原文，请教师上传或对照教材"],
            "suggestions": ["互联网结果不得直接当教材原文"],
        },
    }
