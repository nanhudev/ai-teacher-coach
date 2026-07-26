"""CourseUnderstandingAgent — 自动识别学科与教学表征需求。"""
from __future__ import annotations

import re
from typing import Any

_HUM = re.compile(r"语文|历史|政治|思政|文学|作文|阅读|文言文|诗歌|道法")
_MATH = re.compile(r"数学|代数|几何|函数|导数|微积分|概率|统计|方程|分数|小数|三角")
_STEM = re.compile(r"物理|化学|生物|科学|实验|力学|牛顿|电路|光学|分子")
_PRIMARY = re.compile(r"小学|一年级|二年级|三年级|四年级|五年级|六年级")


def understand_course(
    *,
    course: str,
    subject: str = "",
    grade: str = "高中",
    knowledge_points: list[str] | None = None,
) -> dict[str, Any]:
    topic = (course or "").strip() or "未命名课程"
    grade = (grade or "高中").strip()
    blob = f"{subject}{topic}"
    if _MATH.search(blob) or _MATH.search(subject or ""):
        subject = subject or "数学"
    elif _STEM.search(blob):
        m = _STEM.search(blob)
        subject = subject or (m.group(0) if m else "科学")
    elif _HUM.search(blob):
        m = _HUM.search(blob)
        subject = subject or (m.group(0) if m else "语文")
    else:
        subject = subject or "综合"

    if _PRIMARY.search(grade) or "小学" in subject:
        category = "primary"
    elif _MATH.search(subject) or _MATH.search(topic):
        category = "math"
    elif _STEM.search(subject) or _STEM.search(topic):
        category = "stem"
    elif _HUM.search(subject) or _HUM.search(topic):
        category = "humanities"
    else:
        category = "general"

    points = [p.strip() for p in (knowledge_points or []) if p and str(p).strip()]
    if not points:
        if category == "math" and "导数" in topic:
            points = ["瞬时变化率", "切线斜率", "极限思想"]
        elif category == "math" and "分数" in topic:
            points = ["部分与整体", "分数意义", "数轴表示"]
        elif category == "stem" and ("牛顿" in topic or "第二" in topic):
            points = ["F=ma", "合力", "加速度"]
        elif category == "humanities" and "赤壁" in topic:
            points = ["景情理交融", "变与不变", "旷达"]
        elif category == "humanities" and "工业" in topic:
            points = ["蒸汽动力", "工厂制度", "城市化"]
        else:
            points = ["核心概念", "典型例证", "迁移应用"]

    mistakes = {
        "math": ["把平均变化率当成瞬时", "符号忽略"] if "导数" in topic else ["概念停留在公式"],
        "stem": ["忽略合力", "单位混乱"],
        "humanities": ["只翻译不入情", "把旷达理解成摆烂"] if "赤壁" in topic else ["只记名词"],
        "primary": ["分母越大越大", "把分数当两个数"],
        "general": ["缺少证据与迁移"],
    }.get(category, ["概念不清"])

    style = {
        "humanities": "narrative_close_reading",
        "math": "concept_visualization",
        "stem": "model_and_experiment",
        "primary": "playful_scaffolding",
        "general": "inquiry_cycle",
    }[category]
    visual = {
        "humanities": "imagery + timeline + sparse text",
        "math": "diagram + graph",
        "stem": "process + model diagram",
        "primary": "card + illustration + interaction",
        "general": "mixed layouts",
    }[category]

    return {
        "subject": subject,
        "grade": grade,
        "topic": topic,
        "category": category,
        "teaching_style": style,
        "recommended_visual_language": visual,
        "difficulty": "primary" if "小学" in grade else "high_school",
        "key_concepts": points[:5],
        "common_mistakes": mistakes,
        "knowledge_points": points[:5],
    }
