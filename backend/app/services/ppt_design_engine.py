"""PPT Design Engine：内容骨架 → 固定组件 + 美学校验 + 评分（无配图）。"""
from __future__ import annotations

import re
from typing import Any

TEMPLATE_META = {
    "academic": {"name": "简约·书刊白"},
    "classroom": {"name": "卡通·语文课堂"},
    "showcase": {"name": "Competition Showcase"},
    "gamma": {"name": "Gamma Soft"},
    "noir": {"name": "Noir Editorial"},
    "sage": {"name": "国风·水墨卷"},
    "coral": {"name": "Coral Warm"},
}

TYPE_TO_COMPONENT = {
    "cover": "CoverSlide",
    "opening": "CoverSlide",
    "question": "QuestionSlide",
    "concept": "ConceptSlide",
    "quote_analysis": "QuoteAnalysisSlide",
    "image_text": "ImageTextSlide",
    "timeline": "TimelineSlide",
    "comparison": "ComparisonSlide",
    "process": "ProcessSlide",
    "activity": "ActivitySlide",
    "summary": "SummarySlide",
    "homework": "HomeworkSlide",
    "chart": "ChartSlide",
}

VALID_TYPES = set(TYPE_TO_COMPONENT)


def normalize_template_id(tid: str | None) -> str:
    if tid in ("modern", "academic"):
        return "academic"
    if tid in ("lively", "classroom"):
        return "classroom"
    if tid in TEMPLATE_META:
        return tid  # type: ignore[return-value]
    return "gamma"


def _zh_len(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", text or ""))


def _trim(text: str, max_zh: int) -> str:
    text = (text or "").strip()
    if _zh_len(text) <= max_zh:
        return text
    out = []
    n = 0
    for ch in text:
        if "\u4e00" <= ch <= "\u9fff":
            n += 1
        if n > max_zh:
            break
        out.append(ch)
    return "".join(out).rstrip("，,、；; ") + "…"


def score_design(slides: list[dict[str, Any]]) -> dict[str, Any]:
    issues: list[str] = []
    suggestions: list[str] = []
    n = max(len(slides), 1)

    # 视觉 30：靠版式多样性（无配图）
    types = {s.get("type") for s in slides}
    variety = min(12, len(types) * 2)
    visual = 16 + variety
    if len(types) < 4:
        issues.append("页面类型偏少，节奏单一")
        visual -= 3

    # 教学逻辑 30
    type_list = [s.get("type") for s in slides]
    has_q = "question" in type_list
    has_act = "activity" in type_list
    has_sum = "summary" in type_list or "homework" in type_list
    pedagogy = 12 + (8 if has_q else 0) + (5 if has_act else 0) + (5 if has_sum else 0)
    if not has_q:
        issues.append("缺少问题导入页")
    if not has_act:
        issues.append("缺少课堂活动页")

    # 信息密度 20
    dense_pages = []
    for i, s in enumerate(slides, 1):
        body = "".join(
            [
                s.get("key_message") or "",
                "".join(s.get("bullets") or []),
                "".join(s.get("left") or []),
                "".join(s.get("right") or []),
            ]
        )
        if _zh_len(body) > 40:
            dense_pages.append(i)
    density = 20 - min(12, len(dense_pages) * 3)
    for p in dense_pages[:3]:
        issues.append(f"第{p}页文字偏多")
        suggestions.append(f"第{p}页拆分为两页或删减要点")

    # 互动 20
    inter = sum(1 for s in slides if s.get("interaction"))
    interaction = min(20, 8 + inter * 4)
    if inter == 0:
        suggestions.append("至少增加 1 页带互动提示的活动设计")

    total = max(0, min(100, visual + pedagogy + density + interaction))
    return {
        "total": total,
        "visual": max(0, min(30, visual)),
        "pedagogy": max(0, min(30, pedagogy)),
        "density": max(0, density),
        "interaction": max(0, interaction),
        "issues": issues,
        "suggestions": suggestions[:4],
    }


def compile_ppt(
    content: dict[str, Any],
    *,
    template_id: str | None = None,
    curated: bool = False,
) -> dict[str, Any]:
    tid = normalize_template_id(template_id)
    raw_slides = list(content.get("slides") or [])
    compiled: list[dict[str, Any]] = []

    for i, raw in enumerate(raw_slides, start=1):
        stype = str(raw.get("type") or "concept")
        if stype not in VALID_TYPES:
            stype = "concept"
        bullets = [_trim(str(b), 14) for b in (raw.get("bullets") or [])[:3]]
        key = _trim(str(raw.get("key_message") or ""), 22)
        title = _trim(str(raw.get("title") or f"第{i}页"), 16)

        slide = {
            "id": i,
            "type": stype,
            "component": TYPE_TO_COMPONENT[stype],
            "purpose": raw.get("purpose") or "",
            "title": title,
            "subtitle": _trim(str(raw.get("subtitle") or ""), 24),
            "key_message": key,
            "bullets": bullets,
            "left": [_trim(str(x), 14) for x in (raw.get("left") or [])[:3]],
            "right": [_trim(str(x), 14) for x in (raw.get("right") or [])[:3]],
            "steps": raw.get("steps") or [],
            "interaction": _trim(str(raw.get("interaction") or ""), 28),
            "closing": _trim(str(raw.get("closing") or ""), 20),
            "layout": raw.get("layout") or "full",
            "minutes_hint": raw.get("minutes_hint"),
        }
        if raw.get("chart"):
            slide["chart"] = raw["chart"]
        if raw.get("visual_prompt"):
            slide["visual_prompt"] = raw["visual_prompt"]
        for field in (
            "text_excerpt",
            "analysis",
            "analysis_cards",
            "teacher_guidance",
            "student_task",
            "source_reference",
        ):
            if raw.get(field):
                slide[field] = raw[field]
        compiled.append(slide)

    out = {
        "template_id": tid,
        "template_name": TEMPLATE_META[tid]["name"],
        "title": content.get("title") or "",
        "learning_objective": content.get("learning_objective") or "",
        "total_minutes": content.get("total_minutes") or 45,
        "slides": compiled,
        "design_score": score_design(compiled),
        "engine": "ppt-design-engine-v3",
    }
    if content.get("design_system"):
        out["design_system"] = content["design_system"]
    if content.get("course_brief"):
        out["course_brief"] = content["course_brief"]
    return out
