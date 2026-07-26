import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

/** 问题卡：一页一问，禁止附属 bullet 清单 */
export function QuestionSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const q = slide.main_question || slide.key_message || slide.title

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col justify-center px-14 py-12">
        <p className="text-xs tracking-[0.25em]" style={{ color: theme.accent }}>
          {slide.purpose || '课堂主问题'}
        </p>
        <h2
          className="mt-8 max-w-4xl font-semibold leading-[1.25]"
          style={{
            fontFamily: theme.fontDisplay,
            fontSize: 'clamp(1.75rem, 3.4vw, 2.75rem)',
          }}
        >
          {q}
        </h2>
        {slide.student_task && (
          <p className="mt-12 text-base" style={{ color: theme.muted }}>
            学生任务：{slide.student_task}
          </p>
        )}
        {(slide.teacher_guidance || slide.closing) && (
          <p className="mt-4 text-sm" style={{ color: theme.accent }}>
            {slide.teacher_guidance || slide.closing}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
