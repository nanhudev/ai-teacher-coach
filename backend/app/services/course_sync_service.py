"""Course sync — DeepSeek 理解教师磨课意见并返回影响范围 + 教研补丁。"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.ai_service import ai_service

_PROMPTS = Path(__file__).resolve().parents[3] / "prompts"


def _load_prompt(name: str, fallback: str) -> str:
    p = _PROMPTS / name
    if p.exists():
        return p.read_text(encoding="utf-8")
    return fallback


def sync_from_intent(
    *,
    session_snapshot: dict[str, Any],
    teacher_intent: str,
) -> dict[str, Any]:
    intent = (teacher_intent or "").strip()
    if not intent:
        raise ValueError("teacher_intent required")

    director = session_snapshot.get("director") or {}
    lesson = session_snapshot.get("lesson") or {}
    meta = session_snapshot.get("meta") or {}

    system = _load_prompt(
        "teaching_director.md",
        "你是中国高中语文特级教师兼教研员。依据新课标、新高考与教材，"
        "理解教师磨课意见，判断影响模块，并给出可执行的教研补丁。只输出 JSON。",
    )

    user = (
        f"课文：{meta.get('label') or director.get('course')}\n"
        f"原教研策略：{director.get('teaching_strategy')}\n"
        f"原学习目标：{director.get('learning_objectives')}\n"
        f"原教案重点：{lesson.get('key_points')}\n"
        f"教师修改意见：{intent}\n\n"
        "输出 JSON：\n"
        "{\n"
        '  "affected_modules": ["director","lesson","ppt","simulation","evaluation"],\n'
        '  "reasons": {"lesson":"..."},\n'
        '  "director_patch": {\n'
        '    "focus_name":"...",\n'
        '    "focus_reason":"...",\n'
        '    "learning_objectives":["..."],\n'
        '    "teaching_mode":"..."\n'
        "  },\n"
        '  "lesson_request": "给教案修订用的自然语言指令（一句）",\n'
        '  "simulation_focus": "学生提问应围绕的焦点",\n'
        '  "theory_note": "教育学依据一句"\n'
        "}"
    )

    try:
        parsed = ai_service.chat_json(system, user, temperature=0.35)
        return {"ok": True, "source": "deepseek", "intent": intent, "patch": parsed}
    except Exception as e:
        # 调用方用本地规则兜底
        return {
            "ok": False,
            "source": "error",
            "intent": intent,
            "error": str(e),
            "patch": None,
        }


def evaluate_teacher_answer_full(
    *,
    session_snapshot: dict[str, Any],
    turn_index: int,
    teacher_answer: str,
) -> dict[str, Any]:
    """教研员级评分：五维分 + 建议。失败时由调用方用规则分。"""
    turns = session_snapshot.get("simulation_turns") or []
    if turn_index < 0 or turn_index >= len(turns):
        raise ValueError("turn_index out of range")
    turn = turns[turn_index]
    personas = {p["id"]: p for p in session_snapshot.get("personas") or []}
    persona = personas.get(turn.get("persona_id"), {})
    lesson = session_snapshot.get("lesson") or {}
    intent = session_snapshot.get("teacher_intent") or ""

    system = _load_prompt(
        "evaluation_agent.md",
        "你是高中语文教研员。评价教师课堂回答，必须结合教育学理论与文本证据。"
        "只输出 JSON。",
    )
    user = (
        f"学生：{persona.get('name')}（{persona.get('level')}）\n"
        f"问题：{turn.get('question')}\n"
        f"教师回答：{teacher_answer}\n"
        f"参考答法：{turn.get('sample_answer')}\n"
        f"本课目标：{(lesson.get('objectives') or [])[:3]}\n"
        f"磨课重点：{intent}\n\n"
        "按五维打分（整数），总分 100：\n"
        "knowledge_accuracy 25, clarity 20, responds_student 20, "
        "guides_thinking 20, pedagogy 15\n"
        "输出：\n"
        "{\n"
        '  "score": 88,\n'
        '  "scores": {"knowledge_accuracy":20,"clarity":16,"responds_student":18,'
        '"guides_thinking":16,"pedagogy":12},\n'
        '  "analysis": "...",\n'
        '  "suggestion": "...",\n'
        '  "gap": "...",\n'
        '  "from": "未解决|部分理解",\n'
        '  "to": "部分理解|深化理解|仍未解决",\n'
        '  "theory": "建构主义/支架/..."\n'
        "}"
    )
    parsed = ai_service.chat_json(system, user, temperature=0.3)
    return {
        "turn_index": turn_index,
        "teacher_answer": teacher_answer,
        "persona_id": turn.get("persona_id"),
        "score": parsed.get("score"),
        "scores": parsed.get("scores") or {},
        "analysis": parsed.get("analysis") or "",
        "suggestion": parsed.get("suggestion") or "",
        "theory": parsed.get("theory") or "",
        "understanding_delta": {
            "gap": parsed.get("gap") or turn.get("understanding_delta", {}).get("gap", ""),
            "from": parsed.get("from") or "未解决",
            "to": parsed.get("to") or "部分理解",
            "note": parsed.get("analysis") or "",
        },
        "hint_sample_answer": turn.get("sample_answer"),
        "ai_feedback": parsed.get("suggestion"),
        "source": "deepseek",
    }
