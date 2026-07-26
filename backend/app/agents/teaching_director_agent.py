"""
TeachingDirectorAgent — 教研总控。

S0.5：从 knowledge demo_cases + teaching_templates 组装 brief。
S1：注入 pedagogy_rules 后经 ai_service 生成。
"""
from __future__ import annotations

from app.services import knowledge_service


class TeachingDirectorAgent:
    def run_from_case(self, case_id: str) -> dict:
        case = knowledge_service.get_demo_case(case_id)
        if not case:
            raise ValueError(f"unknown case: {case_id}")
        brief = dict(case["director"])
        # 保证微调字段存在
        brief.setdefault("teaching_strategy", [])
        return brief


teaching_director_agent = TeachingDirectorAgent()
