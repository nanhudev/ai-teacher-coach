import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

export function HomeworkSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const tiers =
    slide.steps?.length
      ? slide.steps
      : (slide.bullets || []).map((b, i) => ({
          label: ['基础', '提升', '拓展'][i] || `${i + 1}`,
          detail: b,
        }))

  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col justify-center px-12 py-10">
        <p className="text-[11px] tracking-[0.22em]" style={{ color: theme.accent }}>
          分层作业
        </p>
        <h2
          className="mt-3 font-semibold"
          style={{ fontFamily: theme.fontDisplay, fontSize: 'clamp(1.4rem, 2.4vw, 1.9rem)' }}
        >
          {slide.main_question || slide.title}
        </h2>
        <div className="mt-8 grid gap-5">
          {tiers.slice(0, 3).map((t) => (
            <div key={t.label} className="border-l-2 pl-5" style={{ borderColor: theme.accent }}>
              <p className="text-sm font-semibold tracking-wider" style={{ color: theme.accent }}>
                {t.label}
              </p>
              <p className="mt-1 text-base" style={{ color: theme.fg }}>
                {t.detail}
              </p>
            </div>
          ))}
        </div>
        {(slide.teacher_guidance || slide.closing) && (
          <p className="mt-8 text-sm" style={{ color: theme.muted }}>
            {slide.teacher_guidance || slide.closing}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
