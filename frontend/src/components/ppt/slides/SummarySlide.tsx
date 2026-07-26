import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

export function SummarySlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const takeaways =
    slide.steps?.length
      ? slide.steps
      : (slide.bullets || []).map((b, i) => ({
          label: `${i + 1}`,
          detail: b,
        }))

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col justify-center px-14 py-12">
        <p className="text-[11px] tracking-[0.22em]" style={{ color: theme.accent }}>
          本课带走
        </p>
        <h2
          className="mt-4 max-w-3xl font-semibold leading-snug"
          style={{
            fontFamily: theme.fontDisplay,
            fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
          }}
        >
          {slide.main_question || slide.key_message || slide.title}
        </h2>
        <div className="mt-10 flex flex-wrap gap-8">
          {takeaways.slice(0, 3).map((t) => (
            <div key={t.label} className="min-w-[7rem]">
              <p
                className="text-xl font-semibold tracking-wider"
                style={{ fontFamily: theme.fontDisplay, color: theme.accent }}
              >
                {t.label}
              </p>
              <p className="mt-2 text-sm" style={{ color: theme.muted }}>
                {t.detail}
              </p>
            </div>
          ))}
        </div>
        {(slide.teacher_guidance || slide.closing) && (
          <p className="mt-10 text-sm" style={{ color: theme.accent }}>
            {slide.teacher_guidance || slide.closing}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
