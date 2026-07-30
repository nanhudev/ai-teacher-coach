import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'

export function CoverSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const isInk = theme.archetype === 'ink'
  const isIllustrated = theme.archetype === 'illustrated'
  return (
    <SlideShell theme={theme}>
      <div className={`flex h-full flex-col justify-center px-16 py-12 ${isInk ? 'items-center text-center' : ''}`}>
        <p className="text-xs tracking-[0.28em]" style={{ color: theme.muted }}>
          高中语文 · 公开课
        </p>
        <h1
          className={`mt-6 max-w-3xl leading-tight ${isInk ? 'font-medium tracking-[0.12em]' : 'font-semibold'}`}
          style={{ fontFamily: theme.fontDisplay, fontSize: isInk ? 'clamp(2.3rem,5vw,4.4rem)' : theme.titleSize }}
        >
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className={`mt-5 max-w-xl text-lg ${isIllustrated ? 'border-b-2 border-dashed pb-3' : ''}`} style={{ color: theme.muted, borderColor: theme.border }}>
            {slide.subtitle}
          </p>
        )}
        {slide.key_message && (
          <p
            className={`${isInk ? 'mt-9 border-y px-8 py-3' : 'mt-10 border-l-2 pl-5'} max-w-xl text-base`}
            style={{ borderColor: theme.accent }}
          >
            {slide.key_message}
          </p>
        )}
        {slide.closing && (
          <p className="mt-auto pt-10 text-sm" style={{ color: theme.accent }}>
            {slide.closing}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
