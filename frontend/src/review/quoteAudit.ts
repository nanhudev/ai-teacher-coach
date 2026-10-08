/** Exact quotation audit. A match establishes textual support, not source authority. */
export function auditQuotes(source: string, draft: string) {
  const normalized = source.replace(/\s+/gu, '')
  const matches = [...draft.matchAll(/“([^”\n]+)”|「([^」\n]+)」|『([^』\n]+)』|"([^"\n]+)"/gu)]
  const quotes = matches.map((m) => {
    const text = m[1] ?? m[2] ?? m[3] ?? m[4] ?? ''
    const needle = text.replace(/\s+/gu, '')
    const found = Boolean(normalized && needle && normalized.includes(needle))
    return { text, offset: m.index ?? 0, status: !normalized ? 'missing_source' : found ? 'supported' : 'unsupported' }
  })
  return {
    version: 1, sourceProvided: Boolean(normalized),
    status: !normalized ? 'missing_source' : quotes.length === 0 ? 'no_quotes' : quotes.every((q) => q.status === 'supported') ? 'supported' : 'needs_review',
    supported: quotes.filter((q) => q.status === 'supported').length,
    total: quotes.length, quotes,
    limitation: '仅核对带引号的逐字引用，忽略空白但保留字词和标点；不核验教材版本、释义、未加引号的内容或教学质量。',
  }
}
