import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

export function TimelineSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const steps =
    slide.steps?.length
      ? slide.steps
      : (slide.bullets || []).map((b, i) => ({ label: `${i + 1}`, detail: b }))

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-12 py-10">
        <h2
          className="font-semibold"
          style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}
        >
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="mt-2" style={{ color: theme.muted }}>
            {slide.subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-1 items-center gap-3">
          {steps.slice(0, 5).map((s, i) => (
            <div key={i} className="flex flex-1 flex-col items-center text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: theme.accent }}
              >
                {s.label || i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="absolute hidden" />
              )}
              <p className="mt-4 text-sm leading-snug">{s.detail || s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}
