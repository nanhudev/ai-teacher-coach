import { useEffect, useMemo, useState } from 'react'
import { THEMES } from '../ppt/themes'
import { renderSlide } from '../ppt/slides'
import type { EngineSlide } from '../ppt/types'
import { runChineseTextAgent } from '../../chinese/textAgent'
import { buildChinesePpt } from '../../chinese/pptEngine'

/**
 * 首页 / Showcase 用的真实 React PPT 轮播
 * 默认生成《赤壁赋》公开课页，不展示任何技术词
 */
export function PptShowcase({
  topic = '高中语文 必修上 赤壁赋',
  className = '',
}: {
  topic?: string
  className?: string
}) {
  const slides = useMemo(() => {
    try {
      const brief = runChineseTextAgent(topic)
      if (!brief.matched) return fallbackSlides()
      return buildChinesePpt(brief).slides.slice(0, 6)
    } catch {
      return fallbackSlides()
    }
  }, [topic])

  const [idx, setIdx] = useState(0)
  const theme = THEMES.sage
  const slide = slides[idx] || slides[0]

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4200)
    return () => clearInterval(t)
  }, [slides.length])

  if (!slide) return null

  return (
    <div className={`min-w-0 max-w-full overflow-hidden ${className}`}>
      <div
        className="aspect-[16/9] overflow-hidden rounded-sm shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/10"
        style={{ background: theme.bg }}
      >
        {renderSlide(slide, theme)}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
          className="text-sm text-[#1e3a5f] underline-offset-4 hover:underline"
        >
          上一页
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 页`}
              onClick={() => setIdx(i)}
              className={`h-1.5 transition-all ${
                i === idx ? 'w-6 bg-[#1e3a5f]' : 'w-1.5 bg-[#1e3a5f]/35'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIdx((i) => (i + 1) % slides.length)}
          className="text-sm text-[#1e3a5f] underline-offset-4 hover:underline"
        >
          下一页
        </button>
      </div>
      <p className="mt-2 text-center text-xs tracking-wide text-[#64748b]">
        {idx + 1} / {slides.length} · {slide.title}
      </p>
    </div>
  )
}

function fallbackSlides(): EngineSlide[] {
  return [
    {
      id: 1,
      type: 'cover',
      component: 'CoverSlide',
      title: '赤壁赋',
      subtitle: '苏轼 · 宋',
      key_message: '生命困境中的精神突围',
      purpose: '情境导入',
    },
    {
      id: 2,
      type: 'quote',
      component: 'QuoteSlide',
      title: '读这一句',
      key_message: '且夫天地之间，物各有主，苟非吾之所有，虽一毫而莫取。',
      purpose: '文本细读',
      bullets: ['手法：议论', '效果：由个体困境走向天地观'],
    },
  ]
}
