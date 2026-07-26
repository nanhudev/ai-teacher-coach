import PptxGenJS from 'pptxgenjs'
import type { PptDesign } from '../../components/ppt/types'
import { normalizeTemplateId } from '../../components/ppt/types'
import { sampleFunction } from './mathVisual'
import type { ChartSpec } from './types'

const THEME: Record<
  string,
  { bg: string; fg: string; muted: string; accent: string; panel: string; name: string }
> = {
  academic: { bg: 'FAFAF8', fg: '1F2937', muted: '64748B', accent: '0F766E', panel: 'FFFFFF', name: 'Academic' },
  classroom: { bg: 'FFF7ED', fg: '292524', muted: '78716C', accent: 'EA580C', panel: 'FFFFFF', name: 'Classroom' },
  showcase: { bg: '0B1220', fg: 'F8FAFC', muted: '94A3B8', accent: 'F59E0B', panel: '1A2740', name: 'Showcase' },
  gamma: { bg: 'F8FAFC', fg: '0F172A', muted: '64748B', accent: '0284C7', panel: 'FFFFFF', name: 'Gamma Soft' },
  noir: { bg: '0A0A0A', fg: 'FAFAFA', muted: 'A3A3A3', accent: '38BDF8', panel: '171717', name: 'Math Precision' },
  sage: { bg: 'F3EFE6', fg: '1C1917', muted: '78716C', accent: '9F1239', panel: 'FFFCF5', name: '宣纸文学' },
  coral: { bg: 'F7FAF8', fg: '1F2937', muted: '64748B', accent: '3F6F5C', panel: 'FFFFFF', name: '文学杂志' },
  doubao_story: { bg: '10251E', fg: 'FFF8E8', muted: 'D5C9AD', accent: 'D5AE6E', panel: '183329', name: '豆包·沉浸叙事' },
  gamma_narrative: { bg: 'F8F5EF', fg: '17251F', muted: '647067', accent: '426B62', panel: 'FFFFFF', name: 'Gamma·杂志讲述' },
  seminar_studio: { bg: '0C1C2E', fg: 'F2FAF7', muted: 'A6C5C0', accent: '4DC2B6', panel: '173A4A', name: '研讨·课堂工作室' },
}

function hex(c: string) {
  return c.startsWith('#') ? c.slice(1) : c
}

