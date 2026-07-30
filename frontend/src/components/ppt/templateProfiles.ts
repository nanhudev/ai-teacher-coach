import type { PptTemplateId, SlideType } from './types'

export type TemplateProfile = {
  id: PptTemplateId
  promise: string
  sequence: SlideType[]
  layoutRule: string
}

/** Narrative and layout systems; themes alone do not define these templates. */
export const TEMPLATE_PROFILES: Partial<Record<PptTemplateId, TemplateProfile>> = {
  sage: {
    id: 'sage',
    promise: '以宣纸留白承托原文，用淡墨层次与朱砂重点完成古诗文细读。',
    sequence: ['cover', 'image_text', 'question', 'quote_analysis', 'timeline', 'comparison', 'summary'],
    layoutRule: '大字原文为主角；一页一证据；装饰只使用印章、墨线与卷轴边界。',
  },
  academic: {
    id: 'academic',
    promise: '像一本清晰的语文读本：观点先行，正文与批注形成稳定阅读节奏。',
    sequence: ['cover', 'image_text', 'question', 'quote_analysis', 'process', 'comparison', 'summary'],
    layoutRule: '书刊网格与大留白；拒绝卡片墙；用页眉、细线和栏宽建立层级。',
  },
  classroom: {
    id: 'classroom',
    promise: '以柔和手绘元素拉近课堂距离，保留高中语文应有的克制与文本重量。',
    sequence: ['cover', 'question', 'image_text', 'quote_analysis', 'activity', 'process', 'homework'],
    layoutRule: '使用纸张、书签和手绘符号，不使用科技霓虹、玻璃拟态或儿童贴纸堆叠。',
  },
  doubao_story: {
    id: 'doubao_story',
    promise: '用一条情绪线带学生从场景进入文本，再回到问题。',
    sequence: ['cover', 'image_scene', 'quote', 'text_analysis', 'comparison', 'activity', 'summary'],
    layoutRule: '场景页全幅；引文页单句；细读页只保留一个证据焦点。',
  },
  gamma_narrative: {
    id: 'gamma_narrative',
    promise: '像一篇视觉文章：每页先给观点，再用文本或图像证明。',
    sequence: ['cover', 'question', 'image_text', 'concept', 'quote_analysis', 'timeline', 'summary'],
    layoutRule: '标题是结论；图片和文本形成主次，不使用等权卡片堆叠。',
  },
  seminar_studio: {
    id: 'seminar_studio',
    promise: '以问题链组织课堂，让学生产出可见的证据与判断。',
    sequence: ['cover', 'question', 'concept', 'comparison', 'process', 'activity', 'homework'],
    layoutRule: '每页只推进一个问题；活动页明确产出、时间与评价标准。',
  },
}
