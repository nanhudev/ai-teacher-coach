import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

/**
 * 公开课核心页：大问题 → 原文居中 → 三词卡片 → 教师点拨
 * 禁止变成 bullet 备课笔记
 */
export function QuoteAnalysisSlide({
  slide,
  theme,
}: {
  slide: EngineSlide
  theme: ThemeTokens
}) {
  const cards =
    slide.analysis_cards?.length
      ? slide.analysis_cards
      : (slide.steps || []).map((s) => ({ word: s.label, effect: s.detail || '' }))

  const quote = slide.text_excerpt || slide.text_evidence || slide.key_message || ''

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-10 py-8 lg:px-14">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] tracking-[0.22em]" style={{ color: theme.accent }}>
            {slide.purpose || '文本细读'}
          </p>
          {slide.source_reference && (
            <p className="text-[11px]" style={{ color: theme.muted }}>
              {slide.source_reference}
            </p>
          )}
        </div>

        {(slide.main_question || slide.title) && (
          <h2
            className="mt-4 max-w-4xl font-semibold leading-snug"
            style={{
              fontFamily: theme.fontDisplay,
              fontSize: 'clamp(1.55rem, 2.8vw, 2.15rem)',
            }}
          >
            {slide.main_question || slide.title}
          </h2>
        )}

        {slide.main_question && slide.title && slide.title !== slide.main_question && (
          <p className="mt-2 text-sm" style={{ color: theme.muted }}>
            {slide.title}
          </p>
        )}

        <blockquote className="mt-8 flex flex-1 flex-col justify-center">
          <p
            className="mx-auto max-w-3xl text-center leading-relaxed tracking-wide"
            style={{
              fontFamily: theme.fontDisplay,
              fontSize: 'clamp(1.35rem, 2.6vw, 1.95rem)',
            }}
          >
            「{quote}」
          </p>
        </blockquote>

        {!!cards.length && (
          <div className="mt-2 grid grid-cols-3 gap-4">
            {cards.slice(0, 3).map((c) => (
              <div
                key={c.word}
                className="border-t-2 pt-3 text-center"
                style={{ borderColor: theme.accent }}
              >
                <p
                  className="text-2xl font-semibold tracking-wider"
                  style={{ fontFamily: theme.fontDisplay, color: theme.accent }}
                >
                  {c.word}
                </p>
                <p className="mt-2 text-xs leading-snug" style={{ color: theme.muted }}>
                  ↓
                </p>
                <p className="mt-1 text-sm" style={{ color: theme.fg }}>
                  {c.effect}
                </p>
              </div>
            ))}
          </div>
        )}

        <div
          className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t pt-4 text-sm"
          style={{ borderColor: theme.border }}
        >
          <p style={{ color: theme.accent }}>
            {slide.teacher_guidance || slide.analysis || slide.closing || '教师：从关键词进入语境，再回到篇章主旨'}
          </p>
          {slide.student_task && (
            <p style={{ color: theme.muted }}>学生：{slide.student_task}</p>
          )}
        </div>
      </div>
    </SlideShell>
  )
}
