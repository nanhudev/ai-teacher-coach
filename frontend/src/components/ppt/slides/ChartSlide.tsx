import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { SlideShell } from './_shared'
import { sampleFunction, toSvgPath, tangentLine } from '../../../ppt-engine/v3/mathVisual'
import type { ChartSpec } from '../../../ppt-engine/v3/types'

function FunctionChart({ spec, accent, muted }: { spec: ChartSpec & { kind: 'function' }; accent: string; muted: string }) {
  const w = 640
  const h = 360
  const pts = sampleFunction(spec)
  const { path, xOf, yOf, midY, midX } = toSvgPath(pts, w, h)
  const tan = tangentLine(spec, xOf, yOf)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <line x1={24} y1={midY} x2={w - 24} y2={midY} stroke={muted} strokeWidth={1} opacity={0.5} />
      <line x1={midX} y1={24} x2={midX} y2={h - 24} stroke={muted} strokeWidth={1} opacity={0.5} />
      <path d={path} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" />
      {tan && (
        <>
          <line x1={tan.x1} y1={tan.y1} x2={tan.x2} y2={tan.y2} stroke="#FBBF24" strokeWidth={2.5} />
          <circle cx={tan.px} cy={tan.py} r={5} fill="#FBBF24" />
        </>
      )}
      <text x={w - 28} y={midY - 8} fill={muted} fontSize={12} textAnchor="end">
        x
      </text>
      <text x={midX + 8} y={28} fill={muted} fontSize={12}>
        y
      </text>
    </svg>
  )
}

function BarsChart({ spec, accent }: { spec: ChartSpec & { kind: 'bars' }; accent: string }) {
  const max = Math.max(...spec.values, 1)
  return (
    <div className="flex h-full items-end gap-4 px-4 pb-2 pt-6">
      {spec.values.map((v, i) => (
        <div key={spec.categories[i]} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full max-w-[72px] rounded-t-xl"
            style={{ height: `${(v / max) * 75}%`, background: accent, minHeight: 12 }}
          />
          <span className="text-xs opacity-70">{spec.categories[i]}</span>
        </div>
      ))}
    </div>
  )
}

function FractionPie({ spec, accent }: { spec: ChartSpec & { kind: 'fraction_pie' }; accent: string }) {
  const { numerator, denominator } = spec
  const slices = Array.from({ length: denominator }, (_, i) => i < numerator)
  const r = 70
  const cx = 100
  const cy = 100
  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-full max-h-[280px] w-auto">
      {slices.map((on, i) => {
        const a0 = (i / denominator) * Math.PI * 2 - Math.PI / 2
        const a1 = ((i + 1) / denominator) * Math.PI * 2 - Math.PI / 2
        const x0 = cx + r * Math.cos(a0)
        const y0 = cy + r * Math.sin(a0)
        const x1 = cx + r * Math.cos(a1)
        const y1 = cy + r * Math.sin(a1)
        const large = denominator === 1 ? 1 : 0
        const d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
        return <path key={i} d={d} fill={on ? accent : 'rgba(148,163,184,0.25)'} stroke="#fff" strokeWidth={2} />
      })}
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={22} fontWeight={700} fill="#0f172a">
        {numerator}/{denominator}
      </text>
    </svg>
  )
}

export function ChartSlide({ slide, theme }: { slide: EngineSlide; theme: ThemeTokens }) {
  const chart = slide.chart
  return (
    <SlideShell theme={theme}>
      <div className="flex h-full flex-col px-10 py-8">
        <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>
          {slide.purpose || '视觉表征'}
        </p>
        <h2 className="mt-2 font-semibold" style={{ fontFamily: theme.fontDisplay, fontSize: theme.titleSize }}>
          {slide.title}
        </h2>
        {slide.key_message && (
          <p className="mt-2 text-base" style={{ color: theme.muted }}>
            {slide.key_message}
          </p>
        )}
        <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div
            className="overflow-hidden rounded-[1.5rem] p-3"
            style={{ background: theme.panel, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}
          >
            {chart?.kind === 'function' && (
              <FunctionChart spec={chart} accent={theme.accent} muted={theme.muted} />
            )}
            {chart?.kind === 'bars' && <BarsChart spec={chart} accent={theme.accent} />}
            {chart?.kind === 'fraction_pie' && <FractionPie spec={chart} accent={theme.accent} />}
            {!chart && (
              <p className="flex h-full items-center justify-center text-sm" style={{ color: theme.muted }}>
                （待生成图表）
              </p>
            )}
          </div>
          <div className="flex flex-col justify-center gap-3">
            {(slide.bullets || []).slice(0, 3).map((b) => (
              <div
                key={b}
                className="rounded-2xl px-4 py-3 text-sm"
                style={{ background: theme.accentSoft, color: theme.fg }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  )
}
