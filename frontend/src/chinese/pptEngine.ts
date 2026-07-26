/**
 * Chinese PPT — 委托 PPT OS V2
 * 旧「文章切页 / title+bullet 堆砌」逻辑已废弃
 */
import type { PptDesign, PptTemplateId } from '../components/ppt/types'
import { TEMPLATE_META, normalizeTemplateId } from '../components/ppt/types'
import type { ChineseTextBrief } from './textAgent'
import type { ChineseTextKnowledge } from '../knowledge/chinese/types'
import { runPptOs } from '../ppt-os/runPptOs'
import { scorePptOs } from '../ppt-os/qualityAgent'

export function chineseStyleToTemplate(
  style: ChineseTextBrief['ppt_style'],
  prefer?: string,
  kind?: ChineseTextKnowledge['kind'],
): PptTemplateId {
  if (prefer && prefer !== 'auto') {
    const id = normalizeTemplateId(prefer)
    if (id === 'coral' && kind === 'classical') return 'sage'
    if (id === 'gamma' || id === 'classroom') return kind === 'modern_prose' ? 'coral' : 'sage'
    return id
  }
  if (style === 'competition') return 'noir'
  if (style === 'gaokao_review') return 'academic'
  if (style === 'modern_prose' || kind === 'modern_prose' || kind === 'narrative') return 'coral'
  return 'sage'
}

export function buildChinesePpt(brief: ChineseTextBrief, preferTemplate?: string): PptDesign {
  return runPptOs(brief, preferTemplate)
}

/** 兼容旧调用名：包级评价 = OS 质检 */
export function evaluateChinesePackage(
  ppt: PptDesign,
  brief: ChineseTextBrief,
): NonNullable<PptDesign['design_score']> {
  return scorePptOs(ppt.slides, brief)
}

export function templateLabel(id: string) {
  const tid = normalizeTemplateId(id)
  return TEMPLATE_META[tid]?.name || id
}
