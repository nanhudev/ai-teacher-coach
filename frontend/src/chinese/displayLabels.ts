/**
 * 展示层词典：内部 enum → 中文。Renderer / Studio 禁止直接露出英文键。
 * // ponytail: 一处映射够用，不另起 display_dictionary.json
 */
import type { SlideType, PptTemplateId } from '../components/ppt/types'
import type { LiteraryKind } from '../knowledge/chinese/types'

export const KIND_LABEL: Record<LiteraryKind, string> = {
  classical: '文言文',
  modern_prose: '现代散文',
  narrative: '叙事散文',
  poetry: '诗歌',
}

export const PPT_STYLE_LABEL: Record<string, string> = {
  classical: '宣纸古籍',
  modern_prose: '文学杂志',
  competition: '公开课高对比',
  gaokao_review: '高考复习',
}

export const SLIDE_TYPE_LABEL: Record<SlideType, string> = {
  cover: '封面',
  opening: '开场',
  question: '问题',
  question_card: '主问题',
  quote_analysis: '原文细读',
  image_scene: '情境',
  concept: '概念',
  image_text: '图文',
  quote: '原文',
  timeline: '结构',
  comparison: '对比',
  process: '层次',
  activity: '活动',
  summary: '总结',
  homework: '作业',
  chart: '图表',
  text_analysis: '文本细读',
}

/** 常见内部阶段键（若泄漏到内容里，审核时拦截） */
export const STAGE_LABEL: Record<string, string> = {
  first_read: '初读文本',
  deep_analysis: '文本细读',
  transfer: '高考迁移',
  decode: '解码文本',
  evidence: '文本证据',
  inquire: '深度探究',
  value: '价值思辨',
  overview: '全文概览',
  close: '课堂收束',
  pre_class: '课前准备',
  lead_in: '情境导入',
}

const LATIN_LEAK =
  /\b(TBD|TODO|word\d+|key\d+|pre-class|tongjia|decode|transfer|overview|evidence|inquire|value|first_read|close_read|lead-in|classical|modern_prose)\b/i

export function slideTypeLabel(t: string): string {
  return SLIDE_TYPE_LABEL[t as SlideType] || STAGE_LABEL[t] || t
}

export function kindLabel(k: string): string {
  return KIND_LABEL[k as LiteraryKind] || PPT_STYLE_LABEL[k] || k
}

export function pptStyleLabel(s: string): string {
  return PPT_STYLE_LABEL[s] || s
}

export function templateLabel(id: PptTemplateId | string): string {
  const map: Record<string, string> = {
    academic: '学院留白',
    classroom: '课堂活力',
    showcase: '赛课展示',
    gamma: '柔和卡片（禁用）',
    noir: '墨色编辑',
    sage: '宣纸文学',
    coral: '文学杂志',
  }
  return map[id] || id
}

/** 内容是否含禁止露出的英文内部字段 */
export function hasLatinLeak(text: string): boolean {
  return LATIN_LEAK.test(text)
}
