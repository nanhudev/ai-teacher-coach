<div align="center">

# AI Teacher Coach · 智课助手

**面向高中语文教师的 AI 备课与课堂训练工具**

输入一篇课文或任意课程主题 → 教研分析 · 教案 · 语文课件 · 虚拟学生课堂模拟 · 教学评价

[![在线体验](https://img.shields.io/badge/在线体验-bubbleapp.cn%2Faiteacher-4f86df?style=flat-square)](https://bubbleapp.cn/aiteacher/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-4D6BFE?style=flat-square)](https://deepseek.com/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square)](LICENSE)

</div>

---

## 这是什么

一个**真实上线并在被教师使用**的备课工具，不是 Prompt 演示，也不是 PPT 生成器。

它试图解决一个具体问题：高中语文备课里最耗时的不是"写字"，而是**把教学判断、教材依据、课件呈现和政策要求对齐**——
教研报告写得漂亮但和教案对不上，课件模板好看但把原文改掉了，这些都是真实课堂里的常见事故。

**设计目标：不是完整商业系统，而是跑通一条可信的黄金路径。**

> 无需登录 → 选课或输入课程主题 → 教研分析 → 教案 → 课件 → 虚拟学生模拟 → 教学评价

**当前状态**：已发布正式站，电脑端与手机端可用。任意课程、用户系统与产品统计处于 Beta。

---

## 核心设计：LLM 不做全部的事

这是这个项目最重要的一个取舍，写在 `prompts/ppt_os_system.md` 里：

```
你（DeepSeek）：教学思考与问题链
Skill 文件：    硬规则（字数、必含板块、禁止项）
模板库：        美学（水墨 / 学术 / 探究）
Renderer：      输出 React / PPTX
```

**为什么这样分**：如果让 LLM 同时负责"教学思考"和"排版规则"和"美学"，
它会在三项里都做到 70 分，而且每次输出都不一致。
把硬规则和美学从模型里拿出来、变成可版本控制的文件之后：

- 课件结构变得**可测试**（有必含板块、有禁止项）
- 换模板**不丢原文内容**
- 模型只需要专注做它真正擅长的事：教学判断

同样地，每页 PPT 必须声明 `slide_goal`——**每页服务于一个教学目标**，
而不是为了好看而堆砌页面。

---

## 功能

### 教研分析
围绕当前课程生成：本课核心问题 · 学术争点 · 学生常见误读 · 比较阅读方向 ·
课程标准与考点依据 · 可用于公开课的进阶洞见。

**教研分析、教案、课件共用同一份课程证据**——这是为了消除"教案相关、教研报告却是套路话"。

### 任意语文课程（Beta）
不只支持教材课文。可直接输入：

| 课程类型 | 示例 |
|---|---|
| 写作课 | 如何写好议论文分论点 |
| 群文阅读 | 古诗中的月亮意象 |
| 名著课 | 《红楼梦》人物关系 |
| 阅读课 | 小说叙事视角 |
| 复习专题 | 古诗词情感题答题方法 |

系统先判断课程类型，再匹配不同的教学结构，**不再把所有课程套进同一套课文精读框架**。

### 五套语文 PPT 母版

| 母版 | 适用 |
|---|---|
| 国风·水墨卷 | 古诗文、文言文、传统文化 |
| 简约·书刊白 | 现代文精读、常态课 |
| 卡通·语文课堂 | 导入课、活动课、基础学情 |
| 文学·杂志青 | 群文阅读、散文、文学评论 |
| 叙事·电影书页 | 名著、人物、故事类课程 |

包含作者与写作背景、原文细读、篇章结构、重点词句、课堂任务、考点迁移。
**模板切换不丢失原文内容。** 可导出真实 `.pptx`。

### 虚拟学生课堂模拟
提供基础 / 普通 / 优秀三个层次的虚拟学生，教师可以练习现场回应。

- 学生提问**必须来自**教材原文与字词、当前教学目标、当前教学阶段（`prompts/simulation_agent.md` 硬性约束），不闲聊
- 参考回答会过滤模型分析痕迹和评分话术
- 回答后显示学生理解变化与改进建议

### 证据分层与可信度标注
`backend/app/agents/knowledge_retrieval_agent.py` 把检索到的语料分桶为
原文 / 注释 / 作者背景 / 教学资源 / 考点，并给出显式可信度：

```python
"verification": {
    "verified": verified,
    "confidence": 0.88,
    "issues": [] if verified else ["缺少高置信原文，请教师上传或对照教材"],
    "suggestions": ["互联网结果不得直接当教材原文"],
}
```

**没有原文就标 `verified=false`，而不是假装知道。** 这条规则写在代码里，不写在文档里。

### 用户与隐私
- 访客身份或 CloudBase 正式登录
- **行为统计必须先获得用户同意**，用户可随时关闭并删除自己的统计数据
- 原始输入明细默认不公开，仅管理员验证后可查看脱敏内容

---

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | FastAPI · Pydantic v2 · httpx |
| 前端 | React 18 · TypeScript · Vite |
| LLM | DeepSeek（OpenAI 兼容协议） |
| 导出 | python-pptx · python-docx |
| 部署 | CloudBase Hosting（前端）+ CloudBase Run（后端） |

---

## 快速开始

### 前置要求

- Python ≥ 3.11
- Node.js ≥ 18
- DeepSeek API Key（或任意 OpenAI 兼容端点）

### 1. 配置

```bash
cp .env.example .env
# 填入 DEEPSEEK_API_KEY
```

### 2. 后端

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

cd backend
uvicorn app.main:app --reload --app-dir .
```

API 文档：http://127.0.0.1:8000/docs

### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

打开 http://127.0.0.1:5173

### 验证 LLM 连通性

```bash
python scripts/test_deepseek.py
```

### Docker

```bash
docker build -t ai-teacher-coach .
docker run -p 8000:8000 --env-file .env ai-teacher-coach
```

---

## 黄金路径

1. 首页点「高中语文 · 《赤壁赋》」，或自定义课题
2. 教研分析（教育学理论 + 教学模式策略）
3. 教案 + **目标一致性分数**
4. 课件网页预览（可切 5 套母版）
5. Before / After 对比
6. 三角色学生模拟（提交回答 → 观察理解变化）
7. 教学评价报告
8. 保存课程，继续编辑

> 全链路 AI 生成约 **1–2 分钟**（多次 LLM 调用）。
> 示例课取消勾选「用 DeepSeek 重新生成」可秒开 Mock 数据。

---

## 目录结构

```
backend/app/
  agents/             知识检索 + 课程诊断（review_agent）
  knowledge/          教育壁垒层
    pedagogy_rules/       建构主义 / 认知主义 / 行为主义 / 支架式 / 布卢姆
    evaluation_rubrics/   课堂评价量表 · 目标一致性
    teaching_templates/   语文 / 数学 / 科学 / 默认
    demo_cases/           《赤壁赋》《分数》《二次函数》
  services/           生成流水线 · PPT 导出 · 遥测 · 检索
  skills/ppt/         PPT 硬规则（布局 / 图表 / 文学 / 公开课）
  prompts/            8 个 Agent 提示词
  api/                demo · review · knowledge · telemetry

frontend/src/
  knowledge/          语文知识层（权威文件 / 课文原文 / 评价标准）
  knowledge_system/   组装 · 检索 · 文本理解 · 校验
  ppt-engine/         PPT 渲染（v3）
  pipeline/           蓝图 · 输入解析 · 主流程
  review/             本地评审
  pages/              黄金路径页面

prompts/              根级 Agent 提示词（可读版）
deploy/               CloudBase 部署说明
docs/                 产品介绍
```

---

## 设计取舍（与"为什么不是另一种做法"）

| 取舍 | 理由 |
|---|---|
| Skill 文件管硬规则，LLM 管教学思考 | 让课件结构可测试；避免模型在多项要求上平均做到 70 分 |
| 教研 / 教案 / 课件共用同一份课程证据 | 从结构上消除三者互相矛盾 |
| 每页必须声明 `slide_goal` | 防止为了好看堆页面 |
| 无原文即标 `verified=false` | 宁可承认不知道，也不编造教材原文 |
| 先判断课程类型再匹配结构 | 群文阅读和文言文精读不该用同一套框架 |
| 统计需明示同意 | 教师课堂数据敏感，默认不采集 |

---

## 已知限制

诚实说明当前边界：

- 任意课程类型仍是 **Beta**，结构匹配质量不稳定
- 全链路生成 1–2 分钟，长课程会接近上限
- 用户系统与数据持久化仍在完善
- 教育理论注入目前覆盖 5 类（建构/认知/行为/支架/布卢姆），未覆盖全部流派
- 课件美学依赖模板库，超出 5 套母版的风格需要自行扩展

---

## 关于

由 [余宣均 / Xuanjun Yu](https://github.com/nanhudev) 设计与开发，
[BubbleLab 泡泡泡泡科技有限公司](https://bubbleapp.cn) 出品，澳门大学。

> I build AI systems whose claims can be checked.

## 许可

[Apache-2.0](LICENSE)
