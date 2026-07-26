"""VisualArtDirectorAgent — 决定设计系统，不写正文。"""
from __future__ import annotations

from typing import Any

SYSTEMS = {
    "museum_story": {
        "style": "museum_story",
        "template_id": "sage",
        "layout_rule": "one idea per slide · sparse text",
        "image_style": "ink wash / museum lighting",
        "rhythm": "cover → mood → close-read → contrast → activity",
    },
    "math_precision": {
        "style": "math_precision",
        "template_id": "noir",
        "layout_rule": "hero chart · ≤3 bullets",
        "image_style": "coordinate · curve",
        "rhythm": "cover → question → graph → meaning → practice",
    },
    "stem_visual": {
        "style": "stem_visual",
        "template_id": "academic",
        "layout_rule": "model first · formula second",
        "image_style": "experiment diagram",
        "rhythm": "phenomenon → model → law → apply",
    },
    "primary_colorful": {
        "style": "primary_colorful",
        "template_id": "coral",
        "layout_rule": "big visual · short words",
        "image_style": "card · pie",
        "rhythm": "hook → play → name → check",
    },
    "academic_minimal": {
        "style": "modern_academic",
        "template_id": "academic",
        "layout_rule": "留白优先",
        "image_style": "keynote minimal",
        "rhythm": "cover → question → develop → summary",
    },
}


def direct_visual(brief: dict[str, Any], prefer_template: str | None = None) -> dict[str, Any]:
    cat = brief.get("category") or "general"
    mapping = {
        "humanities": "museum_story",
        "math": "math_precision",
        "stem": "stem_visual",
        "primary": "primary_colorful",
    }
    sid = mapping.get(cat, "academic_minimal")
    base = dict(SYSTEMS[sid])
    base["id"] = sid
    if prefer_template and prefer_template not in ("auto", "", None):
        base["template_id"] = prefer_template
    return base
