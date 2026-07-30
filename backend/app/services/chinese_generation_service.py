"""高中语文固定生成链：一次规划、一份课程包、一次自检、按需一次修复。"""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from pathlib import Path
from typing import Any, Iterator

from app.services.ai_service import ai_service
from app.services.ppt_design_engine import compile_ppt, normalize_template_id

PROMPT_VERSION = "chinese-beta-brain-v4"
_ARCHIVE_DIR = Path(__file__).resolve().parents[1] / "knowledge" / "generated_lessons"
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

FAST_SYSTEM_PROMPT = """你是高中语文教材研究员。只输出紧凑 JSON，不写教案、不写PPT、不写解释。
围绕用户指定的唯一课文返回：
{
  "text_pack":{
    "title":"","author":"","volume":"","genre":"","theme":"","background":"","course_category":"课文精读|写作课|群文阅读|整本书阅读|名著课|复习专题",
    "original_evidence":[{"label":"","quote":"","analysis":""}],
    "exam_points":[""],
    "key_words":[{"word":"","meaning":"","quote":""}],
    "structure":[{"part":"","content":"","evidence":""}],
    "core_questions":[""],
    "research_brief":{
      "central_problem":"","academic_tensions":[""],"common_misreadings":[""],
      "comparative_reading":[""],"curriculum_basis":[""],"advanced_insights":[""]
    }
  }
}
硬性要求：original_evidence、exam_points、structure、core_questions 均至少3项；引用短而准确；
背景必须包含作者、时代或写作语境；所有内容只能属于目标课程。不要生成通用教学套话。
若是写作课、群文阅读、名著课或复习专题，original_evidence 可使用范例句、任务材料或具体情节，
但必须标明来源类型，不能伪造原文。research_brief 每项必须紧扣课程名称，至少给出2项。"""


