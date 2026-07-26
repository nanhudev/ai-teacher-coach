"""课程诊断 — DeepSeek 教研员评价（教案+PPT）。"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from app.services.ai_service import ai_service

_ROOT = Path(__file__).resolve().parents[3]
_PROMPTS = _ROOT / "prompts"
_EVAL = _ROOT / "frontend" / "src" / "knowledge" / "chinese" / "evaluation"


def _load(name: str, fallback: str) -> str:
    p = _PROMPTS / name
    if p.exists():
        return p.read_text(encoding="utf-8")
    return fallback


def _eval_snippet() -> str:
    bits: list[str] = []
    for fn in ("new_curriculum.json", "gaokao_standard.json", "excellent_lesson.json", "ppt_quality.json"):
        path = _EVAL / fn
        if path.exists():
            bits.append(f"## {fn}\n{path.read_text(encoding='utf-8')[:2500]}")
    return "\n\n".join(bits) if bits else "依据新课标核心素养、学习任务群、新高考评价体系与公开课标准。"


def review_course(
    *,
    lesson_text: str = "",
    ppt_text: str = "",
    topic_hint: str = "",
    source_files: list[str] | None = None,
) -> dict[str, Any]:
    lesson_text = (lesson_text or "").strip()[:18000]
    ppt_text = (ppt_text or "").strip()[:18000]
    if not lesson_text and not ppt_text:
        raise ValueError("需要至少一份教案或课件文本")

    system = _load(
        "review_system.md",
        "你是中国高中语文特级教师和教研员。任务是评价教师已有课程，不是重写。"
        "依据新课标、新高考、核心素养与优秀公开课标准。指出具体问题并给可执行方案。只输出 JSON。",
    )
    ppt_guide = _load(
        "ppt_review.md",
        "检查课件是否含文本细读、问题链、学习任务、高考关联；视觉是否字密、节奏差。",
    )

    user = (
        f"课题提示：{topic_hint or '（从材料推断）'}\n"
        f"文件：{', '.join(source_files or [])}\n\n"
        f"【评价标准摘要】\n{_eval_snippet()}\n\n"
        f"【PPT评审要点】\n{ppt_guide}\n\n"
        f"【教案文本】\n{lesson_text or '（未上传教案）'}\n\n"
        f"【课件文本】\n{ppt_text or '（未上传课件）'}\n\n"
        "输出 JSON：\n"
        "{\n"
        '  "topic": "推断课题",\n'
        '  "total_score": 87,\n'
        '  "curriculum_score": 90,\n'
        '  "teaching_score": 85,\n'
        '  "ppt_score": 78,\n'
        '  "activity_score": 82,\n'
        '  "visual_score": 70,\n'
        '  "content_score": 82,\n'
        '  "lesson_analysis": {\n'
        '    "score": 85,\n'
        '    "strengths": ["..."],\n'
        '    "problems": ["..."],\n'
        '    "optimization": ["..."]\n'
        "  },\n"
        '  "ppt_analysis": {\n'
        '    "score": 78,\n'
        '    "content_score": 82,\n'
        '    "visual_score": 70,\n'
        '    "issues": ["..."],\n'
        '    "optimization": ["..."]\n'
        "  },\n"
        '  "suggestions": ["可执行建议1", "建议2"],\n'
        '  "optimize_brief": "给优化引擎的一句话指令（保留优点、补齐问题）",\n'
        '  "theory_basis": ["新课标核心素养", "学习任务群", "..."]\n'
        "}"
    )

    try:
        parsed = ai_service.chat_json(system, user, temperature=0.3)
        return _normalize(parsed, source_files or [], lesson_text, ppt_text, "deepseek")
    except Exception as e:
        return _heuristic(lesson_text, ppt_text, source_files or [], topic_hint, str(e))


def _normalize(
    parsed: dict[str, Any],
    source_files: list[str],
    lesson_text: str,
    ppt_text: str,
    source: str,
) -> dict[str, Any]:
    lesson = parsed.get("lesson_analysis") if isinstance(parsed.get("lesson_analysis"), dict) else {}
    ppt = parsed.get("ppt_analysis") if isinstance(parsed.get("ppt_analysis"), dict) else {}
    total = int(parsed.get("total_score") or _avg([
        parsed.get("curriculum_score"),
        parsed.get("teaching_score"),
        parsed.get("ppt_score"),
        parsed.get("activity_score"),
    ]) or 75)

    return {
        "id": f"review_{abs(hash((lesson_text[:80], ppt_text[:80])) % 10_000_000)}",
        "source": source,
        "source_files": source_files,
        "topic": parsed.get("topic") or "高中语文课程",
        "total_score": total,
        "curriculum_score": int(parsed.get("curriculum_score") or total),
        "teaching_score": int(parsed.get("teaching_score") or lesson.get("score") or total),
        "ppt_score": int(parsed.get("ppt_score") or ppt.get("score") or (70 if ppt_text else 0)),
        "activity_score": int(parsed.get("activity_score") or 75),
        "visual_score": int(parsed.get("visual_score") or ppt.get("visual_score") or 70),
        "content_score": int(parsed.get("content_score") or ppt.get("content_score") or 75),
        "lesson_analysis": {
            "score": int(lesson.get("score") or parsed.get("teaching_score") or total),
            "strengths": list(lesson.get("strengths") or [])[:6],
            "problems": list(lesson.get("problems") or [])[:6],
            "optimization": list(lesson.get("optimization") or [])[:6],
        },
        "ppt_analysis": {
            "score": int(ppt.get("score") or parsed.get("ppt_score") or 0),
            "content_score": int(ppt.get("content_score") or parsed.get("content_score") or 0),
            "visual_score": int(ppt.get("visual_score") or parsed.get("visual_score") or 0),
            "issues": list(ppt.get("issues") or [])[:6],
            "optimization": list(ppt.get("optimization") or [])[:6],
        },
        "suggestions": list(parsed.get("suggestions") or [])[:8],
        "optimize_brief": parsed.get("optimize_brief")
        or "按诊断建议优化：补文本细读、问题链与学生任务，控制课件密度。",
        "theory_basis": list(parsed.get("theory_basis") or ["新课标核心素养", "学习任务群", "新高考评价体系"]),
        "extracted": {
            "lesson_chars": len(lesson_text),
            "ppt_chars": len(ppt_text),
            "lesson_preview": lesson_text[:400],
            "ppt_preview": ppt_text[:400],
        },
    }


def _avg(vals: list[Any]) -> int | None:
    nums = [int(v) for v in vals if isinstance(v, (int, float))]
    if not nums:
        return None
    return round(sum(nums) / len(nums))


def _heuristic(
    lesson_text: str,
    ppt_text: str,
    source_files: list[str],
    topic_hint: str,
    err: str,
) -> dict[str, Any]:
    """DeepSeek 不可用时的规则诊断 — 保证上传链路可演示。"""
    strengths: list[str] = []
    problems: list[str] = []
    opts: list[str] = []
    issues: list[str] = []

    def has(*ks: str) -> bool:
        blob = lesson_text + ppt_text
        return any(k in blob for k in ks)

    teach = 70
    if has("教学目标", "目标"):
        strengths.append("出现教学目标表述")
        teach += 5
    else:
        problems.append("未明确写出可观察的教学目标")
        opts.append("用核心素养四维写可检测目标")
        teach -= 8

    if has("原文", "文本", "细读", "品析", "鉴赏"):
        strengths.append("有文本细读/品析意识")
        teach += 6
    else:
        problems.append("缺少文本细读环节")
        opts.append("增加「圈画—证据—归纳」问题链")
        teach -= 10

    if has("学生", "小组", "讨论", "任务", "活动"):
        strengths.append("包含学生活动设计")
        teach += 4
    else:
        problems.append("学生活动偏弱或未写明")
        opts.append("每个环节补一句学生任务")
        teach -= 6

    if has("高考", "考点", "新课标", "核心素养", "任务群"):
        strengths.append("有课标/高考关联")
        teach += 4
    else:
        problems.append("课标与新高考关联不足")
        opts.append("点明任务群与可迁移的高考设问")

    ppt_score = 0
    content = 0
    visual = 0
    if ppt_text:
        content = 72
        visual = 68
        if has("原文", "文本"):
            content += 8
        else:
            issues.append("缺少原文分析页")
            content -= 8
        if has("任务", "思考", "讨论"):
            content += 5
        else:
            issues.append("缺少课堂任务/学生思考页")
        # density heuristic
        long_pages = sum(1 for line in ppt_text.split("【第") if len(line) > 350)
        if long_pages >= 2:
            issues.append("页面文字密度过高")
            visual -= 10
            opts.append("每页保留一个核心问题+一句原文证据")
        ppt_score = round((content + visual) / 2)

    curriculum = 78 if has("核心素养", "任务群", "课标") else 68
    activity = 80 if has("学生", "小组", "讨论") else 65
    total = round(
        (min(95, max(45, teach)) + curriculum + (ppt_score or teach) + activity) / (4 if ppt_text else 3)
    )

    topic = topic_hint or ""
    for mark in ("《", "》"):
        if "《" in (lesson_text + ppt_text) and not topic:
            import re

            m = re.search(r"《([^》]+)》", lesson_text + ppt_text)
            if m:
                topic = m.group(1)
                break
    if not topic:
        topic = "高中语文课程"

    return _normalize(
        {
            "topic": topic,
            "total_score": total,
            "curriculum_score": curriculum,
            "teaching_score": min(95, max(45, teach)),
            "ppt_score": ppt_score,
            "activity_score": activity,
            "visual_score": visual,
            "content_score": content,
            "lesson_analysis": {
                "score": min(95, max(45, teach)),
                "strengths": strengths or ["材料已成功解析"],
                "problems": problems or ["可进一步对照公开课标准打磨"],
                "optimization": opts or ["补问题链与文本证据"],
            },
            "ppt_analysis": {
                "score": ppt_score,
                "content_score": content,
                "visual_score": visual,
                "issues": issues or (["未上传课件"] if not ppt_text else []),
                "optimization": [o for o in opts if "页" in o or "课件" in o or "密度" in o][:4],
            },
            "suggestions": (opts + problems)[:6],
            "optimize_brief": f"优化《{topic}》：{ '；'.join((opts or problems)[:3]) }",
            "theory_basis": ["新课标核心素养", "学习任务群", "新高考评价体系", "公开课标准"],
            "_fallback_error": err,
        },
        source_files,
        lesson_text,
        ppt_text,
        "local_heuristic",
    )
