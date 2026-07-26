import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

/**
 * 情境页：大气氛围词 + 一句心境，不是百科 bullet
 */
export function ImageSceneSlide({
  slide,
  theme,
}: {
  slide: EngineSlide
  theme: ThemeTokens
}) {
  const tags =
    slide.analysis_cards?.map((c) => c.word) ||
    slide.steps?.map((s) => s.label) ||
    slide.bullets ||
    []

  return (
    <SlideShell theme={theme}>
      <div className="relative flex h-full flex-col px-12 py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            background: `radial-gradient(800px 420px at 80% 20%, ${theme.accent}, transparent)`,
          }}
        />
        <p className="relative text-[11px] tracking-[0.22em]" style={{ color: theme.accent }}>
          {slide.purpose || '情境导入'}
        </p>
        <h2
          className="relative mt-5 max-w-3xl font-semibold leading-snug"
          style={{
            fontFamily: theme.fontDisplay,
            fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
          }}
        >
          {slide.main_question || slide.title}
        </h2>

        <div className="relative mt-10 flex flex-wrap gap-3">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="border px-4 py-2 text-sm tracking-widest"
              style={{ borderColor: theme.border, color: theme.fg }}
            >
              {tag}
            </span>
          ))}
        </div>

        {(slide.key_message || slide.text_evidence) && (
          <p
            className="relative mt-auto max-w-2xl border-l-2 pl-5 text-lg leading-relaxed"
            style={{ borderColor: theme.accent, fontFamily: theme.fontDisplay }}
          >
            {slide.key_message || slide.text_evidence}
          </p>
        )}

        <div className="relative mt-6 flex justify-between gap-3 text-xs" style={{ color: theme.muted }}>
          <span>{slide.teacher_guidance || slide.closing}</span>
          {slide.visual_prompt && <span>视觉：{slide.visual_prompt}</span>}
        </div>
      </div>
    </SlideShell>
  )
}
