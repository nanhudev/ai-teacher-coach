"""黄金路径流水线：可逐步 yield 进度事件。"""
from __future__ import annotations

import json
import time
from typing import Any, Iterator

from app.services.ai_service import ai_service
from app.services import knowledge_service
from app.services.prompt_loader import dumps, load_prompt

STEPS = [
    ("director", "教研主任分析中"),
    ("lesson", "生成教案"),
    ("alignment", "目标—活动一致性检测"),
    ("ppt", "课件设计引擎"),
    ("simulation", "生成 AI 学生画像"),
    ("before_after", "生成 Before/After 对比"),
    ("evaluation", "撰写教学评价报告"),
]


def _template_for_grade(subject: str, grade: str, prefer: str | None) -> str:
    from app.services.ppt_design_engine import normalize_template_id
    from app.services.ppt_v3.course_understanding import understand_course
    from app.services.ppt_v3.visual_art_director import direct_visual

    if prefer and prefer not in ("auto",):
        return normalize_template_id(prefer)
    brief = understand_course(course="", subject=subject, grade=grade)
    design = direct_visual(brief)
    return normalize_template_id(design.get("template_id"))


def _normalize_simulation(sim: dict[str, Any]) -> tuple[list, list]:
    """确保 p1/p2/p3 可点击切换，三位学生各一问。"""
    levels = [
        ("p1", "struggling", "学困"),
        ("p2", "medium", "普通"),
        ("p3", "excellent", "优秀"),
    ]
    raw_personas = list(sim.get("personas") or [])
    raw_turns = list(sim.get("simulation_turns") or [])
    personas = []
    turns = []
    for i, (pid, level, label) in enumerate(levels):
        src = next((p for p in raw_personas if str(p.get("id")) == pid), None)
        if not src and i < len(raw_personas):
            src = raw_personas[i]
        if not src:
            src = {
                "id": pid,
                "name": f"学生{label}",
                "level": level,
                "personality": "",
                "knowledge_gap": [],
                "question_style": "",
                "memory": {"unresolved": [], "resolved": [], "understanding": {}},
            }
        p = dict(src)
        p["id"] = pid
        p["level"] = level
        personas.append(p)

        tsrc = next((t for t in raw_turns if str(t.get("persona_id")) == pid), None)
        if not tsrc and i < len(raw_turns):
            tsrc = raw_turns[i]
        if not tsrc:
            tsrc = {
                "persona_id": pid,
                "question": f"（待生成）我想请教一个关于本课的问题。",
                "sample_answer": "先肯定提问，再结合板书要点回应，最后检查理解。",
                "understanding_delta": {
                    "gap": "待确认",
                    "from": "未解决",
                    "to": "部分理解",
                    "note": "需教师回应后更新",
                },
            }
        t = dict(tsrc)
        t["persona_id"] = pid
        turns.append(t)
    return personas, turns


