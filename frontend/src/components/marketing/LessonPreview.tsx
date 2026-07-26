import type { ReactNode } from 'react'

/** 首页教案关键片段预览 — 不堆全文 */
export function LessonPreview({
  title = '赤壁赋',
  className = '',
}: {
  title?: string
  className?: string
}) {
  return (
    <article
      className={`border border-[#1e3a5f]/12 bg-[#FFFCFA] px-6 py-7 text-[#1a1a1a] shadow-[0_16px_40px_rgba(15,23,42,0.06)] ${className}`}
    >
      <p className="text-xs tracking-[0.2em] text-[#1e3a5f]">精品教案节选</p>
      <h3 className="font-display mt-2 text-2xl">高中语文 · 《{title}》</h3>

      <div className="mt-6 space-y-5 text-sm leading-relaxed">
        <Block label="教材分析">
          选自必修上册；学习任务群「中华传统文化经典研习」。景—情—理推进，落实文言与文化精神。
        </Block>
        <Block label="核心素养目标">
          <ul className="list-disc space-y-1 pl-4">
            <li>语言建构与运用：落实关键实词、虚词与句意</li>
            <li>思维发展与提升：用原文证据说明精神转折</li>
            <li>审美鉴赏与创造：品味写景与议论交融</li>
            <li>文化传承与理解：理解旷达背后的文化选择</li>
          </ul>
        </Block>
        <Block label="教学重点">理解苏轼由乐转悲再转旷达的精神世界</Block>
        <Block label="课堂任务">圈画「乐 / 悲 / 喜」变化处，各组用一句原文证明转折</Block>
        <Block label="板书设计">
          《{title}》｜乐 → 悲 → 喜（旷达）
          <br />
          核心问题：人如何安顿生命困境？
        </Block>
      </div>
    </article>
  )
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[#1e3a5f]">{label}</p>
      <div className="mt-1.5 text-[#334155]">{children}</div>
    </div>
  )
}
