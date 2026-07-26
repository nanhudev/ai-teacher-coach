# AI Teacher Coach

基于教育学理论的 AI 备课与课堂训练助手（Demo）。

> 目标不是完整商业系统，而是在网页中跑通一条黄金体验路径：无需登录 → 选一门课 → 教学设计 / 教案 / PPT 预览 / AI 学生模拟 / 评价报告。

## 当前阶段：S1 真生成可用

- DeepSeek 已接通（`.env` 中 `USE_MOCK=false`）
- 首页可自定义课题，或对示例课勾选「用 DeepSeek 重新生成」
- 三套 PPT 模板网页预览 + **下载真实 .pptx**
- 知识层注入 → TeachingDirector → 教案 → 目标一致性 → PPT → 学生模拟 → 评价

### 注意

全链路 AI 生成约 **1–2 分钟**（多次 LLM 调用）。示例课取消勾选可秒开 Mock。

## 快速启动

### 1. 后端

```bash
cd C:\Users\Administrator\Documents\ai-teacher-coach
.\.venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --reload --app-dir .
```

API：http://127.0.0.1:8000/docs

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

打开：http://127.0.0.1:5173

## 黄金路径

1. 首页点「高中语文 · 《赤壁赋》」（或数学/分数案例）
2. 教研分析（理论 + 教学模式策略）
3. 教案 + 目标一致性分数
4. 课件网页预览
5. Before / After
6. 三角色学生模拟（提交回答 → 理解变化）
7. 评价报告

## 目录要点

```
backend/app/
  knowledge/          # 教育壁垒层 + demo_cases
  agents/             # TeachingDirectorAgent
  services/ai_service.py
  api/demo.py         # S0.5 mock API
frontend/src/pages/   # 黄金路径页面
```

## 部署到 bubbleapp.cn/aiteacher

见 `deploy/DEPLOY.md` 与 `deploy/nginx-aiteacher.conf.example`。

前端构建：

```bash
cd frontend
set VITE_BASE=/aiteacher/
set VITE_API_BASE=/aiteacher/api/v1
npm run build
```