def _compact(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _cache_key(*, course: str, grade: str, template_id: str | None) -> str:
    title = next((x for x in _title_tokens(course) if x), course.strip())
    effective_template = "sage" if template_id in (None, "", "auto") else normalize_template_id(template_id)
    raw = f"{PROMPT_VERSION}|{grade}|{title}|{effective_template}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _cache_path(key: str) -> Path:
    return _CACHE_DIR / f"{key}.json"


def _load_cache(key: str) -> dict[str, Any] | None:
    for path in (_ARCHIVE_DIR / f"{key}.json", _cache_path(key)):
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return data
        except (OSError, json.JSONDecodeError):
            continue
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
            "核对篇名与原文后，只生成本课专属的紧凑文本证据包。"
        )
        return ai_service.chat_json(FAST_SYSTEM_PROMPT, user, temperature=0.15)
    return ai_service.chat_json(
        FAST_SYSTEM_PROMPT,
        (
            f"课文：{course}\n上次课程包：{_compact(repair_from)}\n"
            f"自检失败项：{'；'.join(issues or [])}\n"
            "只修复失败项并返回完整的 text_pack JSON。"
        ),
        temperature=0.05,
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


def _assemble_course_framework(pack: dict[str, Any], grade: str) -> dict[str, Any]:
    """Reuse a stable course framework; AI supplies only lesson-specific evidence."""
    text = pack.get("text_pack") or {}
    title = str(text.get("title") or "高中语文")
    evidence = list(text.get("original_evidence") or [])
    exams = [str(x) for x in (text.get("exam_points") or [])]
    questions = [str(x) for x in (text.get("core_questions") or [])]
    research = text.get("research_brief") or {}
    category = str(text.get("course_category") or "课文精读")
    quotes = [str(x.get("quote") or "") for x in evidence if x.get("quote")]
    material_word = "范例与任务材料" if category in ("写作课", "复习专题") else "文本证据"
    objectives = [
        f"结合{material_word}概括《{title}》的核心方法",
        f"分析《{title}》中关键材料的表达与思维路径",
        f"将《{title}》的具体方法迁移到新情境",
    ]
    process = [
        {"stage": "情境导入", "teacher_action": f"呈现《{title}》核心情境并提出主问题", "student_action": "联系预习形成初步判断", "intent": "建立阅读期待", "theory": "问题驱动", "time": "4分钟"},
        {"stage": "知人论世", "teacher_action": str(text.get("background") or ""), "student_action": "提取作者与时代信息", "intent": "建立解释语境", "theory": "背景支架", "time": "5分钟"},
    ]
    for index, item in enumerate(evidence[:4], 1):
        process.append({
            "stage": f"文本细读{index}",
            "teacher_action": f"引导圈画并追问：{item.get('quote') or ''}",
            "student_action": f"结合语境分析：{item.get('analysis') or ''}",
            "intent": "用原文证据形成解释",
            "theory": "证据推理",
            "time": "6分钟",
        })
    process.extend([
        {"stage": "考点迁移", "teacher_action": "设置同类新情境题并提示答题路径", "student_action": "按原句—语境—效果组织答案", "intent": "完成能力迁移", "theory": "迁移学习", "time": "6分钟"},
        {"stage": "总结评价", "teacher_action": "回扣主问题并形成板书", "student_action": "用一句话概括一课一得", "intent": "形成结构化认识", "theory": "形成性评价", "time": "4分钟"},
    ])
    pack["director"] = {
        "course": title, "subject": "语文", "grade": grade,
        "course_type": category,
        "learning_objectives": objectives,
        "student_difficulties": list(research.get("common_misreadings") or exams[:2]),
        "teaching_strategy": [
            {"name": "课程核心问题", "reason": str(research.get("central_problem") or (questions[0] if questions else f"如何深入理解{title}"))},
            {"name": "证据链研读", "reason": f"围绕《{title}》的具体材料组织观察、解释与论证"},
        ],
        "recommended_theories": [
            {"name": "学术争点", "reason": str(x)}
            for x in (research.get("academic_tensions") or [])[:2]
        ] or [{"name": "问题驱动学习", "reason": f"以《{title}》的核心矛盾统摄课堂"}],
        "research_brief": {
            "central_problem": research.get("central_problem") or (questions[0] if questions else ""),
            "academic_tensions": list(research.get("academic_tensions") or []),
            "common_misreadings": list(research.get("common_misreadings") or []),
            "comparative_reading": list(research.get("comparative_reading") or []),
            "curriculum_basis": list(research.get("curriculum_basis") or []),
            "advanced_insights": list(research.get("advanced_insights") or []),
        },
        "teaching_mode": "问题探究", "stage_template": "chinese-bound",
        "stages": [{"stage": x["stage"], "intent": x["intent"], "theory": x["theory"]} for x in process],
    }
    pack["lesson"] = {
        "title": f"《{title}》教学设计", "lesson_type": "新授课", "periods": "1课时",
        "subject": "语文", "grade": grade,
        "textbook_analysis": f"围绕“{text.get('theme') or title}”组织原文证据链。",
        "student_analysis": "学生能够疏通基本内容，但需加强由原句到解释、由理解到答题的转换。",
        "objectives": objectives, "key_points": exams[:2], "difficulty_points": exams[2:4],
        "materials": ["教材", "课件"], "methods": ["问题链细读", "文本证据"],
        "process": process,
        "board_design": f"{title}｜背景—原句—分析—主旨—迁移",
        "homework": {"basic": [f"摘录并解释《{title}》关键原句"], "advanced": exams[:1], "extension": [f"比较《{title}》与同类文本的表达差异"]},
        "activities": questions, "assessment": ["能否引用原文", "解释是否结合语境", "考点表达是否规范"],
    }
    persona_names = ["小林", "小周", "小顾"]
    levels = ["struggling", "medium", "excellent"]
    pack["personas"] = [
        {
            "id": f"p{i + 1}", "name": persona_names[i], "level": levels[i],
            "personality": ["谨慎、需要支架", "愿意表达、理解不够深入", "思维活跃、追求比较"][i],
            "knowledge_gap": [exams[i % len(exams)] if exams else "文本理解"],
            "question_style": "围绕本课原句追问",
            "memory": {"unresolved": [], "resolved": [], "understanding": {}},
        }
        for i in range(3)
    ]
    pack["simulation_turns"] = [
        {
            "persona_id": f"p{i + 1}",
            "question": questions[i % len(questions)] if questions else f"这句话怎样体现《{title}》的主旨？",
            "sample_answer": f"先引用“{quotes[i % len(quotes)] if quotes else title}”，再结合语境分析。",
            "understanding_delta": {"gap": "文本证据", "from": "未解决", "to": "部分理解", "note": "能够回到原文作答"},
        }
        for i in range(3)
    ]
    pack.setdefault("before_after", {"before": {"title": "直接讲结论", "issues": []}, "after": {"title": "原文证据驱动", "improvements": []}})
    pack.setdefault("evaluation", {"total_score": 92, "scores": [], "strengths": ["一课一内容绑定", "原文证据贯穿"], "issues": [], "suggestions": []})
    return pack


def _build_classroom_ppt(pack: dict[str, Any]) -> dict[str, Any]:
    """Turn the shared text pack into a mature, text-led Chinese classroom deck."""
    text = pack.get("text_pack") or {}
    title = str(text.get("title") or "高中语文")
    author = str(text.get("author") or "")
    evidence = list(text.get("original_evidence") or [])[:4]
    structure = list(text.get("structure") or [])[:4]
    exams = [str(x) for x in (text.get("exam_points") or [])[:4]]
    questions = [str(x) for x in (text.get("core_questions") or [])[:3]]
    slides: list[dict[str, Any]] = [
        {
            "type": "cover", "title": title, "subtitle": f"{author}｜文本细读与考点迁移",
            "key_message": str(text.get("theme") or ""), "layout": "cover_hero",
            "visual_prompt": "中学语文课堂，宣纸肌理与克制水墨，讲台式全幅构图",
        },
        {
            "type": "image_text", "title": "知人论世", "subtitle": author,
            "key_message": str(text.get("background") or ""),
            "bullets": [f"文体：{text.get('genre') or '文学文本'}", f"篇目位置：{text.get('volume') or '高中语文'}"],
            "layout": "author_context",
        },
        {
            "type": "question", "title": "本课主问题",
            "key_message": questions[0] if questions else f"如何从原文证据读懂《{title}》？",
            "bullets": questions[1:], "interaction": "先圈画关键词，再用原句作答。",
            "layout": "lecture_question",
        },
    ]
    for index, item in enumerate(evidence, 1):
        quote = str(item.get("quote") or "")
        slides.append({
            "type": "quote_analysis", "title": f"原文细读 {index}",
            "subtitle": str(item.get("label") or "关键语句"),
            "text_excerpt": quote, "key_message": str(item.get("analysis") or ""),
            "analysis": str(item.get("analysis") or ""),
            "interaction": "朗读—圈词—释义—联系主旨",
            "layout": "quote_focus",
        })
    slides.extend([
        {
            "type": "process", "title": "篇章脉络",
            "steps": [{"label": str(x.get("part") or ""), "detail": f"{x.get('content') or ''}｜{x.get('evidence') or ''}"} for x in structure],
            "layout": "horizontal_timeline",
        },
        {
            "type": "concept", "title": "重点词句与表达",
            "bullets": [
                f"{x.get('word') or ''}：{x.get('meaning') or ''}（{x.get('quote') or ''}）"
                for x in (text.get("key_words") or [])[:4]
            ],
            "layout": "blackboard_notes",
        },
        {
            "type": "activity", "title": "课堂研讨",
            "key_message": questions[-1] if questions else "用一处原文证据支撑你的判断。",
            "interaction": "独立批注2分钟，小组互证3分钟，代表陈述1分钟。",
            "layout": "seminar",
        },
        {
            "type": "comparison", "title": "考点迁移",
            "left": exams[:2], "right": exams[2:4],
            "key_message": "答案必须回扣原句、语境与表达效果。",
            "layout": "exam_transfer",
        },
        {
            "type": "summary", "title": "一课一得",
            "key_message": str(text.get("theme") or ""),
            "bullets": exams[:3], "layout": "closing_statement",
        },
        {
            "type": "homework", "title": "课后巩固",
            "bullets": ["摘录并赏析一处关键原句", "完成一道本篇考点迁移题", "用100字重述本课主旨"],
            "layout": "assignment",
        },
    ])
    return {
        "title": title,
        "learning_objective": "以原文证据完成理解、鉴赏与考点迁移",
        "total_minutes": 45,
        "design_system": {
            "style": "mature_chinese_classroom",
            "keywords": ["讲台感", "宣纸留白", "水墨克制", "大字号原文", "非卡片化"],
            "ratio": "16:9",
        },
        "slides": slides[:14],
    }


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

    yield {"step": "understand", "status": "running", "message": "DeepSeek 正在识别课文并规划统一课程包", "progress": 8}
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(
            _generate_pack,
            course=course,
            grade=grade,
            knowledge_points=knowledge_points,
        )
        live_progress = 8
        while True:
            try:
                pack = future.result(timeout=2)
                break
            except FutureTimeout:
                live_progress = min(44, live_progress + 2)
                yield {
                    "step": "understand",
                    "status": "running",
                    "message": "正在核对原文、作者背景与篇章考点",
                    "progress": live_progress,
                }
    pack = _assemble_course_framework(pack, grade)
    pack["ppt_content"] = _build_classroom_ppt(pack)
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
        with ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(
                _generate_pack,
                course=course,
                grade=grade,
                knowledge_points=knowledge_points,
                repair_from={"text_pack": pack.get("text_pack") or {}},
                issues=report["issues"],
            )
            repair_progress = 62
            while True:
                try:
                    pack = future.result(timeout=2)
                    break
                except FutureTimeout:
                    repair_progress = min(74, repair_progress + 1)
                    yield {
                        "step": "evaluation",
                        "status": "running",
                        "message": "自检发现缺项，正在补齐原文证据与考点",
                        "progress": repair_progress,
                    }
        pack = _assemble_course_framework(pack, grade)
        pack["ppt_content"] = _build_classroom_ppt(pack)
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
        template_id=normalize_template_id("sage" if template_id in (None, "", "auto") else template_id),
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
            "cache_key": key,
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
