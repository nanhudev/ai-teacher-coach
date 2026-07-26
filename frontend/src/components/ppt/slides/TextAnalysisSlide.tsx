import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

/**
 * 语文细读页：原文居中 → 字词/句式旁注 → 教师点拨
 * 替代「概念卡片堆英文字段」的假细读
 */
export function TextAnalysisSlide({
  slide,
  theme,
}: {
  slide: EngineSlide
  theme: ThemeTokens
}) {
  const notes = slide.steps?.length
    ? slide.steps
    : (slide.bullets || []).map((b) => {
        const [label, ...rest] = b.split(/[：:]/)
        return { label: label.trim(), detail: rest.join('：').trim() || undefined }
      })

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-12 py-9">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs tracking-[0.2em]" style={{ color: theme.accent }}>
            {slide.purpose || '文本细读'}
          </p>
          {slide.source_reference && (
            <p className="text-[11px]" style={{ color: theme.muted }}>
              {slide.source_reference}
            </p>
          )}
        </div>

        <h2
          className="mt-2 font-semibold tracking-wide"
          style={{ fontFamily: theme.fontDisplay, fontSize: 'clamp(1.35rem, 2.2vw, 1.9rem)' }}
        >
          {slide.title}
        </h2>

        {slide.subtitle && (
          <p className="mt-1 text-sm" style={{ color: theme.muted }}>
            {slide.subtitle}
          </p>
        )}

        {slide.main_question && (
          <p className="mt-3 text-sm font-medium" style={{ color: theme.accent }}>
            主问题：{slide.main_question}
          </p>
        )}

        <blockquote
          className="mt-6 border-l-[3px] pl-5"
          style={{ borderColor: theme.accent }}
        >
          <p
            className="leading-relaxed tracking-wide"
            style={{
              fontFamily: theme.fontDisplay,
              fontSize: 'clamp(1.2rem, 2.1vw, 1.65rem)',
            }}
          >
            {slide.key_message}
          </p>
        </blockquote>

        {!!notes.length && (
          <div className="mt-7 grid flex-1 grid-cols-2 gap-x-8 gap-y-3 content-start">
            {notes.slice(0, 6).map((n, i) => (
              <div key={i} className="min-w-0">
                <p
                  className="text-base font-semibold tracking-wider"
                  style={{ fontFamily: theme.fontDisplay, color: theme.accent }}
                >
                  {n.label}
                </p>
                {n.detail && (
                  <p className="mt-0.5 text-sm leading-snug" style={{ color: theme.fg }}>
                    {n.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {slide.closing && (
          <p
            className="mt-4 border-t pt-3 text-sm"
            style={{ borderColor: theme.border, color: theme.accent }}
          >
            {slide.closing}
          </p>
        )}
        {(slide.student_task || slide.curriculum_goal) && (
          <div className="mt-3 space-y-1 text-xs" style={{ color: theme.muted }}>
            {slide.curriculum_goal && <p>素养目标：{slide.curriculum_goal}</p>}
            {slide.student_task && <p>学生任务：{slide.student_task}</p>}
          </div>
        )}
        {slide.interaction && (
          <p className="mt-2 text-xs" style={{ color: theme.muted }}>
            {slide.interaction}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
