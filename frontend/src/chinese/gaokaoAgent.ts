/**
 * NewGaokaoAgent — 全国新高考Ⅰ卷方向
 * 输出本课考试价值（禁止空泛「可能考什么」）
 */
import type { ChineseTextBrief } from './textAgent'
import { GAOKAO_FRAME, GAOKAO_I_MODULES, GAOKAO_META } from '../knowledge/chinese/authority'

export type GaokaoExamValue = {
  volume: string
  frame: typeof GAOKAO_FRAME
  exam_value: {
    classical_chinese?: string[]
    reading?: string[]
    literature?: string[]
    poetry?: string[]
    language_use?: string[]
    writing?: string[]
  }
  /** 课堂微题对准点 */
  classroom_hooks: string[]
  basis_short: string
  confidence: number
}

export function runNewGaokaoAgent(brief: ChineseTextBrief): GaokaoExamValue {
  const kind = brief.text?.kind || (brief.ppt_style === 'classical' ? 'classical' : 'modern_prose')
  const exam_value: GaokaoExamValue['exam_value'] = {}
  const hooks: string[] = []

  if (kind === 'classical') {
    const words = brief.knowledge_points.文言实词.slice(0, 3).map((w) => w.split('：')[0])
    exam_value.classical_chinese = [
      ...GAOKAO_I_MODULES.classical_reading.skills.slice(0, 4),
      ...(words.length ? [`本课实词：${words.join('、')}`] : []),
    ]
    exam_value.writing = ['文化素材积累', '人物/思想评价作论据']
    hooks.push(
      `翻译关键句并落实实词（${words[0] || '重点实词'}）`,
      '用原文证据评价人物选择/思想',
    )
  } else if (kind === 'poetry') {
    exam_value.poetry = [...GAOKAO_I_MODULES.poetry.skills]
    exam_value.writing = ['意象与情感素材']
    hooks.push('炼字题：换字比较效果', '概括诗中情感并引用诗句')
  } else {
    exam_value.literature = [...GAOKAO_I_MODULES.literature_reading.skills]
    exam_value.reading = ['文本理解', '结构层次', '主旨概括']
    exam_value.writing = ['散文审美素材', '细腻感受的表达']
    hooks.push(
      '手法→画面→情感赏析一句',
      `对准考点：${brief.exam_focus[0] || '语言品味'}`,
    )
  }

  exam_value.language_use = ['语境中的词语理解', '修辞效果简述']

  return {
    volume: GAOKAO_META.volume,
    frame: GAOKAO_FRAME,
    exam_value,
    classroom_hooks: hooks.slice(0, 3),
    basis_short: '新高考评价体系',
    confidence: GAOKAO_META.confidence,
  }
}