def iter_generate_full_session(
    *,
    course: str,
    subject: str,
    grade: str,
    knowledge_points: list[str] | None = None,
    period_count: int = 1,
    template_id: str | None = None,
    role_type: str = "k12",
) -> Iterator[dict[str, Any]]:
    knowledge_points = knowledge_points or []
    if "语文" in subject:
        from app.services.chinese_generation_service import iter_generate_chinese_session

        yield from iter_generate_chinese_session(
            course=course,
            grade=grade,
            knowledge_points=knowledge_points,
            period_count=period_count,
            template_id=template_id,
            role_type=role_type,
        )
        return

    template = knowledge_service.load_teaching_template(subject)
    rules = knowledge_service.load_pedagogy_rules()
    rubric_align = knowledge_service.load_rubric("objective_alignment")
    rubric_class = knowledge_service.load_rubric("classroom_100")
    chosen_tpl = _template_for_grade(subject, grade, template_id)

    total = len(STEPS)
    partial: dict[str, Any] = {}

    def emit(step: str, status: str, message: str, **extra):
        i = next((n for n, (s, _) in enumerate(STEPS) if s == step), 0)
        return {
            "step": step,
            "status": status,
            "message": message,
            "index": i + 1,
            "total": total,
            "progress": round((i + (1 if status == "done" else 0.35)) / total * 100),
            **extra,
        }

    # 1 director
    yield emit("director", "running", "教研主任分析中…")
    director = ai_service.chat_json(
        load_prompt("teaching_director"),
        (
            f"课程：{course}\n学科：{subject}\n年级：{grade}\n课时：{period_count}（按40分钟设计）\n"
            f"知识点：{', '.join(knowledge_points) or '由你提炼'}\n\n"
            f"【学科教学模板】\n{dumps(template)}\n\n"
            f"【教育学理论库】\n{dumps(rules)}\n"
        ),
    )
    director["course"] = director.get("course") or course
    director["subject"] = director.get("subject") or subject
    director["grade"] = director.get("grade") or grade
    director.setdefault("teaching_strategy", [])
    partial["director"] = director
    yield emit("director", "done", "教研分析完成", preview={"course_type": director.get("course_type"), "mode": director.get("teaching_mode")})

    # 2 lesson
    yield emit("lesson", "running", "正在撰写教案…")
    lesson = ai_service.chat_json(
        load_prompt("lesson_plan"),
        f"请按 **40分钟课堂** 写教案。\n【教研主任 brief】\n{dumps(director)}\n\n【学科模板】\n{dumps(template)}\n",
    )
    partial["lesson"] = lesson
    yield emit("lesson", "done", "教案已生成", preview={"title": lesson.get("title")})

    # 3 alignment
    yield emit("alignment", "running", "检测目标与活动一致性…")
    objective_alignment = ai_service.chat_json(
        load_prompt("objective_alignment"),
        f"【检测规则】\n{dumps(rubric_align)}\n\n【教案】\n{dumps(lesson)}\n",
        temperature=0.2,
    )
    partial["objective_alignment"] = objective_alignment
    yield emit("alignment", "done", f"一致性评分 {objective_alignment.get('score', '—')}", preview={"score": objective_alignment.get("score")})

    # 4 ppt — V3: Understanding → VisualDirector → (LLM enrich or planner) → DesignEngine
    yield emit("ppt", "running", "PPT Engine V3：理解→视觉→DSL→渲染…")
    from app.services.ppt_design_engine import compile_ppt
    from app.services.ppt_v3.course_understanding import understand_course
    from app.services.ppt_v3.visual_art_director import direct_visual
    from app.services.ppt_v3.slide_planner import plan_slide_content

    brief = understand_course(
        course=course,
        subject=subject,
        grade=grade,
        knowledge_points=knowledge_points,
    )
    design = direct_visual(brief, template_id)
    chosen_tpl = design.get("template_id") or chosen_tpl

    # LLM 仍可 enrich 文案；失败则用学科规划器
    try:
        ppt_content = ai_service.chat_json(
            load_prompt("ppt_content"),
            (
                f"【课程理解】\n{dumps(brief)}\n"
                f"【视觉策划】\n{dumps(design)}\n"
                f"【brief】\n{dumps(director)}\n\n【教案】\n{dumps(lesson)}\n"
                f"注意：数学/科学优先 chart/process；文科优先 timeline/comparison；禁止堆字。"
            ),
        )
        # 合并规划器图表页：若 LLM 未给 chart，注入 planner 的 chart 页
        planned = plan_slide_content(brief, design)
        llm_has_chart = any(s.get("type") == "chart" or s.get("chart") for s in (ppt_content.get("slides") or []))
        if not llm_has_chart:
            for s in planned["slides"]:
                if s.get("chart") or s.get("type") == "chart":
                    ppt_content.setdefault("slides", []).insert(3, s)
                    break
        ppt_content["design_system"] = design
        ppt_content["course_brief"] = brief
    except Exception:
        ppt_content = plan_slide_content(brief, design)

    ppt = compile_ppt(ppt_content, template_id=chosen_tpl)
    partial["ppt"] = ppt
    yield emit(
        "ppt",
        "done",
        f"V3·{design.get('id')} · {len(ppt['slides'])}页 · 设计分 {ppt.get('design_score', {}).get('total', '—')}",
        preview={
            "slides": len(ppt["slides"]),
            "score": ppt.get("design_score", {}).get("total"),
            "category": brief.get("category"),
        },
    )

    # 5 simulation
    yield emit("simulation", "running", "生成三位 AI 学生…")
    sim = ai_service.chat_json(
        load_prompt("student_sim"),
        f"【brief】\n{dumps(director)}\n\n【教案】\n{dumps(lesson)}\n",
    )
    personas, simulation_turns = _normalize_simulation(sim)
    partial["personas"] = personas
    partial["simulation_turns"] = simulation_turns
    yield emit("simulation", "done", "学生画像与提问已生成")

    # 6 before_after
    yield emit("before_after", "running", "生成教研对比…")
    before_after = ai_service.chat_json(
        load_prompt("before_after"),
        f"【brief】\n{dumps(director)}\n\n【教案】\n{dumps(lesson)}\n\n【PPT页数】{len(ppt['slides'])}\n",
    )
    partial["before_after"] = before_after
    yield emit("before_after", "done", "Before/After 完成")

    # 7 evaluation
    yield emit("evaluation", "running", "撰写评价报告…")
    evaluation = ai_service.chat_json(
        load_prompt("evaluation"),
        (
            f"【评分量表】\n{dumps(rubric_class)}\n\n"
            f"【brief】\n{dumps(director)}\n\n【教案】\n{dumps(lesson)}\n\n"
            f"【目标一致性】\n{dumps(objective_alignment)}\n\n"
            f"【PPT】页数={len(ppt['slides'])} template={chosen_tpl}\n\n"
            f"【学生】\n{dumps({'personas': personas, 'turns': simulation_turns})}\n"
        ),
        temperature=0.3,
    )
    partial["evaluation"] = evaluation
    yield emit("evaluation", "done", f"综合评分 {evaluation.get('total_score', '—')}")

    case_id = f"gen-{int(time.time()) % 10_000_000}"
    session = {
        "guest": True,
        "role_type": role_type,
        "case_id": case_id,
        "generated": True,
        "meta": {
            "label": f"{grade}{subject} · {course}",
            "subject": subject,
            "grade": grade,
            "period_count": period_count,
            "knowledge_points": knowledge_points or director.get("learning_objectives", [])[:3],
        },
        "knowledge_injected": {
            "template": template,
            "pedagogy_rule_names": list(rules.keys()),
        },
        "director": director,
        "lesson": lesson,
        "objective_alignment": objective_alignment,
        "ppt": ppt,
        "before_after": before_after,
        "personas": personas,
        "simulation_turns": simulation_turns,
        "evaluation": evaluation,
    }
    yield {"step": "complete", "status": "done", "message": "全部完成", "progress": 100, "session": session}