/** 浏览器端 PPTX 导出（静态站可用） */
export async function exportPptxClient(ppt: PptDesign, filename = 'lesson.pptx') {
  const tid = normalizeTemplateId(String(ppt.template_id))
  const theme = THEME[tid] || THEME.gamma
  const prs = new PptxGenJS()
  prs.defineLayout({ name: 'LAYOUT_16x9', width: 13.333, height: 7.5 })
  prs.layout = 'LAYOUT_16x9'
  prs.author = '高中语文 AI 教研助手'
  prs.title = ppt.title || '课件'

  for (const raw of ppt.slides || []) {
    const s = prs.addSlide()
    s.background = { color: hex(theme.bg) }
    const stype = raw.type || 'concept'
    const title = raw.title || ''
    const key = raw.key_message || ''
    const bullets = (raw.bullets || []).slice(0, 5)

    if (stype === 'cover' || stype === 'opening') {
      s.addText(title, {
        x: 1.1,
        y: 2.1,
        w: 11,
        h: 1.4,
        fontSize: 40,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      if (raw.subtitle) {
        s.addText(String(raw.subtitle), {
          x: 1.1,
          y: 3.7,
          w: 11,
          h: 0.5,
          fontSize: 16,
          color: hex(theme.muted),
          fontFace: 'Microsoft YaHei',
        })
      }
      if (key) {
        s.addText(key, {
          x: 1.1,
          y: 4.6,
          w: 10,
          h: 0.6,
          fontSize: 18,
          color: hex(theme.accent),
          fontFace: 'Microsoft YaHei',
        })
      }
    } else if (stype === 'comparison') {
      s.addText(title, {
        x: 0.8,
        y: 0.5,
        w: 11.5,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      s.addShape(prs.ShapeType.roundRect, {
        x: 0.8,
        y: 1.5,
        w: 5.5,
        h: 4.5,
        fill: { color: hex(theme.panel) },
      })
      s.addShape(prs.ShapeType.roundRect, {
        x: 7,
        y: 1.5,
        w: 5.5,
        h: 4.5,
        fill: { color: hex(theme.panel) },
      })
      s.addText((raw.left || []).map((t) => `• ${t}`).join('\n'), {
        x: 1.1,
        y: 1.9,
        w: 5,
        h: 3.8,
        fontSize: 18,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      s.addText((raw.right || []).map((t) => `• ${t}`).join('\n'), {
        x: 7.3,
        y: 1.9,
        w: 5,
        h: 3.8,
        fontSize: 18,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
    } else if (stype === 'chart' || raw.chart) {
      s.addText(title, {
        x: 0.8,
        y: 0.4,
        w: 11.5,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      if (key) {
        s.addText(key, {
          x: 0.8,
          y: 1.05,
          w: 11.5,
          h: 0.4,
          fontSize: 14,
          color: hex(theme.muted),
          fontFace: 'Microsoft YaHei',
        })
      }
      addChart(prs, s, raw.chart as ChartSpec | undefined, theme)
      if (bullets.length) {
        s.addText(bullets.map((t) => `• ${t}`).join('\n'), {
          x: 8.6,
          y: 2.2,
          w: 4,
          h: 3.5,
          fontSize: 16,
          color: hex(theme.fg),
          fontFace: 'Microsoft YaHei',
        })
      }
    } else if (stype === 'quote' || stype === 'text_analysis') {
      s.addText(raw.purpose || '文本细读', {
        x: 0.9,
        y: 0.45,
        w: 11,
        h: 0.35,
        fontSize: 12,
        color: hex(theme.accent),
        fontFace: 'Microsoft YaHei',
      })
      s.addText(title, {
        x: 0.9,
        y: 0.85,
        w: 11,
        h: 0.55,
        fontSize: 24,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      s.addShape(prs.ShapeType.rect, {
        x: 0.9,
        y: 1.7,
        w: 0.06,
        h: 2.6,
        fill: { color: hex(theme.accent) },
      })
      if (key) {
        s.addText(key, {
          x: 1.2,
          y: 1.7,
          w: 10.8,
          h: 2.0,
          fontSize: 22,
          color: hex(theme.fg),
          fontFace: 'Microsoft YaHei',
        })
      }
      const qBullets = [
        ...(raw.bullets || []),
        ...(raw.steps || []).map((st) => `${st.label}${st.detail ? `：${st.detail}` : ''}`),
      ].slice(0, 6)
      if (qBullets.length) {
        s.addText(qBullets.map((t) => `— ${t}`).join('\n'), {
          x: 1.2,
          y: 4.0,
          w: 10.8,
          h: 2.2,
          fontSize: 14,
          color: hex(theme.muted),
          fontFace: 'Microsoft YaHei',
        })
      }
    } else if (stype === 'timeline' && raw.steps?.length) {
      s.addText(title, {
        x: 0.8,
        y: 0.5,
        w: 11.5,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      const steps = raw.steps.slice(0, 4)
      steps.forEach((st, i) => {
        const x = 1 + i * 3
        s.addShape(prs.ShapeType.ellipse, {
          x,
          y: 3.2,
          w: 0.35,
          h: 0.35,
          fill: { color: hex(theme.accent) },
        })
        s.addText(st.label, {
          x: x - 0.4,
          y: 3.8,
          w: 2.2,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: hex(theme.fg),
          fontFace: 'Microsoft YaHei',
        })
        if (st.detail) {
          s.addText(st.detail, {
            x: x - 0.4,
            y: 4.3,
            w: 2.2,
            h: 0.5,
            fontSize: 13,
            color: hex(theme.muted),
            fontFace: 'Microsoft YaHei',
          })
        }
      })
    } else {
      s.addText(title, {
        x: 0.8,
        y: 0.55,
        w: 11.5,
        h: 0.7,
        fontSize: 30,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      if (key) {
        s.addText(key, {
          x: 0.8,
          y: 1.4,
          w: 11.5,
          h: 0.45,
          fontSize: 16,
          color: hex(theme.muted),
          fontFace: 'Microsoft YaHei',
        })
      }
      if (raw.steps?.length) {
        s.addText(
          raw.steps
            .map((st, i) => `${i + 1}. ${st.label}${st.detail ? ` — ${st.detail}` : ''}`)
            .join('\n'),
          {
            x: 0.8,
            y: 2.2,
            w: 11.5,
            h: 3.5,
            fontSize: 18,
            color: hex(theme.fg),
            fontFace: 'Microsoft YaHei',
          },
        )
      } else if (bullets.length) {
        s.addText(bullets.map((t) => `• ${t}`).join('\n'), {
          x: 0.8,
          y: 2.2,
          w: 11.5,
          h: 3.5,
          fontSize: 20,
          color: hex(theme.fg),
          fontFace: 'Microsoft YaHei',
        })
      }
      if (raw.interaction) {
        s.addText(`互动：${raw.interaction}`, {
          x: 0.8,
          y: 6.3,
          w: 11,
          h: 0.35,
          fontSize: 12,
          color: hex(theme.accent),
          fontFace: 'Microsoft YaHei',
        })
      }
      if (raw.closing && stype === 'homework') {
        s.addText(raw.closing, {
          x: 0.8,
          y: 5.8,
          w: 11,
          h: 0.35,
          fontSize: 13,
          color: hex(theme.accent),
          fontFace: 'Microsoft YaHei',
        })
      }
    }

    s.addText(`${theme.name} · 高中语文公开课`, {
      x: 0.6,
      y: 7.05,
      w: 10,
      h: 0.25,
      fontSize: 10,
      color: hex(theme.muted),
      fontFace: 'Microsoft YaHei',
    })
  }

  await prs.writeFile({ fileName: filename.endsWith('.pptx') ? filename : `${filename}.pptx` })
}

function addChart(
  prs: PptxGenJS,
  s: PptxGenJS.Slide,
  chart: ChartSpec | undefined,
  theme: { accent: string; fg: string },
) {
  if (!chart) return
  try {
    if (chart.kind === 'bars') {
      s.addChart(
        prs.ChartType.bar,
        [{ name: chart.label, labels: chart.categories, values: chart.values }],
        {
          x: 0.8,
          y: 1.7,
          w: 7.2,
          h: 4.5,
          showTitle: false,
          showValue: true,
          chartColors: [hex(theme.accent)],
        },
      )
      return
    }
    if (chart.kind === 'fraction_pie') {
      const filled = chart.numerator
      const empty = Math.max(0.001, chart.denominator - chart.numerator)
      s.addChart(
        prs.ChartType.pie,
        [{ name: chart.label, labels: ['已表示', '其余'], values: [filled, empty] }],
        {
          x: 1.5,
          y: 1.7,
          w: 5.5,
          h: 4.5,
          showPercent: false,
          showLegend: true,
          chartColors: [hex(theme.accent), 'E5E7EB'],
        },
      )
      s.addText(chart.label, {
        x: 7.5,
        y: 3.2,
        w: 4,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: hex(theme.fg),
        fontFace: 'Microsoft YaHei',
      })
      return
    }
    if (chart.kind === 'function') {
      const pts = sampleFunction(chart, 24)
      s.addChart(
        prs.ChartType.line,
        [
          {
            name: chart.label,
            labels: pts.map((p) => p.x.toFixed(1)),
            values: pts.map((p) => Number(p.y.toFixed(3))),
          },
        ],
        {
          x: 0.8,
          y: 1.7,
          w: 7.2,
          h: 4.5,
          showLegend: false,
          chartColors: [hex(theme.accent)],
        },
      )
    }
  } catch {
    s.addText(chart.kind === 'function' ? chart.label : '图表', {
      x: 1,
      y: 3,
      w: 10,
      h: 1,
      fontSize: 18,
      color: hex(theme.fg),
      fontFace: 'Microsoft YaHei',
    })
  }
}
