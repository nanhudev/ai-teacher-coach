import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

/**
 * 原文细读页：大引文 + 旁注，禁止商业卡片堆砌
 */
export function QuoteSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-14 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs tracking-widest" style={{ color: theme.accent }}>
            {slide.purpose || '文本细读'}
          </p>
          {slide.source_reference && (
            <p className="text-[11px]" style={{ color: theme.muted }}>
              {slide.source_reference}
            </p>
          )}
        </div>
        <h2
          className="mt-3 font-semibold"
          style={{ fontFamily: theme.fontDisplay, fontSize: 'clamp(1.4rem, 2.4vw, 2rem)' }}
        >
          {slide.title}
        </h2>

        <blockquote
          className="mt-8 flex-1 border-l-2 pl-6"
          style={{ borderColor: theme.accent }}
        >
          <p
            className="text-[clamp(1.15rem,2vw,1.55rem)] leading-relaxed"
            style={{ fontFamily: theme.fontDisplay }}
          >
            {slide.key_message}
          </p>
        </blockquote>

        {!!slide.bullets?.length && (
          <ul className="mt-6 space-y-2 text-sm" style={{ color: theme.muted }}>
            {slide.bullets.slice(0, 4).map((b) => (
              <li key={b} className="flex gap-2">
                <span style={{ color: theme.accent }}>—</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {slide.closing && (
          <p className="mt-6 text-sm" style={{ color: theme.accent }}>
            {slide.closing}
          </p>
        )}
        {slide.interaction && (
          <p className="mt-3 text-xs" style={{ color: theme.muted }}>
            {slide.interaction}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
