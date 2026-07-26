"""在线检索服务：权威资料优先，互联网结果强制低置信。"""
from __future__ import annotations

import re
from typing import Any

# 离线权威名句（与前端 curated 对齐；联网只作补充）
_CURATED: dict[str, dict[str, Any]] = {
    "岳阳楼记": {
        "author": "范仲淹",
        "lines": [
            "先天下之忧而忧，后天下之乐而乐。",
            "至若春和景明，波澜不惊，上下天光，一碧万顷。",
        ],
        "words": [("属", "通「嘱」，嘱托"), ("微", "如果没有")],
    },
    "师说": {
        "author": "韩愈",
        "lines": ["师者，所以传道受业解惑也。"],
        "words": [("所以", "用来……的"), ("受", "通「授」")],
    },
    "劝学": {
        "author": "荀子",
        "lines": ["君子曰：学不可以已。", "青，取之于蓝，而青于蓝。"],
        "words": [("已", "停止"), ("于", "比；从")],
    },
}


def search_chinese_topic(topic: str, *, allow_internet: bool = False) -> list[dict[str, Any]]:
    """按优先级返回 sourced chunks。默认不联网。"""
    s = re.sub(r"\s+", "", topic or "")
    chunks: list[dict[str, Any]] = []

    for title, data in _CURATED.items():
        if title in s or s in title:
            for i, line in enumerate(data["lines"]):
                chunks.append(
                    {
                        "id": f"be-curated-{title}-{i}",
                        "kind": "original_text",
                        "content": line,
                        "meta": {"label": "名句", "author": data["author"], "title": title},
                        "source": "curated",
                        "source_label": f"权威公开资料·《{title}》",
                        "confidence": 0.88,
                        "topic": title,
                    }
                )
            for i, (w, m) in enumerate(data["words"]):
                chunks.append(
                    {
                        "id": f"be-curated-{title}-w-{i}",
                        "kind": "annotation",
                        "content": f"{w}：{m}",
                        "meta": {"word": w, "meaning": m},
                        "source": "curated",
                        "source_label": f"权威公开资料·《{title}》注释",
                        "confidence": 0.86,
                        "topic": title,
                    }
                )
            break

    if allow_internet and not chunks:
        # ponytail: 不接真实爬虫；占位说明需人工/教师上传
        chunks.append(
            {
                "id": "be-internet-stub",
                "kind": "teaching_resource",
                "content": f"未命中权威语料。请教师上传《{topic}》原文与注释，或开启教材精校。",
                "source": "internet",
                "source_label": "互联网资料（未核实）",
                "confidence": 0.4,
                "topic": topic,
            }
        )

    return chunks
