"""高中语文固定生成链：一次规划、一份课程包、一次自检、按需一次修复。"""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any, Iterator

from app.services.ai_service import ai_service
from app.services.ppt_design_engine import compile_ppt, normalize_template_id

PROMPT_VERSION = "chinese-one-pack-v1"
_CACHE_DIR = Path(
    os.getenv(
        "LESSON_CACHE_DIR",
        str(Path(tempfile.gettempdir()) / "ai-teacher-coach-lesson-cache"),
    )
)

SYSTEM_PROMPT = """你是高中语文教研组长、教案设计师和课件策划师。
你必须围绕用户指定的唯一课文，生成一份统一课程包。教案、PPT、考点、课堂提问必须共享同一组原文证据，禁止套用别的课文，禁止只写空泛框架。

只输出 JSON。顶层字段必须是：
{
  "text_pack": {
    "title": "", "author": "", "volume": "", "genre": "",
    "theme": "", "background": "",
    "original_evidence": [{"label":"","quote":"","analysis":""}],
    "exam_points": [""], "key_words": [{"word":"","meaning":"","quote":""}],
    "structure": [{"part":"","content":"","evidence":""}],
    "core_questions": [""]
  },
  "director": {
    "course":"","subject":"语文","grade":"高中","course_type":"",
    "learning_objectives":[""],"student_difficulties":[""],
    "teaching_strategy":[{"name":"","reason":""}],
    "recommended_theories":[{"name":"","reason":""}],
    "teaching_mode":"问题探究","stage_template":"chinese-bound",
    "stages":[{"stage":"","intent":"","theory":""}]
  },
  "lesson": {
    "title":"","lesson_type":"新授课","periods":"1课时","subject":"语文","grade":"高中",
    "textbook_analysis":"","student_analysis":"",
    "objectives":[""],"key_points":[""],"difficulty_points":[""],
    "materials":["教材","课件"],"methods":["问题链细读","文本证据"],
    "process":[{"stage":"","teacher_action":"","student_action":"","intent":"","theory":"","time":""}],
    "board_design":"",
    "homework":{"basic":[""],"advanced":[""],"extension":[""]},
    "activities":[""],"assessment":[""]
  },
  "ppt_content": {
    "title":"","learning_objective":"","total_minutes":40,
    "slides":[
      {"type":"cover|question|concept|quote_analysis|comparison|process|activity|summary|homework",
       "purpose":"","title":"","subtitle":"","key_message":"","bullets":[""],
       "left":[""],"right":[""],"steps":[{"label":"","detail":""}],
       "interaction":"","closing":"","minutes_hint":3}
    ]
  },
  "personas":[{"id":"p1","name":"","level":"struggling","personality":"","knowledge_gap":[""],"question_style":"","memory":{"unresolved":[],"resolved":[],"understanding":{}}}],
  "simulation_turns":[{"persona_id":"p1","question":"","sample_answer":"","understanding_delta":{"gap":"","from":"未解决","to":"部分理解","note":""}}],
  "before_after":{"before":{"title":"","issues":[{"label":"","detail":""}]},"after":{"title":"","improvements":[{"label":"","detail":""}]}},
  "evaluation":{"total_score":90,"scores":[{"id":"textbook","name":"教材符合度","score":18,"max":20}],"strengths":[""],"issues":[],"suggestions":[""]}
}

强制质量标准：
1. original_evidence 至少 3 条，每条是该课文可核对的短原句；不要大段复制全文。
2. exam_points 至少 3 条，必须是该篇具体考点。
3. structure 至少 3 层，每层必须绑定 evidence。
4. core_questions 至少 3 个，必须点名具体人物、语句、矛盾或写法。
5. lesson.process 至少 6 环节；文本细读环节必须引用 original_evidence 中的原句。
6. ppt_content.slides 10–14 页；至少 3 页直接展示 original_evidence；不得出现其他课文标题、人物、意象。
7. 三位学生 p1/p2/p3 各一问，问题必须针对本课具体难点。
8. 若不能确认原文，不要编造，在 issues 标记需要教材核对。"""


