import test from 'node:test'
import assert from 'node:assert/strict'
import { auditQuotes } from '../src/review/quoteAudit.ts'

test('detects a plausible but incorrect textbook character', () => {
  const r = auditQuotes('师者，所以传道受业解惑也。', '“师者，所以传道受业解惑也。”与“师者，所以传道授业解惑也。”')
  assert.equal(r.status, 'needs_review'); assert.equal(r.supported, 1); assert.equal(r.total, 2)
})
test('does not claim verification for missing sources or no quotes', () => {
  assert.equal(auditQuotes('', '“引用”').status, 'missing_source')
  assert.equal(auditQuotes('原文', '普通概述').status, 'no_quotes')
  assert.equal(auditQuotes('   ', '“引用”').supported, 0)
})
test('normalizes whitespace only and handles all supported quotation styles', () => {
  const r = auditQuotes('学 不可以已。', '「学不可以已。」 『学不可以已。』 "学不可以已。" “学不可以已！”')
  assert.equal(r.total, 4); assert.equal(r.supported, 3)
})
test('keeps duplicated quotations separately for teacher review', () => {
  const r = auditQuotes('原文', '“原文”与“原文”')
  assert.equal(r.total, 2); assert.notEqual(r.quotes[0].offset, r.quotes[1].offset)
})