def generate_full_session(**kwargs) -> dict[str, Any]:
    session = None
    for ev in iter_generate_full_session(**kwargs):
        if ev.get("step") == "complete":
            session = ev["session"]
    if not session:
        raise RuntimeError("pipeline failed")
    return session


def analyze_teacher_answer(
    *,
    session_snapshot: dict[str, Any],
    turn_index: int,
    teacher_answer: str,
) -> dict[str, Any]:
    turns = session_snapshot.get("simulation_turns") or []
    if turn_index < 0 or turn_index >= len(turns):
        raise ValueError("turn_index out of range")
    turn = turns[turn_index]
    personas = {p["id"]: p for p in session_snapshot.get("personas") or []}
    persona = personas.get(turn.get("persona_id"), {})

    result = ai_service.chat_json(
        "你分析教师课堂回答对学生理解的影响。只输出 JSON："
        '{"gap":"","from":"未解决|部分理解","to":"部分理解|深化理解|仍未解决","note":"","feedback":""}',
        (
            f"学生：{dumps(persona)}\n提问：{turn.get('question')}\n"
            f"教师回答：{teacher_answer}\n预设参考：{turn.get('sample_answer')}\n"
            f"预设变化：{dumps(turn.get('understanding_delta'))}\n"
            "若教师回答质量差，to 可为「仍未解决」。"
        ),
        temperature=0.3,
    )
    return {
        "turn_index": turn_index,
        "teacher_answer": teacher_answer,
        "persona_id": turn.get("persona_id"),
        "understanding_delta": {
            "gap": result.get("gap") or turn.get("understanding_delta", {}).get("gap", ""),
            "from": result.get("from") or "未解决",
            "to": result.get("to") or "部分理解",
            "note": result.get("note") or result.get("feedback") or "",
        },
        "hint_sample_answer": turn.get("sample_answer"),
        "ai_feedback": result.get("feedback"),
    }
