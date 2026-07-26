import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { BulletList, SlideShell } from './_shared'

/** 原图文页：去掉图片，改为强调卡片式排版 */
export function ImageTextSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-12 py-10">
        <p className="text-xs" style={{ color: theme.accent }}>
          {slide.purpose || '重点讲解'}
        </p>
        <h2
          className="mt-2 font-semibold leading-tight"
          style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}
        >
          {slide.title}
        </h2>
        <div
          className="mt-8 flex-1 rounded-3xl p-8"
          style={{ background: theme.panel, border: `1px solid ${theme.border}` }}
        >
          {slide.key_message && (
            <p className="mb-6 text-xl font-medium">{slide.key_message}</p>
          )}
          <BulletList items={slide.bullets || []} theme={theme} />
          {slide.closing && (
            <p className="mt-8 text-sm" style={{ color: theme.muted }}>
              {slide.closing}
            </p>
          )}
        </div>
      </div>
    </SlideShell>
  )
}
