import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { BulletList, SlideShell } from './_shared'

/** 概念/字词页：少卡片，多留白 */
export function ConceptSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-14 py-10">
        <p className="text-xs tracking-widest" style={{ color: theme.accent }}>
          {slide.purpose || '知识讲解'}
        </p>
        <h2
          className="mt-3 font-semibold tracking-tight"
          style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}
        >
          {slide.title}
        </h2>
        {slide.key_message && (
          <p className="mt-6 text-xl" style={{ color: theme.muted }}>
            {slide.key_message}
          </p>
        )}
        <div className="mt-8 max-w-3xl flex-1">
          <BulletList items={slide.bullets || []} theme={theme} />
        </div>
        {slide.interaction && (
          <p className="mt-4 text-sm" style={{ color: theme.muted }}>
            {slide.interaction}
          </p>
        )}
        {slide.closing && (
          <p className="mt-2 text-sm" style={{ color: theme.accent }}>
            {slide.closing}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
