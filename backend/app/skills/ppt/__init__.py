"""PPT OS skills loader — DeepSeek 策划时读取规则约束。"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_SKILL_DIR = Path(__file__).resolve().parent


def load_skill(name: str) -> dict[str, Any]:
    path = _SKILL_DIR / name
    if not path.suffix:
        path = _SKILL_DIR / f"{name}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def all_skills() -> dict[str, Any]:
    return {
        "design": load_skill("ppt_design_rules"),
        "literature": load_skill("chinese_literature_skill"),
        "layout": load_skill("visual_layout_skill"),
        "public_lesson": load_skill("public_lesson_skill"),
        "chart": load_skill("chart_skill"),
        "image": load_skill("image_skill"),
    }


def planning_system_prompt() -> str:
    skills = all_skills()
    return (
        "你是中国高中语文特级教师 + 公开课 PPT 设计师。\n"
        "DeepSeek 负责教学思考；以下 Skill 负责硬约束；模板负责美学。\n"
        "禁止：文章切页、大段文字、百科堆砌、英文标题、商业粉卡风。\n"
        "每页必须有 slide_goal / teacher_action / student_action。\n"
        f"设计规则：{json.dumps(skills['design']['rules'], ensure_ascii=False)}\n"
        f"文学课结构：{json.dumps(skills['literature'], ensure_ascii=False)}\n"
        f"公开课标准：{json.dumps(skills['public_lesson'], ensure_ascii=False)}\n"
        "只输出 JSON 数组 slides[]，字段对齐 PlannedSlide。"
    )
