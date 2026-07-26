import type { CourseBrief, DesignSystem, DesignSystemId } from './types'

const SYSTEMS: Record<DesignSystemId, Omit<DesignSystem, 'id'>> = {
  museum_story: {
    style: 'museum_story',
    template_id: 'sage',
    color_palette: ['#F7F9F6', '#2C3A32', '#5F7A6A', '#C4A574'],
    font_pair: 'Noto Serif SC / DM Sans',
    image_style: 'ink wash / museum lighting',
    layout_rule: 'one idea per slide · large title · sparse text',
    rhythm: 'cover → mood → close-read → contrast → activity → close',
  },
  math_precision: {
    style: 'math_precision',
    template_id: 'noir',
    color_palette: ['#0A0A0A', '#FAFAFA', '#38BDF8', '#FBBF24'],
    font_pair: 'DM Sans / JetBrains Mono feel',
    image_style: 'coordinate · curve · annotation',
    layout_rule: 'hero chart left/right · ≤3 bullets',
    rhythm: 'cover → question → graph → meaning → mistake → practice',
  },
  stem_visual: {
    style: 'stem_visual',
    template_id: 'academic',
    color_palette: ['#FAFAF8', '#0F766E', '#1F2937', '#F59E0B'],
    font_pair: 'DM Sans / Noto Serif SC',
    image_style: 'experiment diagram · force arrows',
    layout_rule: 'model first · formula second',
    rhythm: 'phenomenon → model → law → experiment → apply',
  },
  primary_colorful: {
    style: 'primary_colorful',
    template_id: 'coral',
    color_palette: ['#FFF8F6', '#E86A5B', '#3F2A26', '#FBBF24'],
    font_pair: 'DM Sans rounded',
    image_style: 'card · pie · friendly icons',
    layout_rule: 'big visual · short words · interaction chip',
    rhythm: 'hook → play → name → check → celebrate',
  },
  academic_minimal: {
    style: 'modern_academic',
    template_id: 'academic',
    color_palette: ['#FAFAF8', '#0F766E', '#1F2937'],
    font_pair: 'Noto Serif SC / DM Sans',
    image_style: 'keynote minimal',
    layout_rule: '留白优先',
    rhythm: 'cover → question → develop → activity → summary',
  },
  modern_classroom: {
    style: 'modern_classroom',
    template_id: 'classroom',
    color_palette: ['#FFF7ED', '#EA580C', '#292524'],
    font_pair: 'DM Sans',
    image_style: 'classroom cards',
    layout_rule: 'clear agenda · activity heavy',
    rhythm: 'hook → teach → practice → exit ticket',
  },
}

/** VisualArtDirectorAgent：只定美学与模板，不写正文 */
export function directVisual(brief: CourseBrief, preferTemplate?: string): DesignSystem {
  let id: DesignSystemId = 'academic_minimal'
  if (brief.category === 'humanities') id = 'museum_story'
  else if (brief.category === 'math') id = 'math_precision'
  else if (brief.category === 'stem') id = 'stem_visual'
  else if (brief.category === 'primary') id = 'primary_colorful'
  else if (/小学|初中/.test(brief.grade)) id = 'modern_classroom'

  const base = SYSTEMS[id]
  if (preferTemplate && preferTemplate !== 'auto') {
    return {
      id,
      ...base,
      template_id: preferTemplate,
    }
  }
  return { id, ...base }
}
