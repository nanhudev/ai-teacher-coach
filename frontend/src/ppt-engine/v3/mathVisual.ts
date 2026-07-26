import type { ChartSpec } from './types'

export type PlotPoint = { x: number; y: number }

function evalFn(expr: ChartSpec & { kind: 'function' }, x: number): number {
  switch (expr.expression) {
    case 'x2':
      return x * x
    case 'sin':
      return Math.sin(x)
    case 'exp':
      return Math.exp(x * 0.5) - 1
    default:
      return 0.6 * x
  }
}

/** math_visual_engine：生成可渲染路径 / 数据 */
export function sampleFunction(spec: ChartSpec & { kind: 'function' }, n = 60) {
  const x0 = spec.x_min ?? -2
  const x1 = spec.x_max ?? 2
  const pts: PlotPoint[] = []
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    pts.push({ x, y: evalFn(spec, x) })
  }
  return pts
}

export function toSvgPath(
  pts: PlotPoint[],
  w: number,
  h: number,
  pad = 24,
): { path: string; xOf: (x: number) => number; yOf: (y: number) => number; midY: number; midX: number } {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const xOf = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2)
  const yOf = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.x).toFixed(1)},${yOf(p.y).toFixed(1)}`).join(' ')
  return { path: d, xOf, yOf, midY: yOf(0), midX: xOf(0) }
}

export function tangentLine(
  spec: ChartSpec & { kind: 'function' },
  xOf: (x: number) => number,
  yOf: (y: number) => number,
) {
  const a = spec.tangent_at
  if (a == null) return null
  const y = evalFn(spec, a)
  const h = 0.01
  const slope = (evalFn(spec, a + h) - evalFn(spec, a - h)) / (2 * h)
  const x0 = a - 0.8
  const x1 = a + 0.8
  const y0 = y + slope * (x0 - a)
  const y1 = y + slope * (x1 - a)
  return {
    x1: xOf(x0),
    y1: yOf(y0),
    x2: xOf(x1),
    y2: yOf(y1),
    px: xOf(a),
    py: yOf(y),
    slope,
  }
}

export function chartSeries(spec: ChartSpec): { cats: string[]; vals: number[] } | null {
  if (spec.kind === 'bars') return { cats: spec.categories, vals: spec.values }
  return null
}
