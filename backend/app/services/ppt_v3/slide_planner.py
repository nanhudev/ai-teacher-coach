"""SlidePlanningAgent + math chart specs — 产出 Slide DSL / 内容骨架。"""
from __future__ import annotations

from typing import Any


def _chart_for(brief: dict[str, Any]) -> dict[str, Any] | None:
    topic = brief.get("topic") or ""
    cat = brief.get("category")
    if cat == "math" and "导数" in topic:
        return {"kind": "function", "expression": "x2", "label": "y=x²与切线", "tangent_at": 1, "x_min": -2, "x_max": 2}
    if cat in ("math", "primary") and "分数" in topic:
        return {"kind": "fraction_pie", "label": "认识3/4", "numerator": 3, "denominator": 4}
    if cat == "stem" and ("牛顿" in topic or "第二" in topic):
        return {
            "kind": "bars",
            "label": "同力不同质量",
            "categories": ["m小", "m中", "m大"],
            "values": [3, 2, 1],
        }
    return None


def plan_slide_content(brief: dict[str, Any], design: dict[str, Any]) -> dict[str, Any]:
    """返回 ppt_design_engine.compile_ppt 可消费的 content（含 chart 字段）。"""
    topic = brief["topic"]
    concepts = brief.get("key_concepts") or []
    mistakes = brief.get("common_mistakes") or []
    chart = _chart_for(brief)
    cat = brief.get("category")

    slides: list[dict[str, Any]] = [
        {
            "type": "cover",
            "purpose": "开场",
            "title": topic,
            "subtitle": f"{brief.get('grade','')}{brief.get('subject','')}",
            "key_message": {
                "humanities": "一场思想的现场",
                "math": "变化，可以被看见",
                "stem": "先看见现象，再建模型",
                "primary": "今天我们来分一分",
            }.get(cat, "先问真问题"),
            "closing": design.get("style", ""),
            "minutes_hint": 1,
            "chart": chart if cat in ("math", "primary") else None,
        },
        {
            "type": "question",
            "purpose": "导入",
            "title": "本课真问题",
            "key_message": "先想，再学名字",
            "bullets": ["激活经验", "暴露前概念"],
            "interaction": "30秒自由说",
            "minutes_hint": 3,
        },
        {
            "type": "concept",
            "purpose": "目标",
            "title": "学习目标",
            "key_message": "三件事做实一课",
            "bullets": concepts[:3],
            "minutes_hint": 2,
        },
    ]

    if cat == "humanities":
        slides += [
            {
                "type": "timeline",
                "purpose": "结构",
                "title": "叙事时间线",
                "steps": [
                    {"label": "起", "detail": "情境"},
                    {"label": "承", "detail": "细读"},
                    {"label": "转", "detail": "转折"},
                    {"label": "合", "detail": "迁移"},
                ],
                "minutes_hint": 4,
            },
            {
                "type": "comparison",
                "purpose": "对照",
                "title": "两种观法",
                "key_message": "对照中见思想",
                "left": mistakes[:2] or ["常见读法"],
                "right": concepts[:2] or ["深层读法"],
                "minutes_hint": 5,
            },
        ]
    elif cat in ("math", "primary", "stem"):
        slides.append(
            {
                "type": "chart",
                "purpose": "视觉表征",
                "title": "看见关系",
                "key_message": (chart or {}).get("label", "图像说话"),
                "bullets": concepts[:3],
                "chart": chart,
                "minutes_hint": 6,
            }
        )
        slides.append(
            {
                "type": "process",
                "purpose": "过程",
                "title": "从直觉到概念",
                "steps": [
                    {"label": "观察", "detail": "看表征"},
                    {"label": "命名", "detail": "给概念"},
                    {"label": "检验", "detail": "做练习"},
                ],
                "minutes_hint": 5,
            }
        )
        slides.append(
            {
                "type": "comparison",
                "purpose": "纠错",
                "title": "易错对照",
                "left": mistakes[:2] or ["误解"],
                "right": concepts[:2] or ["正确理解"],
                "minutes_hint": 4,
            }
        )
    else:
        slides.append(
            {
                "type": "process",
                "purpose": "展开",
                "title": "探究路径",
                "steps": [
                    {"label": "问", "detail": "问题"},
                    {"label": "探", "detail": "证据"},
                    {"label": "结", "detail": "结论"},
                ],
                "minutes_hint": 6,
            }
        )

    slides += [
        {
            "type": "activity",
            "purpose": "互动",
            "title": "课堂活动",
            "key_message": "动手 / 讨论",
            "bullets": ["独立思考", "同伴互查", "展示反馈"],
            "interaction": "限时任务",
            "minutes_hint": 8,
        },
        {
            "type": "summary",
            "purpose": "总结",
            "title": "带走三句话",
            "bullets": concepts[:3],
            "closing": "下课，但不结束思考",
            "minutes_hint": 2,
        },
        {
            "type": "homework",
            "purpose": "迁移",
            "title": "出口票",
            "bullets": ["一句话解释核心", "一道巩固题"],
            "closing": "下节课分享",
            "minutes_hint": 2,
        },
    ]

    # drop null charts
    for s in slides:
        if s.get("chart") is None:
            s.pop("chart", None)

    return {
        "title": topic,
        "learning_objective": "理解并运用：" + "、".join(concepts[:2]),
        "total_minutes": 45,
        "slides": slides,
        "design_system": design,
        "course_brief": brief,
    }
