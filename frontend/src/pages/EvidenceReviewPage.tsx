import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { auditQuotes } from '../review/quoteAudit'

const SAMPLE_SOURCE = '师者，所以传道受业解惑也。人非生而知之者，孰能无惑？'
const SAMPLE_DRAFT = '教案引用：“师者，所以传道受业解惑也。”\n待复核引用：“师者，所以传道授业解惑也。”'
const LABELS: Record<string, string> = {
  missing_source: '请先补充原文', no_quotes: '未发现带引号的引用', supported: '逐字引用有原文支持',
  needs_review: '存在待复核引用', unsupported: '原文未找到这段引用',
}

export function EvidenceReviewPage() {
  const [source, setSource] = useState('')
  const [draft, setDraft] = useState('')
  const result = useMemo(() => auditQuotes(source, draft), [source, draft])
  function download() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = 'quotation-review.json'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-leaf underline">返回首页</Link>
      <p className="mt-8 text-sm text-leaf">备课前的原文复核</p>
      <h1 className="font-display mt-2 text-3xl sm:text-4xl">每一句引用，都能回到原文</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">粘贴你确认的教材原文与教案，检查带引号的逐字引用。核验在当前浏览器完成；本页不保存、不上传这两个输入。</p>
      <button className="mt-5 rounded-lg border border-leaf px-4 py-2 text-leaf" onClick={() => { setSource(SAMPLE_SOURCE); setDraft(SAMPLE_DRAFT) }}>试用《师说》错字案例</button>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block rounded-2xl bg-card p-5 ring-1 ring-ink/10">教材原文
          <textarea value={source} onChange={(e) => setSource(e.target.value)} maxLength={50000} rows={9} className="mt-3 w-full rounded-lg border border-ink/20 bg-white p-3" placeholder="粘贴教材原文，最多 50000 字符" />
        </label>
        <label className="block rounded-2xl bg-card p-5 ring-1 ring-ink/10">教案或课件文案
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={50000} rows={9} className="mt-3 w-full rounded-lg border border-ink/20 bg-white p-3" placeholder="支持中文引号和英文双引号，最多 50000 字符" />
        </label>
      </div>
      <section aria-live="polite" className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-ink/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">{LABELS[result.status]}</h2>
          <button onClick={download} className="rounded-lg bg-leaf px-4 py-2 text-white">导出复核记录</button>
        </div>
        <p className="mt-3 text-sm text-ink-muted">{result.supported} / {result.total} 条引用有逐字支持。这是文本匹配结果，请教师确认原文来源。</p>
        <ul className="mt-5 space-y-3">{result.quotes.map((q) => (
          <li key={q.offset} className={`rounded-lg border p-4 ${q.status === 'supported' ? 'border-leaf/30 bg-leaf/5' : 'border-amber-500/40 bg-amber-50'}`}>
            <p className="font-medium">“{q.text}”</p><p className="mt-1 text-sm">{LABELS[q.status]}</p>
          </li>
        ))}</ul>
        <p className="mt-5 text-sm text-ink-muted">{result.limitation} 导出的记录包含引用片段，请自行决定是否分享。</p>
      </section>
    </main>
  )
}
