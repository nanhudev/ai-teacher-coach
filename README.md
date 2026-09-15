<div align="center">

# AI Teacher Coach

**An AI lesson-prep and classroom-practice tool for Chinese-language teachers**

One text or topic in → teaching analysis · lesson plan · Chinese-language slides · virtual-student classroom simulation · teaching evaluation

[![Live](https://img.shields.io/badge/live-bubbleapp.cn%2Faiteacher-4f86df?style=flat-square)](https://bubbleapp.cn/aiteacher/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-4D6BFE?style=flat-square)](https://deepseek.com/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square)](LICENSE)

**[English](README.md) · [中文](README.zh-CN.md)**

</div>

---

## What this is

A lesson-prep tool that is **actually live and actually being used by teachers** — not a prompt demo, not a slide generator.

It targets one concrete problem. In Chinese-language lesson prep, the expensive part is not writing prose. It is **keeping teaching judgement, textbook evidence, slide presentation and curriculum requirements aligned** — a teaching analysis that reads beautifully but contradicts the lesson plan, or a template that looks great but silently rewrites the source text. Both are common accidents in real classrooms.

**The design goal is not a complete commercial system. It is one trustworthy golden path.**

> No login → pick a text or type any topic → teaching analysis → lesson plan → slides → virtual-student simulation → teaching evaluation

**Status**: the public site is released and works on desktop and mobile. Arbitrary course topics, the user system and product analytics are in beta.

---

## Core design: the LLM does not do everything

This is the most important trade-off in the project, and it is written into `prompts/ppt_os_system.md`:

```
You (DeepSeek):   teaching reasoning and the question chain
Skill files:      hard rules (word counts, required sections, prohibitions)
Template library: aesthetics (ink-wash / academic / inquiry)
Renderer:         outputs React / PPTX
```

**Why split it this way**: if you ask one LLM to own *teaching reasoning* and *layout rules* and *aesthetics* at once, it lands around 70% on all three and produces something different every time. Pull hard rules and aesthetics out of the model and into version-controlled files, and:

- slide structure becomes **testable** (required sections, explicit prohibitions)
- switching templates **no longer loses source text**
- the model can concentrate on the one thing it is genuinely good at: teaching judgement

The same logic applies per page: every slide must declare a `slide_goal` — **each page serves one teaching objective**, rather than accumulating pages because they look good.

---

## Features

### Teaching analysis
Generated around the current course: the core question · scholarly points of contention · common student misreadings · comparative-reading directions · curriculum-standard and exam-syllabus grounding · advanced insight usable in a demonstration lesson.

**The analysis, the lesson plan and the slides share one course evidence pack** — structurally eliminating the "plan is relevant, analysis is boilerplate" failure.

### Arbitrary Chinese-language courses (Beta)
Not limited to textbook texts. You can enter:

| Course type | Example |
|---|---|
| Writing | How to write strong argument sub-claims |
| Comparative reading | The moon as image across classical poetry |
| Set-text study | Character relationships in *Dream of the Red Chamber* |
| Reading | Narrative point of view in fiction |
| Exam revision | Answering technique for classical-poetry emotion questions |

The system first classifies the course type, then matches a different teaching structure — **it no longer forces every course into the same close-reading template**.

### Five Chinese-language PPT masters

| Master | Best for |
|---|---|
| 国风·水墨卷 (ink-wash) | Classical poetry and prose, traditional culture |
| 简约·书刊白 (editorial white) | Modern prose close reading, ordinary lessons |
| 卡通·语文课堂 (classroom cartoon) | Introductory and activity lessons |
| 文学·杂志青 (literary magazine) | Comparative reading, essays, criticism |
| 叙事·电影书页 (cinematic) | Set texts, characters, stories |

Each covers author and background, close reading of the source, textual structure, key phrases, classroom tasks and exam transfer. **Switching templates does not lose source text.** Real `.pptx` export.

### Virtual-student classroom simulation
Three levels of virtual student — foundational, average, advanced — so a teacher can rehearse live responses.

- Student questions **must come from** the textbook text and vocabulary, the current objective and the current teaching stage (`prompts/simulation_agent.md` hard constraints). No small talk.
- Reference answers filter out model-analysis traces and grading language
- After each answer you see the student's change in understanding plus improvement suggestions

### Evidence layering and confidence labelling
`backend/app/agents/knowledge_retrieval_agent.py` buckets retrieved material into source text / annotations / author background / teaching resources / exam points, and attaches explicit confidence:

```python
"verification": {
    "verified": verified,
    "confidence": 0.88,
    "issues": [] if verified else ["缺少高置信原文，请教师上传或对照教材"],
    "suggestions": ["互联网结果不得直接当教材原文"],
}
```

**With no source text it reports `verified=false`, rather than pretending to know.** That rule lives in the code, not in a document.

### Users and privacy
- Guest identity or full CloudBase sign-in
- **Behaviour analytics requires explicit user consent**, and can be switched off with the user's own data deleted at any time
- Raw input detail is private by default; only de-identified content is visible after the operator verifies

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · Pydantic v2 · httpx |
| Frontend | React 18 · TypeScript · Vite |
| LLM | DeepSeek (OpenAI-compatible) |
| Export | python-pptx · python-docx |
| Deploy | CloudBase Hosting (frontend) + CloudBase Run (backend) |

---

## Quick start

### Requirements

- Python ≥ 3.11
- Node.js ≥ 18
- A DeepSeek API key (or any OpenAI-compatible endpoint)

### 1. Configure

```bash
cp .env.example .env
# fill in DEEPSEEK_API_KEY
```

### 2. Backend

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

cd backend
uvicorn app.main:app --reload --app-dir .
```

API docs: http://127.0.0.1:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173

### Check LLM connectivity

```bash
python scripts/test_deepseek.py
```

### Docker

```bash
docker build -t ai-teacher-coach .
docker run -p 8000:8000 --env-file .env ai-teacher-coach
```

---

## The golden path

1. On the home page click “高中语文 · 《赤壁赋》”, or type your own topic
2. Teaching analysis (pedagogy theory + instructional strategy)
3. Lesson plan + **objective-consistency score**
4. Slide preview in the browser (switch across 5 masters)
5. Before / After comparison
6. Three-role student simulation (submit an answer → watch understanding change)
7. Teaching evaluation report
8. Save the course and keep editing

> A full AI-generated pass takes about **1–2 minutes** (several LLM calls).
> For the sample lesson, untick “regenerate with DeepSeek” to get mock data instantly.

---

## Layout

```
backend/app/
  agents/             knowledge retrieval + course diagnosis (review_agent)
  knowledge/          the pedagogy moat
    pedagogy_rules/       constructivism / cognitivism / behaviourism / scaffolding / Bloom
    evaluation_rubrics/   classroom evaluation rubrics · objective consistency
    teaching_templates/   Chinese / maths / science / default
    demo_cases/           《赤壁赋》《分数》《二次函数》
  services/           generation pipeline · PPT export · telemetry · retrieval
  skills/ppt/         PPT hard rules (layout / charts / literature / demo lesson)
  prompts/            8 agent prompts
  api/                demo · review · knowledge · telemetry

frontend/src/
  knowledge/          Chinese-language knowledge layer (authoritative files / source texts / rubrics)
  knowledge_system/   assembly · retrieval · text understanding · validation
  ppt-engine/         PPT rendering (v3)
  pipeline/           blueprint · input parsing · main flow
  review/             local review
  pages/              golden-path pages

prompts/              root-level agent prompts (readable)
deploy/               CloudBase deployment notes
docs/                 product documentation
```

---

## Design trade-offs (and why not the alternative)

| Trade-off | Reasoning |
|---|---|
| Skill files own hard rules, the LLM owns teaching reasoning | Makes slide structure testable; avoids a model averaging 70% across every requirement |
| Analysis / plan / slides share one evidence pack | Structurally removes contradictions between the three |
| Every slide must declare `slide_goal` | Stops pages accumulating because they look good |
| No source text ⇒ `verified=false` | Better to admit ignorance than to invent textbook text |
| Classify course type before matching structure | Comparative reading and classical close reading should not share a frame |
| Analytics require explicit consent | Teachers' classroom data is sensitive; default is not to collect |

---

## Known limitations

An honest account of the current boundary:

- Arbitrary course types are still **Beta**; structure-matching quality is inconsistent
- A full generation pass takes 1–2 minutes, and long courses approach the ceiling
- The user system and data persistence are still being completed
- Pedagogy injection currently covers 5 families (constructivist / cognitive / behaviourist / scaffolding / Bloom), not every school
- Slide aesthetics depend on the template library; styles beyond the 5 masters need custom extension

---

## About

Designed and built by [Xuanjun Yu / 余宣均](https://github.com/nanhudev),
produced by [BubbleLab Technology Co., Ltd.](https://bubbleapp.cn), University of Macau.

> I build AI systems whose claims can be checked.

## License

[Apache-2.0](LICENSE)
