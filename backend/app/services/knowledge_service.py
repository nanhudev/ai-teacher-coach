from pathlib import Path
import json
from functools import lru_cache

KNOWLEDGE_ROOT = Path(__file__).resolve().parent.parent / "knowledge"


def _load_json(path: Path) -> dict | list:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache
def list_demo_cases() -> list[dict]:
    cases_dir = KNOWLEDGE_ROOT / "demo_cases"
    out = []
    for p in sorted(cases_dir.glob("*.json")):
        if p.stem.endswith("-ppt-content") or p.stem.endswith("-extra"):
            continue
        data = _load_json(p)
        if "id" not in data or "label" not in data:
            continue
        out.append(
            {
                "id": data["id"],
                "label": data["label"],
                "subject": data["subject"],
                "grade": data["grade"],
                "knowledge_points": data.get("knowledge_points", []),
            }
        )
    return out


@lru_cache
def get_demo_case(case_id: str) -> dict | None:
    path = KNOWLEDGE_ROOT / "demo_cases" / f"{case_id}.json"
    if not path.exists():
        return None
    return _load_json(path)


@lru_cache
def get_demo_case_extra(name: str) -> dict | None:
    path = KNOWLEDGE_ROOT / "demo_cases" / f"{name}.json"
    if not path.exists():
        return None
    return _load_json(path)


def load_pedagogy_rules() -> dict:
    root = KNOWLEDGE_ROOT / "pedagogy_rules"
    return {p.stem: _load_json(p) for p in root.glob("*.json")}


def load_teaching_template(subject_key: str) -> dict:
    root = KNOWLEDGE_ROOT / "teaching_templates"
    mapping = {
        "语文": "chinese",
        "数学": "math",
        "科学": "science",
    }
    name = mapping.get(subject_key, subject_key if (root / f"{subject_key}.json").exists() else "default")
    path = root / f"{name}.json"
    if not path.exists():
        path = root / "default.json"
    return _load_json(path)


def load_rubric(name: str) -> dict:
    path = KNOWLEDGE_ROOT / "evaluation_rubrics" / f"{name}.json"
    return _load_json(path)
