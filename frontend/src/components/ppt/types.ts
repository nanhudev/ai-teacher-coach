/** PPT Design Engine — 共享类型与美学规则 */

export type PptTemplateId =
  | 'academic'
  | 'classroom'
  | 'showcase'
  | 'gamma'
  | 'noir'
  | 'sage'
  | 'coral'
  | 'doubao_story'
  | 'gamma_narrative'
  | 'seminar_studio'

export type SlideType =
  | 'cover'
  | 'opening'
  | 'question'
  | 'question_card'
  | 'quote_analysis'
  | 'image_scene'
  | 'concept'
  | 'image_text'
  | 'quote'
  | 'timeline'
  | 'comparison'
  | 'process'
  | 'activity'
  | 'summary'
  | 'homework'
  | 'chart'
  | 'text_analysis'

export type SlideLayout = 'full' | 'left-image' | 'right-image' | 'split' | 'centered'

export type EngineSlide = {
  id: number
  type: SlideType
  component: string
  purpose?: string
  title: string
  subtitle?: string
  key_message?: string
  bullets?: string[]
  left?: string[]
  right?: string[]
  steps?: { label: string; detail?: string }[]
  interaction?: string
  closing?: string
  layout?: SlideLayout
  minutes_hint?: number
  chart?: import('../../ppt-engine/v3/types').ChartSpec
  visual_prompt?: string
  /** 教材出处，如「报任安书 · 生死价值段」 */
  source_reference?: string
  /** 新课标/任务对齐（给老师看任务，不堆政策） */
  curriculum_goal?: string
  text_evidence?: string
  student_task?: string
  teacher_guidance?: string
  /** PPT OS V2 */
  slide_goal?: string
  main_question?: string
  analysis_cards?: { word: string; effect: string }[]
}

export type DesignScore = {
  total: number
  visual: number
  pedagogy: number
  density: number
  interaction: number
  issues: string[]
  suggestions: string[]
}

export type PptDesign = {
  template_id: PptTemplateId | string
  template_name: string
  title?: string
  learning_objective?: string
  total_minutes?: number
  slides: EngineSlide[]
  design_score?: DesignScore
  engine?: string
  design_system?: unknown
  course_brief?: unknown
}

export const TEMPLATE_META: Record<
  PptTemplateId,
  { name: string; positioning: string; vibe: string; swatch: string }
> = {
  academic: {
    name: '学院留白',
    positioning: '高校 / 高中精品课',
    vibe: '大留白 · 墨绿点缀',
    swatch: 'linear-gradient(135deg,#FAFAF8,#0F766E)',
  },
  classroom: {
    name: '课堂活力',
    positioning: '小学 / 初中',
    vibe: '暖色 · 亲和',
    swatch: 'linear-gradient(135deg,#FFF7ED,#EA580C)',
  },
  showcase: {
    name: '赛课展示',
    positioning: '公开课比赛',
    vibe: '故事化 · 高对比',
    swatch: 'linear-gradient(135deg,#0B1220,#F59E0B)',
  },
  gamma: {
    name: '柔和卡片（语文禁用）',
    positioning: '通用网课',
    vibe: '商业卡片风',
    swatch: 'linear-gradient(135deg,#EEF2FF,#38BDF8)',
  },
  noir: {
    name: '墨色编辑',
    positioning: '高中研讨 / 公开课',
    vibe: '杂志封面 · 高对比',
    swatch: 'linear-gradient(135deg,#111111,#E5E5E5)',
  },
  sage: {
    name: '宣纸文学',
    positioning: '文言文公开课',
    vibe: '宣纸 · 墨色 · 朱砂 · 留白',
    swatch: 'linear-gradient(135deg,#F3EFE6,#9F1239)',
  },
  coral: {
    name: '文学杂志',
    positioning: '现代散文',
    vibe: '冷青 · 少卡片',
    swatch: 'linear-gradient(135deg,#F7FAF8,#3F6F5C)',
  },
  doubao_story: {
    name: '豆包·沉浸叙事',
    positioning: '语文 / 人文故事课',
    vibe: '全幅场景 · 章节转场 · 留白引文',
    swatch: 'linear-gradient(135deg,#12261F,#C8A36A)',
  },
  gamma_narrative: {
    name: 'Gamma·杂志讲述',
    positioning: '公开课 / 主题讲解',
    vibe: '编辑式版面 · 图文节奏 · 观点先行',
    swatch: 'linear-gradient(135deg,#F7F3EC,#426B62)',
  },
  seminar_studio: {
    name: '研讨·课堂工作室',
    positioning: '探究课 / 小组研讨',
    vibe: '问题链 · 证据墙 · 任务收束',
    swatch: 'linear-gradient(135deg,#102238,#4DC2B6)',
  },
}

export const ALL_TEMPLATE_IDS = Object.keys(TEMPLATE_META) as PptTemplateId[]

/** 归一化旧 template_id */
export function normalizeTemplateId(id?: string): PptTemplateId {
  if (!id) return 'sage'
  if (id === 'modern') return 'academic'
  if (id === 'lively') return 'classroom'
  if ((ALL_TEMPLATE_IDS as string[]).includes(id)) return id as PptTemplateId
  return 'sage'
}

export function countChineseChars(text: string): number {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length
}

export function bodyCharCount(slide: EngineSlide): number {
  const parts = [
    slide.key_message || '',
    ...(slide.bullets || []),
    ...(slide.left || []),
    ...(slide.right || []),
    slide.interaction || '',
    slide.closing || '',
  ]
  return countChineseChars(parts.join(''))
}
