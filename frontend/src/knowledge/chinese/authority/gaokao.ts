/**
 * 新高考评价体系 · 全国新高考 I 卷语文方向（第一阶段）
 * 来源抽象：教育部考试中心「一核四层四翼」+ 卷种能力结构
 */
export const GAOKAO_META = {
  name: '中国高考评价体系',
  volume: '全国新高考Ⅰ卷语文',
  short: '新高考评价体系',
  confidence: 0.96,
}

/** 一核四层四翼（摘要） */
export const GAOKAO_FRAME = {
  一核: '立德树人',
  四层: ['核心价值', '学科素养', '关键能力', '必备知识'],
  四翼: ['基础性', '综合性', '应用性', '创新性'],
}

export const GAOKAO_I_MODULES = {
  modern_reading: {
    name: '现代文阅读',
    skills: ['信息获取', '归纳概括', '观点分析', '论证评价'],
  },
  literature_reading: {
    name: '文学类文本阅读',
    skills: ['形象分析', '语言品味', '情感主旨', '手法效果'],
  },
  classical_reading: {
    name: '文言文阅读',
    skills: ['实词', '虚词', '特殊句式', '翻译', '内容理解', '文化常识'],
  },
  poetry: {
    name: '古诗词鉴赏',
    skills: ['意象意境', '抒情方式', '炼字炼句', '思想情感'],
  },
  language_use: {
    name: '语言文字运用',
    skills: ['词语辨析', '病句', '补写', '修辞效果'],
  },
  writing: {
    name: '写作',
    skills: ['立意', '论据', '结构', '文化素材调用'],
  },
} as const
