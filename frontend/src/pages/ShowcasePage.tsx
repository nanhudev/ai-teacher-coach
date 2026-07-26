import { Link } from 'react-router-dom'
import { PptShowcase } from '../components/marketing/PptShowcase'
import { LessonPreview } from '../components/marketing/LessonPreview'

const FLOW = [
  { t: '输入', d: '高中语文 · 《赤壁赋》' },
  { t: 'AI 分析', d: '教材定位 · 核心素养 · 新高考考点' },
  { t: '教案', d: '目标 · 过程 · 任务 · 板书' },
  { t: 'PPT', d: '可上课的精品课件' },
  { t: '模拟课堂', d: '三位学生 · 即时评价' },
  { t: '评价', d: '课堂质量与改进建议' },
]

/** 教授交流用完整案例叙事页 */
export function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-display text-lg text-[#1e3a5f]">
          AI Teacher Coach
        </Link>
        <Link
          to="/demo?topic=赤壁赋"
          className="border border-[#1e3a5f] px-3 py-1.5 text-sm text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
        >
          亲自体验
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">
        <p className="text-xs tracking-[0.22em] text-[#1e3a5f]">教授展示模式</p>
        <h1 className="font-display mt-3 text-[clamp(2rem,5vw,3rem)] leading-tight text-[#1e3a5f]">
          完整案例：《赤壁赋》
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#64748b]">
          从一篇课文输入，到教案、精品课件、虚拟课堂与评价报告——演示 AI
          如何协助高中语文教师完成高质量备课与课前训练。
        </p>

        <ol className="mt-12 flex flex-wrap gap-3">
          {FLOW.map((s, i) => (
            <li
              key={s.t}
              className="flex min-w-[9rem] flex-1 items-start gap-2 border border-[#1e3a5f]/12 bg-white px-4 py-3"
            >
              <span className="text-xs text-[#94a3b8]">{i + 1}</span>
              <div>
                <p className="text-sm font-medium">{s.t}</p>
                <p className="mt-1 text-xs text-[#64748b]">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16">
          <h2 className="font-display text-2xl">教案节选</h2>
          <div className="mt-6">
            <LessonPreview title="赤壁赋" />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl">精品课件预览</h2>
          <p className="mt-2 text-sm text-[#64748b]">左右切换，查看公开课级幻灯片结构。</p>
          <div className="mt-6">
            <PptShowcase topic="高中语文 必修上 赤壁赋" />
          </div>
        </section>

        <section className="mt-16 border border-[#1e3a5f]/12 bg-white px-6 py-8">
          <h2 className="font-display text-2xl">课堂模拟片段</h2>
          <p className="mt-2 text-sm text-[#64748b]">老师回答后，系统分析是否紧扣文本证据与核心素养。</p>
          <div className="mt-6 space-y-4 text-sm">
            <p>
              <span className="text-[#1e3a5f]">小林 · 基础型</span>
              <br />
              「解释为什么苏轼选择赤壁夜游？」
            </p>
            <p className="text-[#64748b]">
              期望回应：联系被贬黄州的处境与「乐—悲—喜」结构，用原文句子作证，避免空谈旷达。
            </p>
          </div>
        </section>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            to="/demo?topic=赤壁赋"
            className="bg-[#1e3a5f] px-6 py-3.5 text-sm font-medium text-white hover:bg-[#152a45]"
          >
            体验 AI 生成一节课
          </Link>
          <Link to="/" className="px-4 py-3.5 text-sm text-[#1e3a5f] underline-offset-4 hover:underline">
            返回首页
          </Link>
        </div>
      </main>
    </div>
  )
}
