"""python-pptx 导出：三套模板，纯文字排版（无配图）。"""
from __future__ import annotations

from io import BytesIO
from typing import Any

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

from app.services.ppt_design_engine import normalize_template_id

W, H = Inches(13.333), Inches(7.5)

THEMES = {
    "academic": {
        "bg": RGBColor(250, 250, 248),
        "fg": RGBColor(31, 41, 55),
        "muted": RGBColor(100, 116, 139),
        "accent": RGBColor(15, 118, 110),
        "panel": RGBColor(255, 255, 255),
        "name": "Academic Minimal",
    },
    "classroom": {
        "bg": RGBColor(255, 247, 237),
        "fg": RGBColor(41, 37, 36),
        "muted": RGBColor(120, 113, 108),
        "accent": RGBColor(234, 88, 12),
        "panel": RGBColor(255, 255, 255),
        "name": "Modern Classroom",
    },
    "showcase": {
        "bg": RGBColor(11, 18, 32),
        "fg": RGBColor(248, 250, 252),
        "muted": RGBColor(148, 163, 184),
        "accent": RGBColor(245, 158, 11),
        "panel": RGBColor(26, 39, 64),
        "name": "Competition Showcase",
    },
    "gamma": {
        "bg": RGBColor(248, 250, 252),
        "fg": RGBColor(15, 23, 42),
        "muted": RGBColor(100, 116, 139),
        "accent": RGBColor(2, 132, 199),
        "panel": RGBColor(255, 255, 255),
        "name": "Gamma Soft",
    },
    "noir": {
        "bg": RGBColor(10, 10, 10),
        "fg": RGBColor(250, 250, 250),
        "muted": RGBColor(163, 163, 163),
        "accent": RGBColor(245, 245, 245),
        "panel": RGBColor(23, 23, 23),
        "name": "Noir Editorial",
    },
    "sage": {
        "bg": RGBColor(247, 249, 246),
        "fg": RGBColor(44, 58, 50),
        "muted": RGBColor(107, 124, 114),
        "accent": RGBColor(95, 122, 106),
        "panel": RGBColor(255, 255, 255),
        "name": "Sage Calm",
    },
    "coral": {
        "bg": RGBColor(255, 248, 246),
        "fg": RGBColor(63, 42, 38),
        "muted": RGBColor(140, 110, 104),
        "accent": RGBColor(232, 106, 91),
        "panel": RGBColor(255, 255, 255),
        "name": "Coral Warm",
    },
}


def _set_run(run, *, size=28, bold=False, color=None, font="Microsoft YaHei"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = font
    if color is not None:
        run.font.color.rgb = color
    try:
        from pptx.oxml.ns import qn

        r_pr = run._r.get_or_add_rPr()
        r_fonts = r_pr.get_or_add_rFonts()
        r_fonts.set(qn("a:ea"), font)
        r_fonts.set(qn("a:cs"), font)
    except Exception:
        pass


def _fill(shape, color: RGBColor):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def _bg(slide, theme):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    _fill(s, theme["bg"])


def _text(slide, l, t, w, h, text, *, size=28, bold=False, color=None, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = str(text or "")
    _set_run(run, size=size, bold=bold, color=color)


def _bullets(slide, l, t, w, h, items, theme, size=20):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    items = [str(x) for x in (items or []) if str(x).strip()][:3]
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(10)
        run = p.add_run()
        run.text = f"●  {item}"
        _set_run(run, size=size, color=theme["fg"])


def export_pptx(ppt: dict[str, Any], meta: dict[str, Any] | None = None) -> bytes:
    tid = normalize_template_id(ppt.get("template_id"))
    theme = THEMES[tid]
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]

    for raw in ppt.get("slides") or []:
        slide = prs.slides.add_slide(blank)
        _bg(slide, theme)
        stype = raw.get("type") or "concept"
        title = raw.get("title") or ""
        subtitle = raw.get("subtitle") or ""
        key = raw.get("key_message") or ""
        bullets = raw.get("bullets") or []

        if stype in ("cover", "opening"):
            _text(slide, Inches(1.2), Inches(2.0), Inches(10.8), Inches(2.0), title, size=44, bold=True, color=theme["fg"])
            if subtitle:
                _text(slide, Inches(1.2), Inches(4.2), Inches(10.8), Inches(0.8), subtitle, size=20, color=theme["muted"])
            if key:
                _text(slide, Inches(1.2), Inches(5.2), Inches(10.8), Inches(0.6), key, size=16, color=theme["accent"])
        elif stype == "comparison":
            _text(slide, Inches(0.9), Inches(0.7), Inches(11), Inches(1), title, size=32, bold=True, color=theme["fg"])
            lp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(2.0), Inches(5.5), Inches(4.2))
            _fill(lp, theme["panel"])
            rp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(2.0), Inches(5.5), Inches(4.2))
            _fill(rp, theme["panel"])
            _bullets(slide, Inches(1.2), Inches(2.4), Inches(4.8), Inches(3.4), raw.get("left") or bullets[:2], theme)
            _bullets(slide, Inches(7.2), Inches(2.4), Inches(4.8), Inches(3.4), raw.get("right") or bullets[2:], theme)
        elif stype == "homework":
            panel = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.2), Inches(1.5), Inches(8.9), Inches(4.5)
            )
            _fill(panel, theme["panel"])
            _text(
                slide,
                Inches(2.8),
                Inches(2.0),
                Inches(7.7),
                Inches(1),
                title,
                size=34,
                bold=True,
                color=theme["fg"],
                align=PP_ALIGN.CENTER,
            )
            _bullets(slide, Inches(3.5), Inches(3.4), Inches(6.3), Inches(2), bullets, theme)
            if raw.get("closing"):
                _text(
                    slide,
                    Inches(2.8),
                    Inches(5.3),
                    Inches(7.7),
                    Inches(0.4),
                    raw["closing"],
                    size=14,
                    color=theme["accent"],
                    align=PP_ALIGN.CENTER,
                )
        else:
            _text(slide, Inches(0.9), Inches(0.8), Inches(11.5), Inches(1.1), title, size=34, bold=True, color=theme["fg"])
            if key:
                _text(slide, Inches(0.9), Inches(2.0), Inches(11.5), Inches(0.6), key, size=18, color=theme["muted"])
            _bullets(slide, Inches(0.9), Inches(2.9), Inches(11.5), Inches(3.2), bullets, theme, size=22)
            if raw.get("interaction"):
                _text(
                    slide,
                    Inches(0.9),
                    Inches(6.3),
                    Inches(11),
                    Inches(0.4),
                    f"互动：{raw['interaction']}",
                    size=13,
                    color=theme["accent"],
                )

        _text(
            slide,
            Inches(0.7),
            Inches(7.05),
            Inches(10),
            Inches(0.3),
            f"{theme['name']}  ·  AI Teacher Coach",
            size=10,
            color=theme["muted"],
        )

    buf = BytesIO()
    prs.save(buf)
    return buf.getvalue()
