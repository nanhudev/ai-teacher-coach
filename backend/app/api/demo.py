import json
from typing import Iterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from app.services import knowledge_service, session_store
from app.services import pipeline_service
from app.services.ppt_export_service import export_pptx
from app.services.ppt_design_engine import compile_ppt, normalize_template_id

router = APIRouter()


class DemoStartRequest(BaseModel):
    case_id: str
    role_type: str = "k12"
    use_ai: bool = False


class GenerateRequest(BaseModel):
    course: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    grade: str = Field(..., min_length=1)
    knowledge_points: list[str] = []
    period_count: int = 1
    template_id: str | None = None
    role_type: str = "k12"


def _legacy_slides_to_content(slides: list) -> list:
    out = []
    for s in slides:
        out.append(
            {
                "type": "concept",
                "title": s.get("title") or "",
                "subtitle": s.get("subtitle") or "",
                "bullets": s.get("bullets") or [],
                "left": s.get("left") or [],
                "right": s.get("right") or [],
                "minutes_hint": s.get("minutes_hint"),
            }
        )
    return out


class SimAnswerRequest(BaseModel):
    turn_index: int
    teacher_answer: str
    case_id: str | None = None


class CourseSyncRequest(BaseModel):
    teacher_intent: str = Field(..., min_length=1)
    session: dict | None = None


class EvaluateAnswerRequest(BaseModel):
    turn_index: int
    teacher_answer: str
    session: dict | None = None


class TemplateSwitchRequest(BaseModel):
    template_id: str


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _stream_generate(kwargs: dict) -> Iterator[str]:
    try:
        for ev in pipeline_service.iter_generate_full_session(**kwargs):
            if ev.get("step") == "complete" and ev.get("session"):
                session_store.save(ev["session"])
            yield _sse(ev)
    except Exception as e:
        yield _sse({"step": "error", "status": "error", "message": str(e), "progress": 0})


@router.get("/demo/cases")
def list_cases():
    return {"cases": knowledge_service.list_demo_cases()}


@router.post("/demo/start")
def start_demo(body: DemoStartRequest):
    case = knowledge_service.get_demo_case(body.case_id)
    if not case:
        raise HTTPException(404, f"unknown case: {body.case_id}")

    if body.use_ai:
        try:
            session = pipeline_service.generate_full_session(
                course=case["director"]["course"],
                subject=case["subject"],
                grade=case["grade"],
                knowledge_points=case.get("knowledge_points") or [],
                period_count=case.get("period_count", 1),
                template_id=(case.get("ppt") or {}).get("template_id"),
                role_type=body.role_type,
            )
            session["case_id"] = f"ai-{body.case_id}"
            session["source_case"] = body.case_id
        except Exception as e:
            raise HTTPException(502, f"DeepSeek 生成失败: {e}") from e
    else:
        from app.services.pipeline_service import _normalize_simulation

        personas, turns = _normalize_simulation(
            {"personas": case["personas"], "simulation_turns": case["simulation_turns"]}
        )
        template = knowledge_service.load_teaching_template(case["subject"])
        rules = knowledge_service.load_pedagogy_rules()
        # V3：按学科规划；赤壁精品包仅作人文 curated 增强
        from app.services.ppt_v3.course_understanding import understand_course
        from app.services.ppt_v3.visual_art_director import direct_visual
        from app.services.ppt_v3.slide_planner import plan_slide_content

        brief = understand_course(
            course=case.get("label") or case["id"],
            subject=case["subject"],
            grade=case["grade"],
            knowledge_points=case.get("knowledge_points") or [],
        )
        design = direct_visual(brief)
        if body.case_id == "chibi-fu":
            content = knowledge_service.get_demo_case_extra("chibi-ppt-content")
            ppt = compile_ppt(
                content or plan_slide_content(brief, design),
                template_id=design.get("template_id") or "sage",
            )
            ppt["design_system"] = design
            ppt["course_brief"] = brief
        else:
            ppt = compile_ppt(plan_slide_content(brief, design), template_id=design.get("template_id"))
        session = {
            "guest": True,
            "role_type": body.role_type,
            "case_id": case["id"],
            "generated": False,
            "meta": {
                "label": case["label"],
                "subject": case["subject"],
                "grade": case["grade"],
                "period_count": case.get("period_count", 1),
                "knowledge_points": case.get("knowledge_points", []),
            },
            "knowledge_injected": {
                "template": template,
                "pedagogy_rule_names": list(rules.keys()),
            },
            "director": case["director"],
            "lesson": case["lesson"],
            "objective_alignment": case["objective_alignment"],
            "ppt": ppt,
            "before_after": case["before_after"],
            "personas": personas,
            "simulation_turns": turns,
            "evaluation": case["evaluation"],
        }

    session_store.save(session)
    return session


