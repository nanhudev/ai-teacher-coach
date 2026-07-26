import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

export function ComparisonSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-12 py-10">
        <h2
          className="font-semibold"
          style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}
        >
          {slide.title}
        </h2>
        {slide.key_message && (
          <p className="mt-2" style={{ color: theme.muted }}>
            {slide.key_message}
          </p>
        )}
        <div className="mt-8 grid flex-1 grid-cols-2 gap-6">
          <div
            className="rounded-3xl p-6"
            style={{ background: theme.panel, border: `1px solid ${theme.border}` }}
          >
            <p className="mb-4 text-xs tracking-wider" style={{ color: theme.accent }}>
              A
            </p>
            <ul className="space-y-3" style={{ fontSize: theme.bodySize }}>
              {(slide.left || []).slice(0, 3).map((x) => (
                <li key={x}>● {x}</li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-3xl p-6"
            style={{ background: theme.accentSoft, border: `1px solid ${theme.border}` }}
          >
            <p className="mb-4 text-xs tracking-wider" style={{ color: theme.accent }}>
              B
            </p>
            <ul className="space-y-3" style={{ fontSize: theme.bodySize }}>
              {(slide.right || []).slice(0, 3).map((x) => (
                <li key={x}>● {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideShell>
  )
}
