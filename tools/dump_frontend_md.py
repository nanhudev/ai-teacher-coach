# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(r"C:\Users\Administrator\Documents\ai-teacher-coach\frontend")
src = root / "src"
desk = Path(r"C:\Users\Administrator\Desktop")
header_path = Path(r"C:\Users\Administrator\Documents\ai-teacher-coach\tools\frontend_md_header.md")
out = desk / "AI-Teacher-Coach-frontend.md"

for p in list(desk.glob("AI-Teacher-Coach*.md")) + list(desk.glob("_encoding_test.md")):
    try:
        p.unlink()
    except OSError:
        pass

parts = [header_path.read_text(encoding="utf-8"), "\n"]

files: list[Path] = []
for name in [
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "index.html",
]:
    p = root / name
    if p.exists():
        files.append(p)

files.extend(
    sorted(
        f
        for f in src.rglob("*")
        if f.is_file() and f.suffix.lower() in {".ts", ".tsx", ".css", ".json", ".html"}
    )
)

for f in files:
    rel = f.relative_to(root).as_posix()
    lang = f.suffix.lstrip(".")
    if f.stat().st_size > 500_000:
        parts.append(f"\n### `{rel}`\n\n> skipped large file: `{f}`\n\n")
        continue
    text = f.read_text(encoding="utf-8")
    parts.append(f"\n### `{rel}`\n\n```{lang}\n{text}\n```\n\n")

out.write_text("".join(parts), encoding="utf-8")
print("OK", out)
print("bytes", out.stat().st_size)
print("files", len(files))
# verify chinese in header survived
sample = out.read_text(encoding="utf-8")[:80]
print("has_frontend_cn", "\u524d\u7aef" in sample)
