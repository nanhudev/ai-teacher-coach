import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { BulletList, SlideShell } from './_shared'

/** 课堂活动：任务清晰，少卡片装饰 */
export function ActivitySlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-14 py-10">
        <p className="text-xs tracking-widest" style={{ color: theme.accent }}>
          {slide.purpose || '课堂活动'}
        </p>
        <h2
          className="mt-3 font-semibold"
          style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}
        >
          {slide.title}
        </h2>
        {slide.key_message && (
          <p
            className="mt-8 max-w-3xl border-l-2 pl-5 text-xl leading-relaxed"
            style={{ borderColor: theme.accent, fontFamily: theme.fontDisplay }}
          >
            {slide.key_message}
          </p>
        )}
        <div className="mt-8 max-w-2xl">
          <BulletList items={slide.bullets || []} theme={theme} />
        </div>
        {slide.interaction && (
          <p className="mt-auto pt-8 text-sm" style={{ color: theme.muted }}>
            {slide.interaction}
          </p>
        )}
      </div>
    </SlideShell>
  )
}
