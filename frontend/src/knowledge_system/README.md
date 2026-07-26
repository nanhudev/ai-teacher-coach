# 高中语文知识系统 V6（RAG）

```
用户课题
  → Knowledge Retrieval（教材精校 → 教师上传 → 权威语料 → 教研方法）
  → Text Understanding
  → Knowledge Verifier（可信度 / 原文 / 禁英文泄漏）
  → 组装教学包 → cache
  → Teaching Director / Lesson / PPT
```

**壁垒是审核链，不是无限联网。** 互联网默认关闭；开启后置信度封顶 0.7，且不得当教材原文。

| 目录 | 作用 |
|------|------|
| `sources/textbook` | 精校包（原 texts/*.json），置信 1.0 |
| `sources/curated` | 名句级权威公开语料 |
| `sources/teacher_upload` | 教师私有资料（localStorage） |
| `chinese_knowledge/` | 按知识类型：方法/高考/常识 |
| `agents/` | 检索 / 理解 / 审核 / 组装 |
| `search_service.ts` | 多源检索入口 |

后端镜像：`POST /api/v1/knowledge/search|retrieve`
