/**
 * 普通高中语文课程标准（2017 年版 2020 年修订）— 教研约束摘要
 * 给 Agent 用，不直接甩给老师看政策全文
 */
export const CURRICULUM_META = {
  name: '普通高中语文课程标准（2017年版2020年修订）',
  short: '新课标',
  authority: '教育部',
  confidence: 1,
}

/** 语文核心素养四维 */
export const CORE_COMPETENCIES = [
  {
    id: 'language',
    name: '语言建构与运用',
    focus: '在真实语境中积累、梳理语言现象，正确有效运用祖国语言文字',
  },
  {
    id: 'thinking',
    name: '思维发展与提升',
    focus: '直觉、形象、逻辑、辩证、创造等思维品质的发展',
  },
  {
    id: 'aesthetic',
    name: '审美鉴赏与创造',
    focus: '感受美、鉴赏美、表现美、创造美的能力与品质',
  },
  {
    id: 'culture',
    name: '文化传承与理解',
    focus: '传承中华文化、理解多样文化、增强文化自信',
  },
] as const

/** 学习任务群（节选，按文体映射） */
export const LEARNING_TASK_GROUPS = {
  literature: {
    id: 'literature',
    name: '文学阅读与写作',
    intent: '感受形象、品味语言、体验情感；用写作深化理解',
  },
  practical: {
    id: 'practical',
    name: '实用性阅读与交流',
    intent: '获取信息、处理信息、应对实际交流情境',
  },
  argumentative: {
    id: 'argumentative',
    name: '思辨性阅读与表达',
    intent: '发展逻辑思维与批判性思维，理性表达',
  },
  classical: {
    id: 'classical',
    name: '中华传统文化经典研习',
    intent: '梳理文言现象，体会文化精神，增强文化自信',
  },
  poetry: {
    id: 'poetry',
    name: '中国革命传统作品 / 文学阅读',
    intent: '品味意境与语言，体会家国情怀与审美创造',
  },
} as const

export type TaskGroupKey = keyof typeof LEARNING_TASK_GROUPS
