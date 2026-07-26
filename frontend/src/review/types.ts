export type CourseReview = {
  id: string
  source: string
  source_files: string[]
  topic: string
  total_score: number
  curriculum_score: number
  teaching_score: number
  ppt_score: number
  activity_score: number
  visual_score: number
  content_score: number
  lesson_analysis: {
    score: number
    strengths: string[]
    problems: string[]
    optimization: string[]
  }
  ppt_analysis: {
    score: number
    content_score: number
    visual_score: number
    issues: string[]
    optimization: string[]
  }
  suggestions: string[]
  optimize_brief: string
  theory_basis: string[]
  extracted?: {
    lesson_chars: number
    ppt_chars: number
    lesson_preview?: string
    ppt_preview?: string
  }
  parsed_files?: { filename?: string; kind?: string; chars?: number; slide_count?: number }[]
}

const KEY = 'aiteacher.course_review.v1'

export function saveReview(r: CourseReview) {
  localStorage.setItem(KEY, JSON.stringify(r))
}

export function loadReview(): CourseReview | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CourseReview) : null
  } catch {
    return null
  }
}

export function clearReview() {
  localStorage.removeItem(KEY)
}
