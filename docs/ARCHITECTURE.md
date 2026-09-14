# 架构说明

本文档解释这套系统**为什么这样搭**。功能列表见 README。

## 一、要解决的核心问题

AI 备课工具最典型的失败不是"生成不出来"，而是生成了一堆**互相矛盾且不可验证**的内容：

- 教研报告说教学重点是 A，教案写的是 B，课件里出现了 C
- 课件很漂亮，但把教材原文改写了
- 页面为了好看层层堆砌，没有一页服务于教学目标
- 模型不知道原文时，直接编一段看起来很像的文言文

这个项目的绝大部分架构决策，都是针对这几类失败设计的。

## 二、四层分工（最重要的设计）

写在 `prompts/ppt_os_system.md` 里：

```
你（DeepSeek）：教学思考与问题链
Skill 文件：    硬规则（字数、必含板块、禁止项）
模板库：        美学（水墨 / 学术 / 探究）
Renderer：      输出 React / PPTX
```

### 为什么不让 LLM 全都做

如果让模型同时负责教学思考、排版规则和美学，结果是三项都做到约 70 分，
而且**每次输出都不一致**——同一个教案两次生成可能结构不同，无法测试、无法回归。

把硬规则和美学从模型里抽出来变成文件之后：

| 收益 | 说明 |
|---|---|
| 可测试 | 课件结构有必含板块和禁止项，可以断言 |
| 可复现 | 换模板不丢原文内容（内容与呈现解耦） |
| 可迭代 | 改版式只改模板，不用改提示词 |
| 模型专注 | LLM 只做它真正擅长的教学判断 |

### 每页必须声明 slide_goal

```
每页服务一个教学目标（slide_goal）
```

这是把"防止堆页面"从口头要求变成**结构约束**——没有目标的页面无法通过。

## 三、单一课程证据

教研分析、教案、课件**共用同一份课程证据**（`pipeline_service.py` 编排）。

这是为了解决 README 里提到的具体事故："教案相关，教研报告却是套路话"。
如果三个环节各自独立调用模型理解课文，它们必然漂移。
共享证据层之后，三者只在**呈现方式**上不同，不在**事实依据**上不同。

## 四、证据分层与可信度

`backend/app/agents/knowledge_retrieval_agent.py`：

```python
chunks = search_chinese_topic(topic, allow_internet=allow_internet)
originals  = [c for c in chunks if c.get("kind") == "original_text"]
annotations = [c for c in chunks if c.get("kind") == "annotation"]
backgrounds = [c for c in chunks if c.get("kind") == "author_background"]
teaching    = [c for c in chunks if c.get("kind") in ("teaching_resource", "method")]
exams       = [c for c in chunks if c.get("kind") == "exam_point"]
```

语料被分桶成 原文 / 注释 / 作者背景 / 教学资源 / 考点，并显式给出可信度：

```python
verified = len(originals) >= 1 and all(c.get("confidence", 0) >= 0.8 for c in originals)
confidence = 0.88 if verified else (0.55 if chunks else 0.3)
```

**没有原文时 `verified=false` 并附上教师可执行的动作**
（"缺少高置信原文，请教师上传或对照教材"），同时固定一条约束：

```python
"suggestions": ["互联网结果不得直接当教材原文"]
```

这条规则写在**代码里**而不是文档里——文档里的规则会被忽略，代码里的不会。

## 五、课程类型路由

任意课程 Beta 的做法是：**先判断课程类型，再匹配教学结构**。

```
输入主题
   ↓
课程类型识别（写作课 / 群文阅读 / 名著课 / 阅读课 / 复习专题 / 教材精读）
   ↓
匹配对应教学结构模板
   ↓
后续流水线
```

不这样做的话，所有课程都会被套进"课文精读"框架——
"如何写好议论文分论点"被拆成段落大意分析，就是典型的错误输出。

## 六、教育学理论注入

`backend/app/knowledge/pedagogy_rules/` 提供：

- `constructivism.json` 建构主义
- `cognitivism.json` 认知主义
- `behaviorism.json` 行为主义
- `scaffolding.json` 支架式教学
- `bloom_taxonomy.json` 布卢姆分类

`TeachingDirectorAgent` 的输出被约束为只能引用这几类理论：

```
theory 只能使用：建构主义、行为主义、认知主义、支架式教学。
```

**限制取值域**是为了防止模型为了一致性给理论乱起名字（"生态建构主义"之类），
这类幻觉在教育场景里特别有说服力也特别有害。

## 七、生成体验

长链路生成（1–2 分钟，多次 LLM 调用）的体验问题：

- 阶段进度持续显示，而不是转圈
- 503 或服务冷启动时自动重试
- 进度条居中，手机端可读

这不是装饰——教师在没有反馈的 90 秒里会直接关掉页面。

## 八、隐私

- 访客可用，无需强登录
- **统计需明示同意**，可随时关闭并删除自己的数据
- 原始输入默认不公开，管理员仅可见脱敏内容

教师上传的备课材料包含未公开的教学设计，默认不采集是唯一合理的默认值。

## 九、已知限制

- 任意课程类型仍 Beta，结构匹配不稳定
- 理论库覆盖 5 类，未覆盖全部教学流派
- 数据持久化仍不完整（`USE_MOCK` 与示例课程可离线跑）
- 课件美学依赖模板库，超出 5 套母版需自行扩展
