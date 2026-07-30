import { useEffect, useMemo, useState } from 'react'
import type { EngineSlide, PptDesign, PptTemplateId } from './types'
import { CHINESE_TEMPLATE_IDS, TEMPLATE_META, normalizeTemplateId } from './types'
import { THEMES } from './themes'
import { renderSlide } from './slides'
import { slideTypeLabel } from '../../chinese/displayLabels'
import { TEMPLATE_PROFILES } from './templateProfiles'

type Props = {
  ppt: PptDesign
  onTemplateChange?: (id: PptTemplateId) => void
  onDownload?: () => void
  downloading?: boolean
}

export function PptStudio({ ppt, onTemplateChange, onDownload, downloading }: Props) {
  const [idx, setIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const templateId = normalizeTemplateId(ppt.template_id)
  const theme = THEMES[templateId]
  const slides = (ppt.slides || []) as EngineSlide[]
  const slide = slides[idx]
  const score = ppt.design_score
  const thumbTheme = useMemo(() => theme, [theme])
  const profile = TEMPLATE_PROFILES[templateId]

  useEffect(() => {
    setAnimKey((k) => k + 1)
  }, [idx, templateId])

  if (!slide) {
    return <p className="text-sm text-ink-muted">暂无课件页</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_240px]">
      <aside className="max-h-[72vh] space-y-2 overflow-auto pr-1">
        {slides.map((s, i) => (
          <button
            key={s.id || i}
            type="button"
            onClick={() => setIdx(i)}
            className={`group w-full rounded-2xl p-2 text-left transition ${
              i === idx
                ? 'bg-white shadow-md ring-2 ring-sky-400/60'
                : 'bg-white/60 ring-1 ring-black/5 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div
              className="flex aspect-video items-end rounded-xl p-2 transition group-hover:brightness-[1.02]"
              style={{ background: thumbTheme.bg, color: thumbTheme.fg }}
            >
              <span className="line-clamp-2 text-[10px] font-semibold leading-tight opacity-90">
                {s.title}
              </span>
            </div>
            <p className="mt-1.5 truncate px-0.5 text-[11px] text-slate-500">
              {i + 1} · {slideTypeLabel(s.type)}
            </p>
          </button>
        ))}
      </aside>

      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-600">
              公开课预览 · {TEMPLATE_META[templateId].name}
            </p>
            <h2 className="mt-1 font-display text-2xl text-slate-900">
              {ppt.title || '课件预览'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {slides.length} 页
              {ppt.total_minutes ? ` · ${ppt.total_minutes}min` : ''} · {TEMPLATE_META[templateId].vibe}
            </p>
            {profile && <p className="mt-2 max-w-2xl text-xs text-slate-600">{profile.promise}</p>}
          </div>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:opacity-60"
            >
              {downloading ? '导出中…' : '下载 PPTX'}
            </button>
          )}
        </div>

        <div
          key={animKey}
          className="aspect-[16/9] overflow-hidden rounded-[1.5rem] ring-1 ring-black/5 animate-[fadeUp_.35s_ease]"
          style={{ boxShadow: '0 30px 80px rgba(15,23,42,0.12)' }}
        >
          {renderSlide(slide, theme)}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => setIdx((x) => x - 1)}
            className="rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-black/5 disabled:opacity-40"
          >
            ← 上一页
          </button>
          <div className="flex max-w-[55%] flex-wrap justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-sky-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={idx >= slides.length - 1}
            onClick={() => setIdx((x) => x + 1)}
            className="rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-black/5 disabled:opacity-40"
          >
            下一页 →
          </button>
        </div>
      </section>

      <aside className="space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-medium text-slate-500">语文母版（{CHINESE_TEMPLATE_IDS.length}）</p>
          <div className="mt-3 max-h-[42vh] space-y-2 overflow-auto pr-1">
            {CHINESE_TEMPLATE_IDS.map((id) => {
              const meta = TEMPLATE_META[id]
              const active = templateId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTemplateChange?.(id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                    active ? 'bg-sky-50 ring-2 ring-sky-400/50' : 'hover:bg-slate-50 ring-1 ring-transparent'
                  }`}
                >
                  <span
                    className="h-10 w-10 shrink-0 rounded-lg shadow-inner"
                    style={{ background: meta.swatch }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {meta.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{meta.vibe}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {score && (
          <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
            <p className="text-xs text-white/60">课件评分</p>
            <p className="mt-1 font-display text-4xl tracking-tight">{score.total}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/75">
              <p>视觉 {score.visual}</p>
              <p>逻辑 {score.pedagogy}</p>
              <p>密度 {score.density}</p>
              <p>互动 {score.interaction}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <p className="text-xs text-slate-500">本页</p>
          <p className="mt-1 font-semibold text-slate-800">{slide.title}</p>
          <p className="mt-1 text-xs text-slate-500">{slideTypeLabel(slide.type)}</p>
          {slide.purpose && <p className="mt-2 text-xs text-slate-600">环节：{slide.purpose}</p>}
          {slide.source_reference && (
            <p className="mt-1 text-xs text-stone-500">出处：{slide.source_reference}</p>
          )}
          {slide.interaction && (
            <p className="mt-2 rounded-lg bg-sky-50 px-2 py-1.5 text-xs text-sky-800">
              互动：{slide.interaction}
            </p>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px) scale(0.995); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}
