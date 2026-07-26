# AI Teacher Coach — 前端架构与完整代码

> 生成时间：2026-07-25  
> 工程路径：`C:\Users\Administrator\Documents\ai-teacher-coach\frontend`  
> 线上地址：https://bubbleapp.cn/aiteacher/  
> 技术栈：React 19 + TypeScript + Vite 8 + Tailwind 4 + React Router 7  
> 导出：`pptxgenjs`（PPTX）· `docx` + `file-saver`（教案 Word）

---

## 1. 产品定位（前端视角）

静态可部署的教师 Demo：任意课题 → 学科理解 → 视觉策划 → Slide DSL → 预览；  
可**独立**生成教案（DOCX）或课件（PPTX），也可走完整教研流。

CloudBase 静态托管无 API 时，走本地 **PPT Engine V3 + Lesson Engine**；有后端则优先 SSE。

---

## 2. 总体架构

```
LandingPage (mode: full | lesson | ppt)
        |
        v
   api/demo.ts  —— try API ——失败——> 本地引擎
        |                              |
        |                    ppt-engine/v3 + lesson-engine
        v
  DemoContext.session (mode)
        |
   +----+----+----+----+----+----+
   |    |    |    |    |    |
Director Lesson PptStudio BeforeAfter Sim Eval
 (full)  +DOCX  +PPTX     (full only...)
```

### 路由（HashRouter @ `/aiteacher/`）

| 路径 | 页面 | 可见模式 |
|------|------|----------|
| `/` | LandingPage | 始终 |
| `/demo/director` | 教研分析 | full |
| `/demo/lesson` | 教案 + DOCX | full, lesson |
| `/demo/ppt` | 课件工作室 + PPTX | full, ppt |
| `/demo/before-after` | Before/After | full |
| `/demo/simulation` | AI 学生模拟 | full |
| `/demo/evaluation` | 评价报告 | full |

---

## 3. 目录树

```
frontend/
├── index.html
├── package.json
├── vite.config.ts          # VITE_BASE=/aiteacher/
├── tsconfig*.json
└── src/
    ├── main.tsx / App.tsx / index.css
    ├── api/demo.ts
    ├── state/DemoContext.tsx
    ├── types/demo.ts
    ├── data/offline.ts + offline-chibi.json
    ├── lesson-engine/  buildLesson.ts + exportLessonDocx.ts
    ├── ppt-engine/v3/  understand → visual → plan → compile → export
    ├── components/ DemoShell, StepNav, ppt/*
    └── pages/ Landing, Director, Lesson, Ppt, ...
```

---

## 4. 核心模块

### PPT Engine V3

`understandCourse` → `directVisual` → `planSlides` → `compilePlan` → 预览 / `exportPptxClient`

学科：humanities / math / stem / primary → Museum / Math Precision / STEM / Primary。

### Lesson Engine

`buildStandardLesson`（三维目标 / 过程表 / 分层作业 / 中高考衔接）→ `exportLessonDocx`

### 模式分流

`session.mode`: `full` | `lesson` | `ppt` — `DemoShell` 按模式收缩导航。

### 静态站

`VITE_API_BASE` 请求失败时本地生成；HashRouter 避免深链 404。

### 部署

```powershell
$env:VITE_BASE="/aiteacher/"
$env:VITE_API_BASE="/aiteacher/api/v1"
npm run build
tcb hosting deploy "dist" "aiteacher" -e bubble-8g3kzhr57e693e49
```

---

## 5. 完整源码

以下收录 `frontend` 配置与 `src` 下全部源码（不含 node_modules / dist）。

---
