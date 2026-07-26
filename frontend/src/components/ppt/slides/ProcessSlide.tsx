import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

export function ProcessSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const steps = slide.steps?.length
    ? slide.steps
    : (slide.bullets || []).map((b, i) => ({ label: String(i + 1), detail: b }))

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-12 py-10">
        <h2
          className="font-semibold"
          style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}
        >
          {slide.title}
        </h2>
        <div className="mt-10 space-y-4">
          {steps.slice(0, 4).map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold"
                style={{
                  background: theme.accentSoft,
                  color: theme.accent,
                  borderRadius: theme.radius,
                  fontFamily: theme.fontDisplay,
                }}
              >
                {s.label.length <= 2 ? s.label : i + 1}
              </div>
              <div className="flex-1 border-b pb-3" style={{ borderColor: theme.border }}>
                <p style={{ fontSize: theme.bodySize, fontFamily: theme.fontDisplay }}>
                  {s.detail || s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}
