import type { PptTemplateId, SlideType } from './types'

export type TemplateProfile = {
  id: PptTemplateId
  promise: string
  sequence: SlideType[]
  layoutRule: string
}

/** Narrative and layout systems; themes alone do not define these templates. */
export const TEMPLATE_PROFILES: Record<'doubao_story' | 'gamma_narrative' | 'seminar_studio', TemplateProfile> = {
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