@router.post("/demo/generate")
def generate_custom(body: GenerateRequest):
    try:
        session = pipeline_service.generate_full_session(
            course=body.course.strip(),
            subject=body.subject.strip(),
            grade=body.grade.strip(),
            knowledge_points=[k.strip() for k in body.knowledge_points if k.strip()],
            period_count=body.period_count,
            template_id=body.template_id,
            role_type=body.role_type,
        )
    except Exception as e:
        raise HTTPException(502, f"DeepSeek 生成失败: {e}") from e
    session_store.save(session)
    return session


@router.post("/demo/generate/stream")
def generate_custom_stream(body: GenerateRequest):
    kwargs = dict(
        course=body.course.strip(),
        subject=body.subject.strip(),
        grade=body.grade.strip(),
        knowledge_points=[k.strip() for k in body.knowledge_points if k.strip()],
        period_count=body.period_count,
        template_id=body.template_id,
        role_type=body.role_type,
    )
    return StreamingResponse(
        _stream_generate(kwargs),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/demo/start/stream")
def start_demo_stream(body: DemoStartRequest):
    case = knowledge_service.get_demo_case(body.case_id)
    if not case:
        raise HTTPException(404, f"unknown case: {body.case_id}")
    if not body.use_ai:
        # 非 AI：直接返回完成事件
        session = start_demo(body)

        def once():
            yield _sse({"step": "complete", "status": "done", "message": "已加载示例", "progress": 100, "session": session})

        return StreamingResponse(once(), media_type="text/event-stream")

    kwargs = dict(
        course=case["director"]["course"],
        subject=case["subject"],
        grade=case["grade"],
        knowledge_points=case.get("knowledge_points") or [],
        period_count=case.get("period_count", 1),
        template_id=(case.get("ppt") or {}).get("template_id"),
        role_type=body.role_type,
    )

    def gen():
        for ev in pipeline_service.iter_generate_full_session(**kwargs):
            if ev.get("step") == "complete" and ev.get("session"):
                ev["session"]["case_id"] = f"ai-{body.case_id}"
                ev["session"]["source_case"] = body.case_id
                session_store.save(ev["session"])
            yield _sse(ev)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/demo/cases/{case_id}")
def get_case(case_id: str):
    session = session_store.get(case_id)
    if session:
        return session
    case = knowledge_service.get_demo_case(case_id)
    if not case:
        raise HTTPException(404, f"unknown case: {case_id}")
    return case


@router.post("/demo/cases/{case_id}/simulate/answer")
def simulate_answer(case_id: str, body: SimAnswerRequest):
    session = session_store.get(case_id) or knowledge_service.get_demo_case(case_id)
    if not session:
        raise HTTPException(404, f"unknown case: {case_id}")

    generated = bool(session.get("generated"))
    try:
        if generated or body.teacher_answer.strip():
            from app.services.ai_service import ai_service
            from app.services import course_sync_service

            if not ai_service.use_mock and ai_service.api_key:
                try:
                    return course_sync_service.evaluate_teacher_answer_full(
                        session_snapshot=session,
                        turn_index=body.turn_index,
                        teacher_answer=body.teacher_answer,
                    )
                except Exception:
                    return pipeline_service.analyze_teacher_answer(
                        session_snapshot=session,
                        turn_index=body.turn_index,
                        teacher_answer=body.teacher_answer,
                    )
    except Exception:
        pass

    turns = session.get("simulation_turns") or []
    if body.turn_index < 0 or body.turn_index >= len(turns):
        raise HTTPException(400, "turn_index out of range")
    turn = turns[body.turn_index]
    return {
        "turn_index": body.turn_index,
        "teacher_answer": body.teacher_answer,
        "persona_id": turn["persona_id"],
        "understanding_delta": turn["understanding_delta"],
        "hint_sample_answer": turn["sample_answer"],
    }


@router.post("/demo/sync")
def sync_course(body: CourseSyncRequest):
    """教师磨课意见 → DeepSeek 影响分析 + 补丁；前端再本地落地。"""
    from app.services import course_sync_service

    snap = body.session or {}
    result = course_sync_service.sync_from_intent(
        session_snapshot=snap,
        teacher_intent=body.teacher_intent,
    )
    if not result.get("ok"):
        # 仍返回结构，让前端走本地 sync
        return result
    return result


@router.post("/demo/evaluate-answer")
def evaluate_answer(body: EvaluateAnswerRequest):
    from app.services import course_sync_service
    from app.services.ai_service import ai_service

    if not body.session:
        raise HTTPException(400, "session required")
    if ai_service.use_mock or not ai_service.api_key:
        raise HTTPException(503, "DeepSeek unavailable")
    try:
        return course_sync_service.evaluate_teacher_answer_full(
            session_snapshot=body.session,
            turn_index=body.turn_index,
            teacher_answer=body.teacher_answer,
        )
    except Exception as e:
        raise HTTPException(502, f"评价失败: {e}") from e


@router.post("/demo/cases/{case_id}/pptx")
def export_pptx(case_id: str):
    session = session_store.get(case_id)
    if not session:
        case = knowledge_service.get_demo_case(case_id)
        if not case:
            raise HTTPException(404, "session/case not found")
        session = {"ppt": case["ppt"], "meta": {"label": case["label"]}}
    raw = export_pptx(session["ppt"], session.get("meta"))
    return Response(
        content=raw,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": 'attachment; filename="AI_Teacher_Coach.pptx"'},
    )


@router.post("/demo/cases/{case_id}/ppt/template")
def switch_ppt_template(case_id: str, body: TemplateSwitchRequest):
    session = session_store.get(case_id)
    if not session:
        raise HTTPException(404, "session not found — 请先启动课程")
    ppt = session.get("ppt") or {}
    # 保留内容，只换模板皮肤
    content = {
        "title": ppt.get("title"),
        "learning_objective": ppt.get("learning_objective"),
        "total_minutes": ppt.get("total_minutes") or 45,
        "slides": [
            {
                "type": s.get("type"),
                "purpose": s.get("purpose"),
                "title": s.get("title"),
                "subtitle": s.get("subtitle"),
                "key_message": s.get("key_message"),
                "bullets": s.get("bullets"),
                "left": s.get("left"),
                "right": s.get("right"),
                "steps": s.get("steps"),
                "interaction": s.get("interaction"),
                "closing": s.get("closing"),
                "minutes_hint": s.get("minutes_hint"),
                "text_excerpt": s.get("text_excerpt"),
                "text_evidence": s.get("text_evidence"),
                "analysis": s.get("analysis"),
                "analysis_cards": s.get("analysis_cards"),
                "teacher_guidance": s.get("teacher_guidance"),
                "student_task": s.get("student_task"),
                "source_reference": s.get("source_reference"),
            }
            for s in (ppt.get("slides") or [])
        ],
    }
    new_ppt = compile_ppt(
        content,
        template_id=body.template_id,
        curated=("赤壁" in str(session.get("meta", {}).get("label", ""))),
    )
    session["ppt"] = new_ppt
    session_store.save(session)
    return new_ppt


@router.get("/knowledge/pedagogy")
def pedagogy():
    return knowledge_service.load_pedagogy_rules()


@router.get("/knowledge/rubrics/{name}")
def rubric(name: str):
    try:
        return knowledge_service.load_rubric(name)
    except FileNotFoundError:
        raise HTTPException(404, name)
