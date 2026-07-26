from __future__ import annotations

import json
from pathlib import Path

PROMPTS = Path(__file__).resolve().parent.parent / "prompts"


def load_prompt(name: str) -> str:
    return (PROMPTS / f"{name}.txt").read_text(encoding="utf-8")


def dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)