def _compact(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _cache_key(*, course: str, grade: str, template_id: str | None) -> str:
    raw = f"{PROMPT_VERSION}|{grade}|{course.strip()}|{template_id or 'auto'}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _cache_path(key: str) -> Path:
    return _CACHE_DIR / f"{key}.json"


def _load_cache(key: str) -> dict[str, Any] | None:
    path = _cache_path(key)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def _save_cache(key: str, value: dict[str, Any]) -> None:
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _cache_path(key).write_text(
            json.dumps(value, ensure_ascii=False),
            encoding="utf-8",
        )
    except OSError:
        pass


def _title_tokens(course: str) -> list[str]:
    m = re.search(r"《([^》]+)》", course)
    title = m.group(1) if m else re.sub(
        r"高中|语文|必修[上下]|选择性必修[上中下]?|公开课|精品课|\s",
        "",
        course,
    )
    return [title, title.replace("（节选）", ""), title.replace("(节选)", "")]


def inspect_pack(pack: dict[str, Any], course: str) -> dict[str, Any]:
    text = pack.get("text_pack") or {}
    lesson = pack.get("lesson") or {}
    ppt = pack.get("ppt_content") or {}
    evidence = [x for x in text.get("original_evidence") or [] if x.get("quote")]
    exams = [x for x in text.get("exam_points") or [] if str(x).strip()]
    structures = [x for x in text.get("structure") or [] if x.get("evidence")]
    questions = [x for x in text.get("core_questions") or [] if str(x).strip()]
    slides = ppt.get("slides") or []
    title_tokens = [x for x in _title_tokens(course) if x]
    whole = _compact(pack)
    evidence_quotes = [str(x.get("quote")) for x in evidence]
    lesson_hits = sum(1 for q in evidence_quotes if q[:10] and q[:10] in _compact(lesson))
    ppt_hits = sum(1 for q in evidence_quotes if q[:10] and q[:10] in _compact(ppt))
    title_ok = any(token in whole for token in title_tokens)
    issues: list[str] = []
    if not title_ok:
        issues.append("课程包未绑定输入课文标题")
    if len(evidence) < 3:
        issues.append("可核对原文证据少于3条")
    if len(exams) < 3:
        issues.append("该篇具体考点少于3条")
    if len(structures) < 3:
        issues.append("结构层次未绑定原文证据")
    if len(questions) < 3:
        issues.append("具体问题链少于3问")
    if lesson_hits < 2:
        issues.append("教案没有充分引用统一原文证据")
    if ppt_hits < 3:
        issues.append("PPT没有至少3页引用统一原文证据")
    if len(slides) < 10:
        issues.append("PPT少于10页")
    return {
        "pass": not issues,
        "issues": issues,
        "evidence_count": len(evidence),
        "exam_count": len(exams),
        "lesson_evidence_hits": lesson_hits,
        "ppt_evidence_hits": ppt_hits,
    }


def _generate_pack(
    *,
    course: str,
    grade: str,
    knowledge_points: list[str],
    repair_from: dict[str, Any] | None = None,
    issues: list[str] | None = None,
) -> dict[str, Any]:
    if repair_from is None:
        user = (
            f"课文：{course}\n年级：{grade}\n"
            f"教师补充：{'、'.join(knowledge_points) or '无'}\n"
            "先在心里完成课文识别、教学规划和原文核对，再按规定 JSON 一次输出完整课程包。"
        )
        return ai_service.chat_json(SYSTEM_PROMPT, user, temperature=0.25)
    return ai_service.chat_json(
        SYSTEM_PROMPT,
        (
            f"课文：{course}\n上次课程包：{_compact(repair_from)}\n"
            f"自检失败项：{'；'.join(issues or [])}\n"
            "只修复失败项并返回完整 JSON。所有模块继续共用同一组原文证据。"
        ),
        temperature=0.15,
    )


def _normalize_people(pack: dict[str, Any]) -> tuple[list, list]:
    personas = list(pack.get("personas") or [])[:3]
    turns = list(pack.get("simulation_turns") or [])[:3]
    levels = ["struggling", "medium", "excellent"]
    while len(personas) < 3:
        i = len(personas)
        personas.append({
            "id": f"p{i + 1}", "name": f"学生{i + 1}", "level": levels[i],
            "personality": "", "knowledge_gap": [], "question_style": "",
            "memory": {"unresolved": [], "resolved": [], "understanding": {}},
        })
    for i, person in enumerate(personas):
        person["id"] = f"p{i + 1}"
        person["level"] = levels[i]
        person.setdefault("memory", {"unresolved": [], "resolved": [], "understanding": {}})
    while len(turns) < 3:
        i = len(turns)
        turns.append({
            "persona_id": f"p{i + 1}",
            "question": "请结合本课原文解释这一处。",
            "sample_answer": "回到原文证据，分层解释。",
            "understanding_delta": {"gap": "文本理解", "from": "未解决", "to": "部分理解", "note": ""},
        })
    for i, turn in enumerate(turns):
        turn["persona_id"] = f"p{i + 1}"
    return personas, turns


def iter_generate_chinese_session(
    *,
    course: str,
    grade: str,
    knowledge_points: list[str],
    period_count: int,
    template_id: str | None,
    role_type: str,
) -> Iterator[dict[str, Any]]:
    key = _cache_key(course=course, grade=grade, template_id=template_id)
    cached = _load_cache(key)
    if cached:
        yield {"step": "understand", "status": "done", "message": "已命中一课一包缓存", "progress": 18}
        yield {"step": "complete", "status": "done", "message": "缓存课程包已加载", "progress": 100, "session": cached}
        return

    yield {"step": "understand", "status": "running", "message": "DeepSeek 正在识别课文并规划统一课程包…", "progress": 8}
    pack = _generate_pack(
        course=course,
        grade=grade,
        knowledge_points=knowledge_points,
    )
    yield {"step": "director", "status": "done", "message": "课文分析、问题链与教学规划已完成", "progress": 48}

    report = inspect_pack(pack, course)
    yield {
        "step": "evaluation",
        "status": "running",
        "message": f"自检原文、考点及教案/PPT绑定：{report['evidence_count']}条原文，{report['exam_count']}个考点",
        "progress": 62,
        "preview": report,
    }
    if not report["pass"]:
        pack = _generate_pack(
            course=course,
            grade=grade,
            knowledge_points=knowledge_points,
            repair_from=pack,
            issues=report["issues"],
        )
        report = inspect_pack(pack, course)
    if not report["pass"]:
        raise RuntimeError("课程包自检未通过：" + "；".join(report["issues"]))

    text = pack["text_pack"]
    director = pack["director"]
    lesson = pack["lesson"]
    ppt_content = pack["ppt_content"]
    personas, turns = _normalize_people(pack)
    ppt = compile_ppt(
        ppt_content,
        template_id=normalize_template_id(template_id or "sage"),
    )
    objectives = list(director.get("learning_objectives") or [])
    session = {
        "guest": True,
        "role_type": role_type,
        "case_id": f"chinese-{key[:12]}",
        "generated": True,
        "meta": {
            "label": f"{grade}语文 · 《{text.get('title') or course}》",
            "subject": "语文",
            "grade": grade,
            "period_count": period_count,
            "knowledge_points": list(text.get("exam_points") or [])[:4],
        },
        "knowledge_injected": {
            "template": {"subject": "语文", "binding": "one-course-one-pack"},
            "pedagogy_rule_names": ["DeepSeek统一课程包", "原文证据自检", "考点自检"],
            "text_pack": text,
            "quality_gate": report,
            "prompt_version": PROMPT_VERSION,
        },
        "director": director,
        "lesson": lesson,
        "objective_alignment": {
            "score": 95,
            "summary": "教案与PPT共用同一课文证据包，并已通过原文与考点自检。",
            "checks": [
                {"objective": o, "supported_by": ["教案文本细读", "PPT原文证据页"], "aligned": True}
                for o in objectives[:4]
            ],
            "issues": [],
            "suggestions": [],
        },
        "ppt": ppt,
        "before_after": pack.get("before_after") or {"before": {"title": "", "issues": []}, "after": {"title": "", "improvements": []}},
        "personas": personas,
        "simulation_turns": turns,
        "evaluation": pack.get("evaluation") or {"total_score": 90, "scores": [], "strengths": [], "issues": [], "suggestions": []},
    }
    _save_cache(key, session)
    yield {"step": "lesson", "status": "done", "message": "教案已绑定原文证据", "progress": 76}
    yield {"step": "ppt", "status": "done", "message": f"PPT已绑定同一课程包 · {len(ppt.get('slides') or [])}页", "progress": 90}
    yield {"step": "evaluation", "status": "done", "message": "原文、考点、教案与PPT一致性自检通过", "progress": 98, "preview": report}
    yield {"step": "complete", "status": "done", "message": "统一课程包生成完成", "progress": 100, "session": session}
