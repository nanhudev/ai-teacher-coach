import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

/** 问题卡：一页只问一个真问题，不要 bullet 清单 */
export function QuestionCardSlide({
  slide,
  theme,
}: {
  slide: EngineSlide
  theme: ThemeTokens
}) {
  const q = slide.main_question || slide.key_message || slide.title
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col justify-center px-14 py-12">
        <p className="text-[11px] tracking-[0.22em]" style={{ color: theme.accent }}>
          {slide.purpose || '课堂主问题'}
        </p>
        <h2
          className="mt-8 max-w-4xl font-semibold leading-[1.25]"
          style={{
            fontFamily: theme.fontDisplay,
            fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)',
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
